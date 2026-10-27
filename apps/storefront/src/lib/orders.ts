import 'server-only';

import { VendureError } from '@karcher/graphql';

import { ACTIVE_ORDER, ORDER_BY_CODE } from './order-queries';
import { shopSessionQuery } from './session';

/**
 * An order the shopper may see: one placed by them (or by this browser in the last 2 hours,
 * Vendure's default access rule), or their active order while it waits for payment.
 */
export async function findShopperOrder(code: string) {
  try {
    const { orderByCode } = await shopSessionQuery(ORDER_BY_CODE, { code });
    if (orderByCode) {
      return orderByCode;
    }
  } catch (error) {
    // Vendure answers FORBIDDEN for an order this session may not read.
    if (!(error instanceof VendureError)) {
      throw error;
    }
  }
  const { activeOrder } = await shopSessionQuery(ACTIVE_ORDER, {});
  return activeOrder?.code === code ? activeOrder : null;
}

const PAID_STATES = new Set([
  'PaymentAuthorized',
  'PaymentSettled',
  'PartiallyShipped',
  'Shipped',
  'PartiallyDelivered',
  'Delivered',
]);

export function isPaid(state: string): boolean {
  return PAID_STATES.has(state);
}

const STATE_LABELS: Record<string, string> = {
  AddingItems: 'Panier',
  ArrangingPayment: 'En attente de paiement',
  PaymentAuthorized: 'Payée',
  PaymentSettled: 'Payée',
  PartiallyShipped: 'Partiellement expédiée',
  Shipped: 'Expédiée',
  PartiallyDelivered: 'Partiellement livrée',
  Delivered: 'Livrée',
  Cancelled: 'Annulée',
};

export function orderStateLabel(state: string): string {
  return STATE_LABELS[state] ?? state;
}
