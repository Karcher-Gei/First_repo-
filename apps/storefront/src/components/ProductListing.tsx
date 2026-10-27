import Link from 'next/link';

import type { CategoryListing } from '@/lib/catalog';
import { categoryQuery, SORTS, type CategoryParams, type SortKey } from '@/lib/category-params';

import { CategoryFilters } from './CategoryFilters';
import { Pagination } from './Pagination';
import { ProductCard } from './ProductCard';

const sorts = (Object.keys(SORTS) as SortKey[]).map((key) => ({ key, label: SORTS[key].label }));
/** The professional range is sold on quote only: no price to sort by, no stock to filter on. */
const quoteOnlySorts = sorts.filter((sort) => !sort.key.startsWith('prix'));

/**
 * Filters, active filter chips, product grid and pagination of a category, brand or search page.
 * `path` is the page's URL; `base` holds parameters kept on every URL, such as the search term.
 */
export function ProductListing({
  listing,
  params,
  path,
  base = {},
  empty = 'Aucun produit ne correspond à ces filtres.',
}: {
  listing: CategoryListing;
  params: CategoryParams;
  path: string;
  base?: Record<string, string>;
  empty?: string;
}) {
  const quoteOnly =
    listing.products.length > 0 &&
    listing.products.every(({ product }) => product.customFields?.quoteOnly);
  const hrefWith = (changes: Partial<CategoryParams>) =>
    path + categoryQuery({ ...params, page: 1, ...changes }, base);
  const facetValueNames = new Map(
    listing.facets.flatMap((facet) => facet.values.map((v) => [v.id, v.name] as const)),
  );
  // Each chip links to the listing without that one filter.
  const chips = [
    ...params.facetValueIds.map((id) => ({
      label: facetValueNames.get(id) ?? id,
      href: hrefWith({ facetValueIds: params.facetValueIds.filter((other) => other !== id) }),
    })),
    ...(params.inStock ? [{ label: 'En stock', href: hrefWith({ inStock: false }) }] : []),
    ...(params.order
      ? [{ label: SORTS[params.order].label, href: hrefWith({ order: null }) }]
      : []),
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[15rem_1fr] md:gap-10">
      <aside aria-label="Filtres" className="md:sticky md:top-44 md:self-start">
        <CategoryFilters
          action={path}
          base={base}
          facets={listing.facets}
          params={params}
          sorts={quoteOnly ? quoteOnlySorts : sorts}
          stockFilter={!quoteOnly}
        />
      </aside>
      <div className="space-y-6">
        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-muted">Filtres actifs :</span>
            {chips.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-sm text-white hover:bg-anthracite"
                aria-label={`Retirer le filtre ${chip.label}`}
              >
                {chip.label}
                <span aria-hidden="true">×</span>
              </Link>
            ))}
            <Link
              href={hrefWith({ facetValueIds: [], inStock: false, order: null })}
              className="text-sm font-semibold underline"
            >
              Tout effacer
            </Link>
          </div>
        ) : null}
        {listing.products.length === 0 ? (
          <div className="rounded-card bg-stage p-10 text-center">
            <p className="font-heading text-2xl font-bold uppercase">Aucun produit</p>
            <p className="text-ink-muted">{empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {listing.products.map(({ product, priceWithTax, from }) => (
              <ProductCard
                key={product.id}
                product={product}
                priceWithTax={priceWithTax}
                priceFrom={from}
              />
            ))}
          </div>
        )}
        <Pagination
          page={params.page}
          pageCount={listing.pageCount}
          hrefFor={(page) => path + categoryQuery({ ...params, page }, base)}
        />
      </div>
    </div>
  );
}
