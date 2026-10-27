'use server';

import type { FormState } from '@/components/forms';
import { thrownErrorMessage } from '@/lib/errors';
import { isEmail, missingFields, optionalText, text } from '@/lib/forms';
import { REQUEST_QUOTE } from '@/lib/request-queries';
import { shopSessionMutation } from '@/lib/session';

/** Lines arrive as `line` inputs holding "variantId" plus a `quantity-<variantId>` input. */
function quoteLines(formData: FormData) {
  return formData
    .getAll('line')
    .map((value) => String(value))
    .map((productVariantId) => ({
      productVariantId,
      quantity: Math.trunc(Number(formData.get(`quantity-${productVariantId}`) ?? 1)),
    }))
    .filter((line) => line.productVariantId && line.quantity > 0 && line.quantity < 10_000);
}

export async function requestQuote(_state: FormState, formData: FormData): Promise<FormState> {
  if (missingFields(formData, ['fullName', 'email', 'message'])) {
    return { error: 'Remplissez tous les champs obligatoires.' };
  }
  const email = text(formData, 'email');
  if (!isEmail(email)) {
    return { error: 'Adresse e-mail invalide.' };
  }
  const lines = quoteLines(formData);
  if (lines.length === 0) {
    return { error: 'Ajoutez au moins un produit à votre demande.' };
  }
  try {
    await shopSessionMutation(REQUEST_QUOTE, {
      input: {
        fullName: text(formData, 'fullName'),
        email,
        phone: optionalText(formData, 'phone'),
        company: optionalText(formData, 'company'),
        message: text(formData, 'message'),
        lines,
      },
    });
    return {
      success:
        'Votre demande de devis est envoyée. Notre équipe commerciale vous recontacte rapidement.',
    };
  } catch (error) {
    return { error: thrownErrorMessage(error) };
  }
}
