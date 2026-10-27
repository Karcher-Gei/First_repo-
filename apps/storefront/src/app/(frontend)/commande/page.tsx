import { formatPrice } from '@karcher/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AddressFields } from '@/components/AddressFields';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { OrderTotals } from '@/components/OrderTotals';
import { CHECKOUT_OPTIONS } from '@/lib/order-queries';
import { shopSessionQuery } from '@/lib/session';

import { placeOrder } from './actions';

export const metadata: Metadata = { title: 'Commande', robots: { index: false } };

const PAYMENT_LABELS: Record<string, string> = {
  konnect: 'Carte bancaire, e-DINAR ou wallet (Konnect)',
};

export default async function CheckoutPage() {
  const {
    activeOrder: order,
    activeCustomer,
    eligibleShippingMethods,
    eligiblePaymentMethods,
  } = await shopSessionQuery(CHECKOUT_OPTIONS, {});
  if (!order || order.lines.length === 0) {
    redirect('/panier');
  }

  const savedAddress =
    activeCustomer?.addresses?.find((address) => address.defaultShippingAddress) ??
    activeCustomer?.addresses?.[0];
  const address = order.shippingAddress?.streetLine1 ? order.shippingAddress : savedAddress;
  const contact = activeCustomer ?? order.customer;
  const selectedShipping =
    order.shippingLines[0]?.shippingMethod.id ?? eligibleShippingMethods[0]?.id;
  const paymentMethods = eligiblePaymentMethods.filter((method) => method.isEligible);

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
        Commande
      </h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ActionForm action={placeOrder} className="space-y-8">
          <input type="hidden" name="signedIn" value={activeCustomer ? '1' : '0'} />

          <fieldset className="space-y-4">
            <legend className="mb-2 font-heading text-2xl font-bold uppercase">
              Vos coordonnées
            </legend>
            {activeCustomer ? (
              <p className="text-sm">
                Connecté en tant que <strong>{activeCustomer.emailAddress}</strong>.
              </p>
            ) : (
              <>
                <p className="text-sm">
                  Déjà client ?{' '}
                  <Link
                    href="/compte/connexion?retour=/commande"
                    className="font-semibold underline"
                  >
                    Connectez-vous
                  </Link>
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Prénom"
                    name="firstName"
                    required
                    autoComplete="given-name"
                    defaultValue={contact?.firstName ?? ''}
                  />
                  <Field
                    label="Nom"
                    name="lastName"
                    required
                    autoComplete="family-name"
                    defaultValue={contact?.lastName ?? ''}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="E-mail"
                      name="emailAddress"
                      type="email"
                      required
                      autoComplete="email"
                      defaultValue={contact?.emailAddress ?? ''}
                    />
                  </div>
                </div>
              </>
            )}
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 font-heading text-2xl font-bold uppercase">
              Adresse de livraison
            </legend>
            <AddressFields
              withName={Boolean(activeCustomer)}
              values={{
                fullName:
                  address?.fullName ??
                  (activeCustomer ? `${activeCustomer.firstName} ${activeCustomer.lastName}` : ''),
                ...address,
                phoneNumber: address?.phoneNumber ?? contact?.phoneNumber ?? '',
              }}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 font-heading text-2xl font-bold uppercase">Livraison</legend>
            {eligibleShippingMethods.length === 0 ? (
              <p className="text-sm text-danger">
                Aucun mode de livraison disponible pour cette commande.
              </p>
            ) : (
              eligibleShippingMethods.map((method) => (
                <label
                  key={method.id}
                  className="flex items-start gap-3 rounded-card border border-line p-3"
                >
                  <input
                    type="radio"
                    name="shippingMethodId"
                    value={method.id}
                    required
                    defaultChecked={method.id === selectedShipping}
                    className="mt-1"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold">{method.name}</span>
                    {method.description ? (
                      <span
                        className="block text-sm text-ink-muted"
                        dangerouslySetInnerHTML={{ __html: method.description }}
                      />
                    ) : null}
                  </span>
                  <span className="font-semibold">
                    {method.priceWithTax === 0 ? 'Gratuite' : formatPrice(method.priceWithTax)}
                  </span>
                </label>
              ))
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 font-heading text-2xl font-bold uppercase">Paiement</legend>
            {paymentMethods.map((method, index) => (
              <label
                key={method.code}
                className="flex items-start gap-3 rounded-card border border-line p-3"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.code}
                  required
                  defaultChecked={index === 0}
                  className="mt-1"
                />
                <span className="font-semibold">{PAYMENT_LABELS[method.code] ?? method.name}</span>
              </label>
            ))}
            <p className="text-xs text-ink-muted">
              Le paiement par carte se fait sur la page sécurisée de Konnect ; vous revenez ensuite
              sur le site.
            </p>
          </fieldset>

          <SubmitButton className="w-full sm:w-auto">Commander et payer</SubmitButton>
        </ActionForm>

        <aside className="h-fit space-y-4 rounded-card bg-surface-muted p-5">
          <h2 className="font-bold">Récapitulatif</h2>
          <ul className="space-y-2 text-sm">
            {order.lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span>
                  {line.quantity} × {line.productVariant.product.name}
                </span>
                <span className="whitespace-nowrap">{formatPrice(line.linePriceWithTax)}</span>
              </li>
            ))}
          </ul>
          <OrderTotals order={order} />
          <Link href="/panier" className="block text-center text-sm underline">
            Modifier le panier
          </Link>
        </aside>
      </div>
    </section>
  );
}
