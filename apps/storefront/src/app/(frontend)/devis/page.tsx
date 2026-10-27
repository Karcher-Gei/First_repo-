import type { Metadata } from 'next';
import Link from 'next/link';

import { ActionForm, Field, SubmitButton, TextArea } from '@/components/forms';
import { getActiveCustomer } from '@/lib/account';
import { ACTIVE_ORDER } from '@/lib/order-queries';
import { QUOTE_PRODUCT } from '@/lib/request-queries';
import { shopQuery } from '@/lib/vendure';
import { shopSessionQuery } from '@/lib/session';

import { requestQuote } from './actions';

export const metadata: Metadata = { title: 'Demande de devis', robots: { index: false } };

interface QuoteLine {
  variantId: string;
  label: string;
  sku: string;
  quantity: number;
}

/** Products to quote: the whole cart (?panier=1), or one product from its page (?produit=&variante=). */
async function linesFor(params: {
  panier?: string;
  produit?: string;
  variante?: string;
}): Promise<QuoteLine[]> {
  if (params.panier) {
    const { activeOrder } = await shopSessionQuery(ACTIVE_ORDER, {});
    return (activeOrder?.lines ?? []).map((line) => ({
      variantId: line.productVariant.id,
      label: line.productVariant.product.name,
      sku: line.productVariant.sku,
      quantity: line.quantity,
    }));
  }
  if (params.produit) {
    const { product } = await shopQuery(QUOTE_PRODUCT, { id: params.produit });
    const variant = product?.variants.find((v) => v.id === params.variante) ?? product?.variants[0];
    return product && variant
      ? [{ variantId: variant.id, label: product.name, sku: variant.sku, quantity: 1 }]
      : [];
  }
  return [];
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ panier?: string; produit?: string; variante?: string }>;
}) {
  const params = await searchParams;
  const [lines, customer] = await Promise.all([linesFor(params), getActiveCustomer()]);

  return (
    <section className="max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black uppercase">Demande de devis</h1>
        <p>
          Professionnels, collectivités, grandes quantités : recevez une offre adaptée de notre
          équipe commerciale.
        </p>
      </header>
      {lines.length === 0 ? (
        <p>
          Choisissez d’abord un produit : le bouton « Demander un devis » se trouve sur chaque fiche
          produit et dans le panier.{' '}
          <Link href="/" className="font-semibold underline">
            Voir le catalogue
          </Link>
        </p>
      ) : (
        <ActionForm action={requestQuote}>
          <fieldset className="space-y-2">
            <legend className="mb-1 font-bold">Produits</legend>
            <ul className="divide-y divide-line rounded-card border border-line">
              {lines.map((line) => (
                <li key={line.variantId} className="flex items-center justify-between gap-4 p-3">
                  <span>
                    {line.label}
                    <span className="block text-xs text-ink-muted">Réf. {line.sku}</span>
                  </span>
                  <input type="hidden" name="line" value={line.variantId} />
                  <label className="flex items-center gap-2 text-sm">
                    Qté
                    <input
                      type="number"
                      name={`quantity-${line.variantId}`}
                      min={1}
                      max={9999}
                      defaultValue={line.quantity}
                      className="w-24 rounded-card border border-line px-3 py-2"
                    />
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nom complet"
              name="fullName"
              required
              autoComplete="name"
              defaultValue={customer ? `${customer.firstName} ${customer.lastName}` : ''}
            />
            <Field label="Société" name="company" autoComplete="organization" />
            <Field
              label="E-mail"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={customer?.emailAddress ?? ''}
            />
            <Field
              label="Téléphone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={customer?.phoneNumber ?? ''}
            />
          </div>
          <TextArea label="Votre besoin" name="message" required />
          <SubmitButton>Envoyer la demande</SubmitButton>
        </ActionForm>
      )}
    </section>
  );
}
