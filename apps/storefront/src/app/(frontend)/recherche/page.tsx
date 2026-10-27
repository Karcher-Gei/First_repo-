import type { Metadata } from 'next';

import { CategoryFilters } from '@/components/CategoryFilters';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { loadListing } from '@/lib/catalog';
import { categoryQuery, parseCategoryParams, SORTS, type SortKey } from '@/lib/category-params';

/** PrestaShop's search URL (/recherche?controller=search&s=...); results are never indexed. */
export const metadata: Metadata = { title: 'Recherche', robots: { index: false, follow: true } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const query = await searchParams;
  const term = (Array.isArray(query.s) ? query.s[0] : query.s)?.trim().slice(0, 100) ?? '';

  if (!term) {
    return (
      <section className="space-y-4">
        <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
          Recherche
        </h1>
        <p>Saisissez un nom de produit ou une référence dans la barre de recherche.</p>
      </section>
    );
  }

  const params = parseCategoryParams(query);
  const results = await loadListing({ term }, params);
  const base = { s: term };
  const sorts = (Object.keys(SORTS) as SortKey[]).map((key) => ({ key, label: SORTS[key].label }));

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
          Recherche : « {term} »
        </h1>
        <p className="text-sm text-ink-muted">
          {results.totalItems} résultat{results.totalItems > 1 ? 's' : ''}
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[14rem_1fr] md:gap-8">
        <aside aria-label="Filtres">
          <CategoryFilters
            action="/recherche"
            base={base}
            facets={results.facets}
            params={params}
            sorts={sorts}
          />
        </aside>
        <div className="space-y-6">
          {results.products.length === 0 ? (
            <p>
              Aucun produit ne correspond à votre recherche. Essayez un autre mot, une référence ou
              moins de filtres.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {results.products.map(({ product, priceWithTax, from }) => (
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
            pageCount={results.pageCount}
            hrefFor={(page) => `/recherche${categoryQuery({ ...params, page }, base)}`}
          />
        </div>
      </div>
    </section>
  );
}
