'use client';

import { Button } from '@karcher/ui';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';

import { addToCart, updateCartLine } from '@/app/(frontend)/panier/actions';

import { SubmitButton } from './forms';

/** Fired after the cart changes, so the header count can update without a reload. */
const CART_CHANGED = 'kgei:cart-changed';

export function AddToCartForm({ variantId, disabled }: { variantId: string; disabled: boolean }) {
  const [state, formAction] = useActionState(addToCart, null);
  useEffect(() => {
    // Also after a stock error: Vendure may still have added the units in stock.
    if (state) {
      window.dispatchEvent(new Event(CART_CHANGED));
    }
  }, [state]);

  if (disabled) {
    return (
      <Button disabled className="w-full sm:w-auto">
        Rupture de stock
      </Button>
    );
  }
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="block text-sm font-semibold">Quantité</span>
          <input
            type="number"
            name="quantity"
            min={1}
            max={99}
            defaultValue={1}
            className="w-20 rounded-card border border-line px-3 py-2"
          />
        </label>
        <SubmitButton>Ajouter au panier</SubmitButton>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-success">
          {state.success}{' '}
          <Link href="/panier" className="font-semibold underline">
            Voir le panier
          </Link>
        </p>
      ) : null}
    </form>
  );
}

export function CartLineQuantity({ lineId, quantity }: { lineId: string; quantity: number }) {
  const [state, formAction] = useActionState(updateCartLine, null);
  useEffect(() => {
    window.dispatchEvent(new Event(CART_CHANGED));
  }, [state]);
  return (
    <div className="space-y-1">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="lineId" value={lineId} />
        <label className="sr-only" htmlFor={`qty-${lineId}`}>
          Quantité
        </label>
        <input
          id={`qty-${lineId}`}
          type="number"
          name="quantity"
          min={0}
          max={99}
          defaultValue={quantity}
          key={quantity}
          className="w-20 rounded-card border border-line px-3 py-2"
        />
        <SubmitButton variant="ghost" className="px-3">
          Mettre à jour
        </SubmitButton>
      </form>
      <form action={formAction}>
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="quantity" value="0" />
        <button type="submit" className="text-sm text-ink-muted underline hover:text-danger">
          Retirer
        </button>
      </form>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

/** Header link to the cart. The count is fetched in the browser so catalog pages stay cacheable. */
export function CartLink() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const load = () =>
      fetch('/panier/nombre', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : { count: 0 }))
        .then((body: { count: number }) => setCount(body.count))
        .catch(() => setCount(null));
    void load();
    window.addEventListener(CART_CHANGED, load);
    return () => window.removeEventListener(CART_CHANGED, load);
  }, []);
  return (
    <Link href="/panier" className="inline-flex items-center gap-2 font-semibold">
      Panier
      {count ? (
        <span
          className="rounded-full bg-ink px-2 py-0.5 text-xs text-white"
          aria-label={`${count} articles`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
