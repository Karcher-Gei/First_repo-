import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { OrderSummary } from '@/components/OrderSummary';
import { findShopperOrder, isPaid } from '@/lib/orders';

export const metadata: Metadata = { title: 'Confirmation de commande', robots: { index: false } };

/** Konnect's success URL. Konnect's webhook settles the payment, sometimes a few seconds after the redirect. */
export default async function ConfirmationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await findShopperOrder(code);
  if (!order) {
    notFound();
  }
  if (order.state === 'AddingItems') {
    redirect('/commande');
  }

  if (!isPaid(order.state)) {
    return (
      <section className="space-y-4">
        {/* Checks again until the webhook has settled the payment. */}
        <meta httpEquiv="refresh" content="5" />
        <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
          Paiement en cours de confirmation
        </h1>
        <p>
          Nous attendons la confirmation de Konnect pour la commande <strong>{order.code}</strong>.
          Cette page se met à jour automatiquement.
        </p>
        <p className="text-sm text-ink-muted">
          Le paiement n’a pas abouti ?{' '}
          <Link href="/commande/paiement" className="font-semibold underline">
            Réessayer le paiement
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
          Merci pour votre commande
        </h1>
        <p>
          Votre commande <strong>{order.code}</strong> est confirmée. Un e-mail de confirmation a
          été envoyé à {order.customer?.emailAddress}.
        </p>
      </header>
      <OrderSummary order={order} />
      <Link href="/" className="inline-block font-semibold underline">
        Retour à la boutique
      </Link>
    </section>
  );
}
