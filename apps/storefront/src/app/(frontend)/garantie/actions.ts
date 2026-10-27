'use server';

import type { FormState } from '@/components/forms';
import { thrownErrorMessage } from '@/lib/errors';
import { isEmail, missingFields, optionalText, text } from '@/lib/forms';
import { REGISTER_WARRANTY } from '@/lib/request-queries';
import { shopSessionMutation } from '@/lib/session';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function registerWarranty(_state: FormState, formData: FormData): Promise<FormState> {
  if (
    missingFields(formData, ['fullName', 'email', 'productSku', 'serialNumber', 'purchaseDate'])
  ) {
    return { error: 'Remplissez tous les champs obligatoires.' };
  }
  const email = text(formData, 'email');
  if (!isEmail(email)) {
    return { error: 'Adresse e-mail invalide.' };
  }
  const purchaseDate = text(formData, 'purchaseDate');
  if (
    !DATE_RE.test(purchaseDate) ||
    Number.isNaN(Date.parse(purchaseDate)) ||
    Date.parse(purchaseDate) > Date.now()
  ) {
    return { error: 'La date d’achat est invalide.' };
  }
  try {
    await shopSessionMutation(REGISTER_WARRANTY, {
      input: {
        fullName: text(formData, 'fullName'),
        email,
        phone: optionalText(formData, 'phone'),
        productSku: text(formData, 'productSku'),
        serialNumber: text(formData, 'serialNumber'),
        purchaseDate,
        purchasedFrom: optionalText(formData, 'purchasedFrom'),
      },
    });
    return {
      success:
        'Votre machine est enregistrée. Conservez votre preuve d’achat avec le numéro de série.',
    };
  } catch (error) {
    return { error: thrownErrorMessage(error) };
  }
}
