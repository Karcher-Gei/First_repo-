import 'server-only';

import type { ErrorResultLike } from './errors';
import { CART_COUNT, TRANSITION_ORDER } from './order-queries';
import { shopSessionMutation, shopSessionQuery } from './session';

/**
 * Runs a change to the active order. An order waiting for payment (the shopper left the Konnect
 * page) is locked by Vendure: it is moved back to AddingItems and the change is tried once more.
 */
export async function changeActiveOrder<T extends ErrorResultLike | null>(
  change: () => Promise<T>,
): Promise<T> {
  const result = await change();
  if (result?.errorCode !== 'ORDER_MODIFICATION_ERROR') {
    return result;
  }
  await shopSessionMutation(TRANSITION_ORDER, { state: 'AddingItems' });
  return change();
}

export async function cartCount(): Promise<number> {
  const { activeOrder } = await shopSessionQuery(CART_COUNT, {});
  return activeOrder?.totalQuantity ?? 0;
}
