'use client';

import { Button, cn } from '@karcher/ui';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import type { FacetGroup } from '@/lib/catalog';
import { categoryQuery, type CategoryParams, type SortKey } from '@/lib/category-params';

import { FilterIcon } from './icons';

/**
 * Filters and sort of a listing (category or search results) as a plain GET form, so they work
 * without JavaScript; with JavaScript, any change applies at once and the URL stays clean.
 * `base` holds parameters kept on every URL, such as the search term.
 */
export function CategoryFilters({
  action,
  base = {},
  facets,
  params,
  sorts,
  stockFilter = true,
}: {
  action: string;
  base?: Record<string, string>;
  facets: FacetGroup[];
  params: CategoryParams;
  sorts: { key: SortKey; label: string }[];
  /** Off for the professional range, sold on quote only: its stock is never shown. */
  stockFilter?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  // Small screens: the panel opens from a button so the products come first.
  const [open, setOpen] = useState(false);
  const active = params.facetValueIds.length + (params.order ? 1 : 0) + (params.inStock ? 1 : 0);
  const apply = () => {
    const form = new FormData(formRef.current!);
    const order = String(form.get('order') ?? '');
    router.push(
      action +
        categoryQuery(
          {
            page: 1,
            facetValueIds: form.getAll('q').map(String),
            order: sorts.some((sort) => sort.key === order) ? (order as SortKey) : null,
            inStock: form.get('stock') === '1',
          },
          base,
        ),
    );
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="category-filters"
        className="flex w-full items-center justify-center gap-2 rounded-card border border-ink px-4 py-2.5 text-sm font-semibold md:hidden"
      >
        <FilterIcon width={18} height={18} />
        Filtrer et trier
        {active > 0 ? (
          <span className="rounded-full bg-brand px-2 text-xs leading-5">{active}</span>
        ) : null}
      </button>
      <form
        id="category-filters"
        ref={formRef}
        action={action}
        method="get"
        className={cn(
          'space-y-5 rounded-card p-5 ring-1 ring-line max-md:mt-4 md:block [&>fieldset]:border-t [&>fieldset]:border-line [&>fieldset]:pt-4',
          open ? 'block' : 'hidden',
        )}
        onChange={apply}
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        {Object.entries(base).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label className="block space-y-1">
          <span className="font-heading text-lg font-bold uppercase">Trier par</span>
          <select
            name="order"
            defaultValue={params.order ?? ''}
            className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">Pertinence</option>
            {sorts.map((sort) => (
              <option key={sort.key} value={sort.key}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
        {stockFilter ? (
          <fieldset className="space-y-2">
            <legend className="mb-1 font-heading text-lg font-bold uppercase">Disponibilité</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="stock" value="1" defaultChecked={params.inStock} />
              En stock uniquement
            </label>
          </fieldset>
        ) : null}
        {facets.map((facet) => (
          <fieldset key={facet.id} className="space-y-2">
            <legend className="mb-1 font-heading text-lg font-bold uppercase">{facet.name}</legend>
            {facet.values.map((value) => (
              <label key={value.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="q"
                  value={value.id}
                  defaultChecked={params.facetValueIds.includes(value.id)}
                />
                <span className="flex-1">{value.name}</span>
                <span className="text-ink-muted">{value.count}</span>
              </label>
            ))}
          </fieldset>
        ))}
        <noscript>
          <Button type="submit" variant="secondary">
            Filtrer
          </Button>
        </noscript>
        {active > 0 ? (
          <a
            href={
              action +
              categoryQuery({ page: 1, facetValueIds: [], order: null, inStock: false }, base)
            }
            className="inline-block text-sm underline"
          >
            Effacer les filtres
          </a>
        ) : null}
      </form>
    </>
  );
}
