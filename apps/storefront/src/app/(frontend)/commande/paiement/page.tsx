import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ActionForm, SubmitButton } from '@/components/forms';
import { OrderTotals } from '@/components/OrderTotals';
import { ACTIVE_ORDER } from '@/lib/order-queries';
import { shopSessionQuery } from '@/lib/session';

import { retryKonnectPayment } from '../actions';

export const metadata: Metadata = { title: 'Paiement', robots: { index: false } };

/** Konnect's failure URL (?echec=1), and where a shopper comes back to an unpaid order. */
export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ echec?: string }>;
}) {
  const [{ echec }, { activeOrder }] = await Promise.all([
    searchParams,
    shopSessionQuery(ACTIVE_ORDER, {}),
  ]);
  if (!activeOrder || activeOrder.lines.length === 0) {
    redirect('/panier');
  }
  if (activeOrder.state !== 'ArrangingPayment') {
    redirect('/commande');
  }

  return (
    <section className="max-w-xl space-y-6">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
        Paiement
      </h1>
      {echec ? (
        <p
          role="alert"
          className="rounded-card border border-danger/40 bg-danger/5 p-3 text-danger"
        >
          Le paiement n’a pas abouti et aucun montant n’a été débité. Vous pouvez réessayer.
        </p>
      ) : null}
      <div className="rounded-card bg-surface-muted p-5">
        <p className="mb-3 text-sm">
          Commande <strong>{activeOrder.code}</strong>
        </p>
        <OrderTotals order={activeOrder} />
      </div>
      <ActionForm action={retryKonnectPayment}>
        <SubmitButton>Payer avec Konnect</SubmitButton>
      </ActionForm>
      <Link href="/commande" className="inline-block text-sm underline">
        Modifier l’adresse ou la livraison
      </Link>
    </section>
  );
}
