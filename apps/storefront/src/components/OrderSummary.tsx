import { formatPrice } from '@karcher/ui';

import { OrderTotals } from './OrderTotals';

interface OrderSummaryInput {
  lines: {
    id: string;
    quantity: number;
    linePriceWithTax: number;
    productVariant: { sku: string; product: { name: string } };
  }[];
  shippingAddress: {
    fullName?: string | null;
    streetLine1?: string | null;
    streetLine2?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    phoneNumber?: string | null;
  } | null;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  shippingLines: { shippingMethod: { name: string } }[];
  discounts: { description: string; amountWithTax: number }[];
}

/** Lines, delivery address and totals of a placed order. */
export function OrderSummary({ order }: { order: OrderSummaryInput }) {
  const address = order.shippingAddress;
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <table className="w-full text-sm">
          <thead className="text-left text-ink-muted">
            <tr>
              <th className="pb-2 font-normal">Produit</th>
              <th className="pb-2 text-right font-normal">Qté</th>
              <th className="pb-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-2">
                  {line.productVariant.product.name}
                  <span className="block text-xs text-ink-muted">
                    Réf. {line.productVariant.sku}
                  </span>
                </td>
                <td className="py-2 text-right">{line.quantity}</td>
                <td className="whitespace-nowrap py-2 text-right">
                  {formatPrice(line.linePriceWithTax)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <OrderTotals order={order} />
      </div>
      {address?.streetLine1 ? (
        <address className="h-fit rounded-card bg-surface-muted p-4 text-sm not-italic">
          <strong className="mb-1 block">Livraison</strong>
          {address.fullName}
          <br />
          {address.streetLine1}
          {address.streetLine2 ? (
            <>
              <br />
              {address.streetLine2}
            </>
          ) : null}
          <br />
          {address.postalCode} {address.city}, {address.province}
          <br />
          {address.phoneNumber}
        </address>
      ) : null}
    </div>
  );
}
