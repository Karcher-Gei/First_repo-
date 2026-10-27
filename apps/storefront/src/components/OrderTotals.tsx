import { Price } from '@karcher/ui';

interface OrderTotalsInput {
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  shippingLines: { shippingMethod: { name: string } }[];
  discounts: { description: string; amountWithTax: number }[];
}

/** Subtotal, discounts, shipping and total of an order; all prices include VAT. */
export function OrderTotals({ order }: { order: OrderTotalsInput }) {
  const shipping = order.shippingLines[0];
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Sous-total</dt>
        <dd>
          <Price value={order.subTotalWithTax} />
        </dd>
      </div>
      {order.discounts.map((discount) => (
        <div key={discount.description} className="flex justify-between text-success">
          <dt>{discount.description}</dt>
          <dd>
            <Price value={discount.amountWithTax} />
          </dd>
        </div>
      ))}
      <div className="flex justify-between">
        <dt>Livraison{shipping ? ` (${shipping.shippingMethod.name})` : ''}</dt>
        <dd>
          {shipping ? <Price value={order.shippingWithTax} /> : 'Calculée à l’étape suivante'}
        </dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base">
        <dt className="font-bold">Total TTC</dt>
        <dd>
          <Price value={order.totalWithTax} />
        </dd>
      </div>
    </dl>
  );
}
