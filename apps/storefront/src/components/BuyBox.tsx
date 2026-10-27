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

const STOCK: Record<string, { label: string; className: string }> = {
  IN_STOCK: { label: 'En stock', className: 'text-success' },
  LOW_STOCK: { label: 'Stock limité', className: 'text-warning' },
  OUT_OF_STOCK: { label: 'Rupture de stock', className: 'text-danger' },
};

/** Price, stock, add to cart and quote link for the chosen variant (PrestaShop combination). */
export function BuyBox({ productId, variants }: { productId: string; variants: BuyBoxVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const variant = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!variant) {
    return null;
  }
  const stock = STOCK[variant.stockLevel];

  return (
    <div className="space-y-4 rounded-card border border-line p-5">
      {variants.length > 1 ? (
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Version</span>
          <select
            value={variant.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-card border border-line bg-surface px-3 py-2"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.options.length ? v.options.map((o) => o.name).join(' / ') : v.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-2xl">
          <Price value={variant.priceWithTax} />
        </span>
        {stock ? (
          <span className={cn('text-sm font-semibold', stock.className)}>{stock.label}</span>
        ) : null}
      </div>
      <p className="text-xs text-ink-muted">Prix TTC · Réf. {variant.sku}</p>
      <AddToCartForm
        key={variant.id}
        variantId={variant.id}
        disabled={variant.stockLevel === 'OUT_OF_STOCK'}
      />
      <p className="border-t border-line pt-3 text-sm">
        Professionnel ou grande quantité ?{' '}
        <Link
          href={`/devis?produit=${productId}&variante=${variant.id}`}
          className="font-semibold underline"
        >
          Demander un devis
        </Link>
      </p>
    </div>
  );
}
