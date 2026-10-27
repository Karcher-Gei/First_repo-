'use client';

import { cn, Price } from '@karcher/ui';
import Link from 'next/link';
import { useState } from 'react';

import { AddToCartForm } from './cart';

export interface BuyBoxVariant {
  id: string;
  name: string;
  sku: string;
  priceWithTax: number;
  stockLevel: string;
  options: { name: string }[];
}

const STOCK: Record<string, { label: string; dot: string; text: string }> = {
  IN_STOCK: { label: 'En stock', dot: 'bg-success', text: 'text-success' },
  LOW_STOCK: { label: 'Stock limité', dot: 'bg-warning', text: 'text-warning' },
  OUT_OF_STOCK: { label: 'Rupture de stock', dot: 'bg-danger', text: 'text-danger' },
};

function variantLabel(variant: BuyBoxVariant): string {
  return variant.options.length ? variant.options.map((o) => o.name).join(' / ') : variant.name;
}

/**
 * Price, stock, version choice (PrestaShop combinations), add to cart and quote request; on small
 * screens a bar with the price and the add button stays at the bottom of the screen.
 */
export function BuyBox({ productId, variants }: { productId: string; variants: BuyBoxVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const variant = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!variant) {
    return null;
  }
  const stock = STOCK[variant.stockLevel];
  const outOfStock = variant.stockLevel === 'OUT_OF_STOCK';

  return (
    <div className="space-y-5 rounded-card bg-surface p-5 ring-1 ring-line md:p-6">
      {variants.length > 1 ? (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-bold uppercase tracking-wide">Version</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  'cursor-pointer rounded-card px-4 py-2 text-sm font-semibold ring-1 transition',
                  v.id === variant.id ? 'bg-ink text-white ring-ink' : 'ring-line hover:ring-ink',
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={v.id === variant.id}
                  onChange={() => setSelectedId(v.id)}
                  className="sr-only"
                />
                {variantLabel(v)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-heading text-4xl font-extrabold leading-none">
            <Price value={variant.priceWithTax} />
          </p>
          <p className="mt-1 text-xs text-ink-muted">Prix TTC · Réf. {variant.sku}</p>
        </div>
        {stock ? (
          <p className={cn('flex items-center gap-2 text-sm font-semibold', stock.text)}>
            <span aria-hidden="true" className={cn('size-2.5 rounded-full', stock.dot)} />
            {stock.label}
          </p>
        ) : null}
      </div>

      <AddToCartForm key={variant.id} variantId={variant.id} disabled={outOfStock} />

      <Link
        href={`/devis?produit=${productId}&variante=${variant.id}`}
        className="flex h-11 items-center justify-center rounded-card text-sm font-bold uppercase tracking-wide ring-1 ring-ink hover:bg-ink hover:text-white"
      >
        Demander un devis
      </Link>
      <p className="text-center text-xs text-ink-muted">
        Professionnels et grandes quantités : recevez une offre adaptée.
      </p>

      {/* Small screens: price and add button stay in reach while scrolling. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-muted">{variantLabel(variant)}</p>
          <p className="font-heading text-xl font-extrabold leading-none">
            <Price value={variant.priceWithTax} />
          </p>
        </div>
        <div className="ml-auto w-48">
          <AddToCartForm
            key={`bar-${variant.id}`}
            variantId={variant.id}
            disabled={outOfStock}
            compact
          />
        </div>
      </div>
    </div>
  );
}
