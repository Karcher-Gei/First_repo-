import { Price } from '@karcher/ui';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { CartLineQuantity } from '@/components/cart';
import { OrderTotals } from '@/components/OrderTotals';
import { ACTIVE_ORDER } from '@/lib/order-queries';
import { productHref } from '@/lib/paths';
import { shopSessionQuery } from '@/lib/session';

export const metadata: Metadata = { title: 'Panier', robots: { index: false } };

export default async function CartPage() {
  const { activeOrder } = await shopSessionQuery(ACTIVE_ORDER, {});
  const lines = activeOrder?.lines ?? [];

  if (!activeOrder || lines.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-black uppercase">Panier</h1>
        <p>Votre panier est vide.</p>
        <Link href="/" className="font-semibold underline">
          Continuer mes achats
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black uppercase">Panier</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-line rounded-card border border-line">
          {lines.map((line) => {
            const { productVariant: variant } = line;
            const href = productHref(variant.product);
            const image = line.featuredAsset ?? variant.product.featuredAsset;
            return (
              <li
                key={line.id}
                className="grid grid-cols-[5rem_1fr] gap-4 p-4 sm:grid-cols-[6rem_1fr_auto]"
              >
                {image ? (
                  <Image
                    src={`${image.preview}?preset=thumb`}
                    alt={variant.name}
                    width={96}
                    height={96}
                    className="aspect-square object-contain"
                  />
                ) : (
                  <span className="aspect-square bg-surface-muted" />
                )}
                <div className="space-y-1">
                  {href ? (
                    <Link href={href} className="font-semibold hover:underline">
                      {variant.product.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{variant.product.name}</span>
                  )}
                  <p className="text-sm text-ink-muted">Réf. {variant.sku}</p>
                  <p className="text-sm">
                    <Price value={line.unitPriceWithTax} /> l’unité
                  </p>
                </div>
                <div className="col-span-2 flex items-start justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end">
                  <CartLineQuantity lineId={line.id} quantity={line.quantity} />
                  <Price value={line.linePriceWithTax} />
                </div>
              </li>
            );
          })}
        </ul>
        <aside className="h-fit space-y-4 rounded-card bg-surface-muted p-5">
          <OrderTotals order={activeOrder} />
          <Link
            href="/commande"
            className="block rounded-card bg-brand px-5 py-3 text-center text-sm font-semibold uppercase tracking-wide hover:bg-brand-dark"
          >
            Passer la commande
          </Link>
          <Link href="/devis?panier=1" className="block text-center text-sm underline">
            Demander un devis pour ce panier
          </Link>
        </aside>
      </div>
    </section>
  );
}
