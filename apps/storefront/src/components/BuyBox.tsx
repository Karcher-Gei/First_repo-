'use client';

import { cn, formatPrice, Price } from '@karcher/ui';
import Link from 'next/link';
import { useState } from 'react';

import { discountPercent, saleEndText } from '@/lib/sale';

import { AddToCartForm } from './cart';

export interface BuyBoxVariant {
  id: string;
  name: string;
  sku: string;
  priceWithTax: number;
  stockLevel: string;
  options: { name: string }[];
  /** On sale: the struck-through price and when the sale ends. */
  customFields: { regularPrice: number | null; saleEndsAt: string | null } | null;
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
 * screens a bar with the price and the add button stays at the bottom of the screen. A product of
 * the professional range (`quoteOnly`) shows neither price nor stock: only the quote request.
 */
export function BuyBox({
  productId,
  variants,
  quoteOnly = false,
}: {
  productId: string;
  variants: BuyBoxVariant[];
  quoteOnly?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const variant = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!variant) {
    return null;
  }
  const versions =
    variants.length > 1 ? (
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
    ) : null;
  const quoteHref = `/devis?produit=${productId}&variante=${variant.id}`;

  if (quoteOnly) {
    return (
      <div className="space-y-5 rounded-card bg-surface p-5 ring-1 ring-line md:p-6">
        {versions}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
            Gamme professionnelle
          </p>
          <p className="font-heading text-3xl font-extrabold uppercase leading-none">
            Prix sur devis
          </p>
          <p className="text-sm text-ink-muted">
            Recevez une offre adaptée à votre activité : quantités, accessoires, mise en service et
            entretien. Réf. {variant.sku}
          </p>
        </div>
        <Link
          href={quoteHref}
          className="flex h-12 items-center justify-center rounded-card bg-brand font-heading text-lg font-bold uppercase tracking-wide hover:brightness-95"
        >
          Demander un devis
        </Link>
        <Link
          href="/nous-contacter"
          className="flex h-11 items-center justify-center rounded-card text-sm font-bold uppercase tracking-wide ring-1 ring-ink hover:bg-ink hover:text-white"
        >
          Parler à un conseiller
        </Link>

        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <p className="min-w-0 flex-1 font-heading text-lg font-extrabold uppercase leading-none">
            Prix sur devis
          </p>
          <Link
            href={quoteHref}
            className="flex h-11 items-center rounded-card bg-brand px-5 font-heading font-bold uppercase"
          >
            Demander un devis
          </Link>
        </div>
      </div>
    );
  }

  const stock = STOCK[variant.stockLevel];
  const outOfStock = variant.stockLevel === 'OUT_OF_STOCK';
  const regularPrice = variant.customFields?.regularPrice ?? null;
  const percent = discountPercent(variant.priceWithTax, regularPrice);
  const saleEndsAt = percent > 0 ? variant.customFields?.saleEndsAt : null;

  return (
    <div className="space-y-5 rounded-card bg-surface p-5 ring-1 ring-line md:p-6">
      {versions}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {percent > 0 && regularPrice ? (
            <p className="mb-2 flex items-center gap-2 text-sm">
              <span className="rounded-full bg-danger px-2.5 py-0.5 font-bold text-white">
                -{percent} %
              </span>
              <del className="text-ink-muted">
                <span className="sr-only">au lieu de </span>
                {formatPrice(regularPrice)}
              </del>
            </p>
          ) : null}
          <p
            className={cn(
              'font-heading text-4xl font-extrabold leading-none',
              percent > 0 && 'text-danger',
            )}
          >
            <Price value={variant.priceWithTax} />
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Prix TTC · Réf. {variant.sku}
            {saleEndsAt ? ` · Offre valable ${saleEndText(saleEndsAt)}` : null}
          </p>
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
        href={quoteHref}
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
            <Price value={variant.priceWithTax} previous={regularPrice} />
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
