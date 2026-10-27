import type { Metadata } from 'next';

import { ProductListing } from '@/components/ProductListing';
import { loadListing } from '@/lib/catalog';
import { parseCategoryParams } from '@/lib/category-params';

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
      <ProductListing
        listing={results}
        params={params}
        path="/recherche"
        base={base}
        empty="Aucun produit ne correspond à votre recherche. Essayez un autre mot, une référence ou moins de filtres."
      />
    </section>
  );
}
