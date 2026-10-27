'use client';

import { Button, cn } from '@karcher/ui';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import type { FacetGroup } from '@/lib/catalog';
import { categoryQuery, type SortKey } from '@/lib/category-params';

import { FilterIcon } from './icons';

/**
 * Filters and sort as a plain GET form on the category URL, so they work without JavaScript;
 * with JavaScript, any change applies at once and the URL stays clean (no empty parameters).
 */
export function CategoryFilters({
  action,
  facets,
  selected,
  order,
  sorts,
}: {
  action: string;
  facets: FacetGroup[];
  selected: string[];
  order: SortKey | null;
  sorts: { key: SortKey; label: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  // Small screens: the panel opens from a button so the products come first.
  const [open, setOpen] = useState(false);
  const active = selected.length + (order ? 1 : 0);
  const apply = () => {
    const form = new FormData(formRef.current!);
    const order = String(form.get('order') ?? '');
    router.push(
      action +
        categoryQuery({
          page: 1,
          facetValueIds: form.getAll('q').map(String),
          order: sorts.some((sort) => sort.key === order) ? (order as SortKey) : null,
        }),
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
        className={cn('space-y-6 max-md:mt-4 md:block', open ? 'block' : 'hidden')}
        onChange={apply}
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        <label className="block space-y-1">
          <span className="text-sm font-bold">Trier par</span>
          <select
            name="order"
            defaultValue={order ?? ''}
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
        {facets.map((facet) => (
          <fieldset key={facet.id} className="space-y-2">
            <legend className="text-sm font-bold">{facet.name}</legend>
            {facet.values.map((value) => (
              <label key={value.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="q"
                  value={value.id}
                  defaultChecked={selected.includes(value.id)}
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
        {selected.length > 0 || order ? (
          <a href={action} className="inline-block text-sm underline">
            Effacer les filtres
          </a>
        ) : null}
      </form>
    </>
  );
}
