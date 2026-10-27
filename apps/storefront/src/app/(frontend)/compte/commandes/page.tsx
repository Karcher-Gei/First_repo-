import { formatPrice } from '@karcher/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccountNav } from '@/components/AccountNav';
import { requireCustomer } from '@/lib/account';
import { CUSTOMER_ORDERS } from '@/lib/account-queries';
import { orderStateLabel } from '@/lib/orders';
import { shopSessionQuery } from '@/lib/session';

export const metadata: Metadata = { title: 'Mes commandes' };

const PAGE_SIZE = 20;
const dateFormat = new Intl.DateTimeFormat('fr-TN', { dateStyle: 'long' });

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireCustomer('/compte/commandes');
  const page = Math.max(1, Math.trunc(Number((await searchParams).page) || 1));
  const { activeCustomer } = await shopSessionQuery(CUSTOMER_ORDERS, {
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  const orders = activeCustomer?.orders ?? { items: [], totalItems: 0 };
  const pages = Math.ceil(orders.totalItems / PAGE_SIZE);

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
        Mes commandes
      </h1>
      <AccountNav current="/compte/commandes" />
      {orders.items.length === 0 ? (
        <p>Vous n’avez pas encore passé de commande.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-ink-muted">
            <tr>
              <th className="pb-2 font-normal">Commande</th>
              <th className="pb-2 font-normal">Date</th>
              <th className="pb-2 font-normal">Statut</th>
              <th className="pb-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.items.map((order) => (
              <tr key={order.id}>
                <td className="py-3">
                  <Link
                    href={`/compte/commandes/${order.code}`}
                    className="font-semibold underline"
                  >
                    {order.code}
                  </Link>
                </td>
                <td className="py-3">
                  {order.orderPlacedAt ? dateFormat.format(new Date(order.orderPlacedAt)) : '—'}
                </td>
                <td className="py-3">{orderStateLabel(order.state)}</td>
                <td className="whitespace-nowrap py-3 text-right">
                  {formatPrice(order.totalWithTax)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pages > 1 ? (
        <nav aria-label="Pages" className="flex gap-4 text-sm">
          {page > 1 ? <Link href={`/compte/commandes?page=${page - 1}`}>← Précédentes</Link> : null}
          {page < pages ? (
            <Link href={`/compte/commandes?page=${page + 1}`}>Suivantes →</Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
