'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

import type { FormState } from '@/components/forms';
import { safeReturnPath } from '@/lib/account';
import {
  CONFIRM_EMAIL_CHANGE,
  CREATE_ADDRESS,
  DELETE_ADDRESS,
  LOGIN,
  LOGOUT,
  REGISTER,
  REQUEST_EMAIL_CHANGE,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD,
  SET_DEFAULT_ADDRESS,
  UPDATE_CUSTOMER,
  UPDATE_PASSWORD,
  VERIFY_ACCOUNT,
} from '@/lib/account-queries';
import { resultError, thrownErrorMessage } from '@/lib/errors';
import {
  ADDRESS_REQUIRED,
  addressFromForm,
  isEmail,
  missingFields,
  optionalText,
  text,
} from '@/lib/forms';
import { clearSession, shopSessionMutation } from '@/lib/session';

const MIN_PASSWORD = 8;
const SHORT_PASSWORD = `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`;

/** Runs `work`; a failed call to Vendure becomes a form error, while redirects pass through. */
async function attempt(work: () => Promise<FormState>): Promise<FormState> {
  try {
    return await work();
  } catch (error) {
    return { error: thrownErrorMessage(error) };
  }
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const username = text(formData, 'emailAddress');
  const password = String(formData.get('password') ?? '');
  if (!username || !password) {
    return { error: 'Saisissez votre e-mail et votre mot de passe.' };
  }
  const state = await attempt(async () => {
    const { login } = await shopSessionMutation(LOGIN, { username, password, rememberMe: true });
    const error = resultError(login);
    return error ? { error } : null;
  });
  if (state) {
    return state;
  }
  redirect(safeReturnPath(text(formData, 'retour')));
}

export async function logout(): Promise<void> {
  try {
    await shopSessionMutation(LOGOUT, {});
  } finally {
    await clearSession();
  }
  redirect('/');
}

export async function register(_state: FormState, formData: FormData): Promise<FormState> {
  if (missingFields(formData, ['firstName', 'lastName', 'emailAddress', 'password'])) {
    return { error: 'Remplissez tous les champs obligatoires.' };
  }
  const emailAddress = text(formData, 'emailAddress');
  const password = String(formData.get('password'));
  if (!isEmail(emailAddress)) {
    return { error: 'Adresse e-mail invalide.' };
  }
  if (password.length < MIN_PASSWORD) {
    return { error: SHORT_PASSWORD };
  }
  return attempt(async () => {
    const { registerCustomerAccount } = await shopSessionMutation(REGISTER, {
      input: {
        emailAddress,
        password,
        firstName: text(formData, 'firstName'),
        lastName: text(formData, 'lastName'),
        phoneNumber: optionalText(formData, 'phoneNumber'),
      },
    });
    const error = resultError(registerCustomerAccount);
    // Vendure answers the same way for an address that already has an account, so nobody can probe for them.
    return error
      ? { error }
      : { success: `Compte créé. Ouvrez le lien envoyé à ${emailAddress} pour l’activer.` };
  });
}

export async function verifyAccount(_state: FormState, formData: FormData): Promise<FormState> {
  const state = await attempt(async () => {
    const { verifyCustomerAccount } = await shopSessionMutation(VERIFY_ACCOUNT, {
      token: text(formData, 'token'),
    });
    const error = resultError(verifyCustomerAccount);
    return error ? { error } : null;
  });
  if (state) {
    return state;
  }
  redirect('/compte?active=1');
}

export async function requestPasswordReset(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const emailAddress = text(formData, 'emailAddress');
  if (!isEmail(emailAddress)) {
    return { error: 'Adresse e-mail invalide.' };
  }
  return attempt(async () => {
    await shopSessionMutation(REQUEST_PASSWORD_RESET, { emailAddress });
    return {
      success: `Si un compte existe pour ${emailAddress}, un lien de réinitialisation vient d’y être envoyé.`,
    };
  });
}

