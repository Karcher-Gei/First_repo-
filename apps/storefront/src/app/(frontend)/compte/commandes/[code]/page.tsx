import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AccountNav } from '@/components/AccountNav';
import { OrderSummary } from '@/components/OrderSummary';
import { requireCustomer } from '@/lib/account';
import { findShopperOrder, orderStateLabel } from '@/lib/orders';

export const metadata: Metadata = { title: 'Détail de la commande' };

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const customer = await requireCustomer(`/compte/commandes/${code}`);
  const order = await findShopperOrder(code);
  if (!order || order.customer?.id !== customer.id) {
    notFound();
  }
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black uppercase">Commande {order.code}</h1>
      <AccountNav current="/compte/commandes" />
      <p>
        Statut : <strong>{orderStateLabel(order.state)}</strong>
      </p>
      <OrderSummary order={order} />
      <Link href="/compte/commandes" className="inline-block text-sm underline">
        ← Toutes mes commandes
      </Link>
    </section>
  );
}
