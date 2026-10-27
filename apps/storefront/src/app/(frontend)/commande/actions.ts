'use server';

import { VendureError } from '@karcher/graphql';
import { redirect } from 'next/navigation';

import type { FormState } from '@/components/forms';
import { changeActiveOrder } from '@/lib/cart';
import { errorMessage, resultError, thrownErrorMessage } from '@/lib/errors';
import { ADDRESS_REQUIRED, addressFromForm, isEmail, missingFields, text } from '@/lib/forms';
import {
  ADD_PAYMENT,
  CREATE_KONNECT_PAYMENT,
  SET_CUSTOMER_FOR_ORDER,
  SET_SHIPPING_ADDRESS,
  SET_SHIPPING_METHOD,
  TRANSITION_ORDER,
} from '@/lib/order-queries';
import { shopSessionMutation } from '@/lib/session';

const KONNECT = 'konnect';

/** Saves the checkout details on the active order, then sends the shopper to pay. */
export async function placeOrder(_state: FormState, formData: FormData): Promise<FormState> {
  const signedIn = formData.get('signedIn') === '1';
  const required = [...ADDRESS_REQUIRED, 'shippingMethodId', 'paymentMethod'];
  if (!signedIn) {
    required.push('emailAddress', 'firstName', 'lastName');
  }
  if (missingFields(formData, required)) {
    return { error: 'Remplissez tous les champs obligatoires.' };
  }
  const emailAddress = text(formData, 'emailAddress');
  if (!signedIn && !isEmail(emailAddress)) {
    return { error: 'Adresse e-mail invalide.' };
  }
  const firstName = text(formData, 'firstName');
  const lastName = text(formData, 'lastName');
  const address = addressFromForm(
    formData,
    text(formData, 'fullName') || `${firstName} ${lastName}`,
  );
  const paymentMethod = text(formData, 'paymentMethod');

  let nextUrl: string;
  try {
    const error = await saveCheckoutDetails({
      customer: signedIn
        ? null
        : { emailAddress, firstName, lastName, phoneNumber: address.phoneNumber },
      address,
      shippingMethodId: text(formData, 'shippingMethodId'),
    });
    if (error) {
      return { error };
    }
    if (paymentMethod === KONNECT) {
      nextUrl = await startKonnectPayment();
    } else {
      const result = await payWithoutRedirect(paymentMethod);
      if ('error' in result) {
        return { error: result.error };
      }
      nextUrl = `/commande/confirmation/${result.code}`;
    }
  } catch (error) {
    if (paymentMethod === KONNECT && error instanceof VendureError) {
      console.error('[konnect]', error.message);
      return {
        error:
          'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques minutes.',
      };
    }
    return { error: thrownErrorMessage(error) };
  }
  redirect(nextUrl);
}

/** Retries Konnect for an order already waiting for payment (after a failed or abandoned attempt). */
export async function retryKonnectPayment(): Promise<FormState> {
  let payUrl: string;
  try {
    payUrl = await startKonnectPayment();
  } catch (error) {
    if (error instanceof VendureError) {
      console.error('[konnect]', error.message);
      return {
        error:
          'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques minutes.',
      };
    }
    throw error;
  }
  redirect(payUrl);
}

async function saveCheckoutDetails(input: {
  customer: {
    emailAddress: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null;
  address: ReturnType<typeof addressFromForm>;
  shippingMethodId: string;
}): Promise<string | null> {
  if (input.customer) {
    const customer = input.customer;
    const result = await changeActiveOrder(
      async () =>
        (await shopSessionMutation(SET_CUSTOMER_FOR_ORDER, { input: customer }))
          .setCustomerForOrder,
    );
    // A shopper who signed in on another tab is already attached to the order.
    if (
      result.__typename === 'EmailAddressConflictError' ||
      result.__typename === 'GuestCheckoutError'
    ) {
      return errorMessage('GUEST_CHECKOUT_ERROR');
    }
    if (result.__typename !== 'AlreadyLoggedInError' && resultError(result)) {
      return resultError(result);
    }
  }
  const address = await changeActiveOrder(
    async () =>
      (await shopSessionMutation(SET_SHIPPING_ADDRESS, { input: input.address }))
        .setOrderShippingAddress,
  );
  if (resultError(address)) {
    return resultError(address);
  }
  const shipping = await changeActiveOrder(
    async () =>
      (await shopSessionMutation(SET_SHIPPING_METHOD, { ids: [input.shippingMethodId] }))
        .setOrderShippingMethod,
  );
  return resultError(shipping);
}

/** Returns Konnect's payment page URL; createKonnectPaymentIntent moves the order to ArrangingPayment. */
async function startKonnectPayment(): Promise<string> {
  const { createKonnectPaymentIntent } = await shopSessionMutation(CREATE_KONNECT_PAYMENT, {});
  return createKonnectPaymentIntent;
}

/** Payment methods settled in one call, such as the dev test method. */
async function payWithoutRedirect(method: string): Promise<{ code: string } | { error: string }> {
  const { transitionOrderToState } = await shopSessionMutation(TRANSITION_ORDER, {
    state: 'ArrangingPayment',
  });
  if (transitionOrderToState?.__typename !== 'Order' && resultError(transitionOrderToState)) {
    return { error: resultError(transitionOrderToState)! };
  }
  const { addPaymentToOrder } = await shopSessionMutation(ADD_PAYMENT, {
    input: { method, metadata: {} },
  });
  if (addPaymentToOrder.__typename === 'Order') {
    return { code: addPaymentToOrder.code };
  }
  return { error: resultError(addPaymentToOrder) ?? 'Le paiement a échoué.' };
}
