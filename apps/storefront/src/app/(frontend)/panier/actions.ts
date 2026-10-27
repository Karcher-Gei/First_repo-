'use server';

import { refresh } from 'next/cache';

import type { FormState } from '@/components/forms';
import { changeActiveOrder } from '@/lib/cart';
import { resultError, thrownErrorMessage } from '@/lib/errors';
import { ADD_TO_CART, ADJUST_LINE, REMOVE_LINE } from '@/lib/order-queries';
import { shopSessionMutation } from '@/lib/session';

function quantityOf(formData: FormData): number {
  const quantity = Math.trunc(Number(formData.get('quantity') ?? 1));
  return Number.isFinite(quantity) ? quantity : 1;
}

export async function addToCart(_state: FormState, formData: FormData): Promise<FormState> {
  const variantId = String(formData.get('variantId') ?? '');
  const quantity = quantityOf(formData);
  if (!variantId || quantity < 1) {
    return { error: 'Choisissez une quantité.' };
  }
  try {
    const result = await changeActiveOrder(
      async () => (await shopSessionMutation(ADD_TO_CART, { variantId, quantity })).addItemToOrder,
    );
    if (result.__typename === 'InsufficientStockError') {
      // Vendure still adds the units in stock.
      return result.quantityAvailable > 0
        ? {
            error: `Stock insuffisant : ${result.quantityAvailable} unité(s) seulement ont été ajoutées au panier.`,
          }
        : { error: 'Ce produit n’est plus en stock.' };
    }
    const error = resultError(result);
    return error ? { error } : { success: 'Produit ajouté au panier.' };
  } catch (error) {
    return { error: thrownErrorMessage(error) };
  }
}

/** Sets a cart line's quantity; 0 removes the line. */
export async function updateCartLine(_state: FormState, formData: FormData): Promise<FormState> {
  const lineId = String(formData.get('lineId') ?? '');
  const quantity = quantityOf(formData);
  try {
    const result = await changeActiveOrder(async () =>
      quantity > 0
        ? (await shopSessionMutation(ADJUST_LINE, { lineId, quantity })).adjustOrderLine
        : (await shopSessionMutation(REMOVE_LINE, { lineId })).removeOrderLine,
    );
    refresh();
    const error = resultError(result);
    return error ? { error } : null;
  } catch (error) {
    return { error: thrownErrorMessage(error) };
  }
}
