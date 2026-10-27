import type { Metadata } from 'next';

import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { searchProducts } from '@/lib/catalog';

/** PrestaShop's search URL (/recherche?controller=search&s=...); results are never indexed. */
export const metadata: Metadata = { title: 'Recherche', robots: { index: false, follow: true } };

type Props = { searchParams: Promise<{ s?: string | string[]; page?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const term = (Array.isArray(params.s) ? params.s[0] : params.s)?.trim().slice(0, 100) ?? '';
  const page = Math.max(1, Math.trunc(Number(params.page)) || 1);

  if (!term) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-black uppercase">Recherche</h1>
        <p>Saisissez un nom de produit ou une référence dans la barre de recherche.</p>
      </section>
    );
  }

  const results = await searchProducts(term, page);
  const hrefFor = (p: number) =>
    `/recherche?s=${encodeURIComponent(term)}${p > 1 ? `&page=${p}` : ''}`;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black uppercase">Recherche : « {term} »</h1>
        <p className="text-sm text-ink-muted">
          {results.totalItems} résultat{results.totalItems > 1 ? 's' : ''}
        </p>
      </header>
      {results.products.length === 0 ? (
        <p>Aucun produit ne correspond à votre recherche. Essayez un autre mot ou une référence.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
      <Pagination page={page} pageCount={results.pageCount} hrefFor={hrefFor} />
    </section>
  );
}
