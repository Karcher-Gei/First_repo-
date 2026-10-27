'use client';

import { Button } from '@karcher/ui';
import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';

import { addToCart, updateCartLine } from '@/app/(frontend)/panier/actions';

import { SubmitButton } from './forms';
import { CartIcon } from './icons';

/** Fired after the cart changes, so the header count can update without a reload. */
const CART_CHANGED = 'kgei:cart-changed';

/** Above the sticky bar on small screens, where there is no room under the button. */
const FLOATING_NOTICE =
  'absolute bottom-full right-4 mb-2 max-w-xs rounded-card bg-ink px-3 py-2 text-xs text-white shadow-lg [&_a]:text-brand';

export function AddToCartForm({
  variantId,
  disabled,
  compact = false,
}: {
  variantId: string;
  disabled: boolean;
  /** One unit, button only: the sticky bar on small screens. */
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(addToCart, null);
  const quantityRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Also after a stock error: Vendure may still have added the units in stock.
    if (state) {
      window.dispatchEvent(new Event(CART_CHANGED));
    }
  }, [state]);
  const step = (by: number) => {
    const input = quantityRef.current;
    if (input) {
      input.value = String(Math.min(99, Math.max(1, Number(input.value || 1) + by)));
    }
  };

  if (disabled) {
    return (
      <Button disabled className="w-full">
        Rupture de stock
      </Button>
    );
  }
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="variantId" value={variantId} />
      {compact ? <input type="hidden" name="quantity" value="1" /> : null}
      <div className="flex gap-3">
        {compact ? null : (
          <div className="flex h-12 items-stretch overflow-hidden rounded-card ring-1 ring-line">
            <button
              type="button"
              onClick={() => step(-1)}
              className="w-10 text-xl hover:bg-surface-muted"
              aria-label="Diminuer la quantité"
            >
              −
            </button>
            <label className="sr-only" htmlFor={`quantity-${variantId}`}>
              Quantité
            </label>
            <input
              ref={quantityRef}
              id={`quantity-${variantId}`}
              type="number"
              name="quantity"
              min={1}
              max={99}
              defaultValue={1}
              className="w-12 border-x border-line text-center font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => step(1)}
              className="w-10 text-xl hover:bg-surface-muted"
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>
        )}
        <SubmitButton className="h-12 flex-1 font-heading text-lg">
          <CartIcon width={20} height={20} />
          {compact ? 'Ajouter' : 'Ajouter au panier'}
        </SubmitButton>
      </div>
      {state?.error ? (
        <p role="alert" className={compact ? FLOATING_NOTICE : 'text-sm text-danger'}>
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className={compact ? FLOATING_NOTICE : 'text-sm text-success'}>
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
    <Link
      href="/panier"
      className="relative inline-flex items-center gap-2 font-semibold"
      aria-label={count ? `Panier, ${count} article${count > 1 ? 's' : ''}` : 'Panier'}
    >
      <CartIcon />
      <span className="hidden lg:inline">Panier</span>
      {count ? (
        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-ink px-1.5 text-center text-xs leading-5 text-white lg:static">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