export async function resetPassword(_state: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get('password') ?? '');
  if (password.length < MIN_PASSWORD) {
    return { error: SHORT_PASSWORD };
  }
  const state = await attempt(async () => {
    const { resetPassword } = await shopSessionMutation(RESET_PASSWORD, {
      token: text(formData, 'token'),
      password,
    });
    const error = resultError(resetPassword);
    return error ? { error } : null;
  });
  if (state) {
    return state;
  }
  redirect('/compte');
}

export async function confirmEmailChange(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return attempt(async () => {
    const { updateCustomerEmailAddress } = await shopSessionMutation(CONFIRM_EMAIL_CHANGE, {
      token: text(formData, 'token'),
    });
    const error = resultError(updateCustomerEmailAddress);
    return error ? { error } : { success: 'Votre nouvelle adresse e-mail est confirmée.' };
  });
}

export async function updateProfile(_state: FormState, formData: FormData): Promise<FormState> {
  if (missingFields(formData, ['firstName', 'lastName'])) {
    return { error: 'Le prénom et le nom sont obligatoires.' };
  }
  return attempt(async () => {
    await shopSessionMutation(UPDATE_CUSTOMER, {
      input: {
        firstName: text(formData, 'firstName'),
        lastName: text(formData, 'lastName'),
        phoneNumber: optionalText(formData, 'phoneNumber'),
      },
    });
    refresh();
    return { success: 'Vos informations sont enregistrées.' };
  });
}

export async function changePassword(_state: FormState, formData: FormData): Promise<FormState> {
  const newPassword = String(formData.get('newPassword') ?? '');
  if (newPassword.length < MIN_PASSWORD) {
    return { error: SHORT_PASSWORD };
  }
  return attempt(async () => {
    const { updateCustomerPassword } = await shopSessionMutation(UPDATE_PASSWORD, {
      currentPassword: String(formData.get('currentPassword') ?? ''),
      newPassword,
    });
    const error = resultError(updateCustomerPassword);
    return error ? { error } : { success: 'Mot de passe modifié.' };
  });
}

export async function requestEmailChange(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const newEmailAddress = text(formData, 'newEmailAddress');
  if (!isEmail(newEmailAddress)) {
    return { error: 'Adresse e-mail invalide.' };
  }
  return attempt(async () => {
    const { requestUpdateCustomerEmailAddress } = await shopSessionMutation(REQUEST_EMAIL_CHANGE, {
      password: String(formData.get('password') ?? ''),
      newEmailAddress,
    });
    const error = resultError(requestUpdateCustomerEmailAddress);
    return error
      ? { error }
      : { success: `Ouvrez le lien envoyé à ${newEmailAddress} pour confirmer le changement.` };
  });
}

export async function addAddress(_state: FormState, formData: FormData): Promise<FormState> {
  if (missingFields(formData, ['fullName', ...ADDRESS_REQUIRED])) {
    return { error: 'Remplissez tous les champs obligatoires.' };
  }
  return attempt(async () => {
    const isDefault = formData.get('default') === 'on';
    await shopSessionMutation(CREATE_ADDRESS, {
      input: {
        ...addressFromForm(formData),
        defaultShippingAddress: isDefault,
        defaultBillingAddress: isDefault,
      },
    });
    refresh();
    return { success: 'Adresse ajoutée.' };
  });
}

export async function setDefaultAddress(_state: FormState, formData: FormData): Promise<FormState> {
  return attempt(async () => {
    await shopSessionMutation(SET_DEFAULT_ADDRESS, { id: text(formData, 'id') });
    refresh();
    return null;
  });
}

export async function deleteAddress(_state: FormState, formData: FormData): Promise<FormState> {
  return attempt(async () => {
    await shopSessionMutation(DELETE_ADDRESS, { id: text(formData, 'id') });
    refresh();
    return null;
  });
}
