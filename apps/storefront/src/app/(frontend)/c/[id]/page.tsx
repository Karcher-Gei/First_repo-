import { categoryPath } from '@karcher/seo';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { CategoryFilters } from '@/components/CategoryFilters';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { loadCategoryListing } from '@/lib/catalog';
import { categoryQuery, parseCategoryParams, SORTS, type SortKey } from '@/lib/category-params';
import { COLLECTION_BY_LEGACY_ID } from '@/lib/queries';
import { redirectOrNotFound } from '@/lib/redirects';
import { shopQuery } from '@/lib/vendure';

/** Category page. Reached through the proxy from /{id}-{slug}, with ?page=, ?q= (filters) and ?order= */
type SearchParams = Record<string, string | string[] | undefined> & { from?: string };
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

async function loadCollection(id: string) {
  const legacyId = Number(id);
  if (!Number.isSafeInteger(legacyId)) {
    return null;
  }
  const { collections } = await shopQuery(COLLECTION_BY_LEGACY_ID, { legacyId });
  return collections.items[0] ?? null;
}

function canonicalOf(collection: { slug: string; customFields: { legacyId: number | null } | null }): string | null {
  const legacyId = collection.customFields?.legacyId;
  return legacyId == null ? null : categoryPath({ id: legacyId, slug: collection.slug });
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [collection, query] = await Promise.all([loadCollection((await params).id), searchParams]);
  if (!collection) {
    return {};
  }
  const canonical = canonicalOf(collection);
  const { page, facetValueIds, order } = parseCategoryParams(query);
  // Each page of the plain listing is indexable on its own URL; filtered or sorted variants are not.
  const filtered = facetValueIds.length > 0 || order !== null;
  return {
    title: page > 1 ? `${collection.name} (page ${page})` : collection.name,
    alternates: { canonical: canonical ? canonical + (filtered ? '' : categoryQuery({ page, facetValueIds: [], order: null })) : undefined },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const collection = await loadCollection(id);
  if (!collection) {
    return redirectOrNotFound(query.from);
  }
  const canonical = canonicalOf(collection);
  const categoryParams = parseCategoryParams(query);
  if (canonical && query.from && query.from !== canonical) {
    permanentRedirect(canonical + categoryQuery(categoryParams));
  }
  const path = canonical ?? query.from ?? '/';

  const listing = await loadCategoryListing(collection.id, categoryParams);
  const sorts = (Object.keys(SORTS) as SortKey[]).map(key => ({ key, label: SORTS[key].label }));

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black uppercase">{collection.name}</h1>
        <p className="text-sm text-ink-muted">
          {listing.totalItems} produit{listing.totalItems > 1 ? 's' : ''}
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <aside aria-label="Filtres">
          <CategoryFilters
            action={path}
            facets={listing.facets}
            selected={categoryParams.facetValueIds}
            order={categoryParams.order}
            sorts={sorts}
          />
        </aside>
        <div className="space-y-6">
          {listing.products.length === 0 ? (
            <p>Aucun produit ne correspond à ces filtres.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {listing.products.map(({ product, priceWithTax, from }) => (
                <ProductCard key={product.id} product={product} priceWithTax={priceWithTax} priceFrom={from} />
              ))}
            </div>
          )}
          <Pagination
            page={categoryParams.page}
            pageCount={listing.pageCount}
            hrefFor={page => path + categoryQuery({ ...categoryParams, page })}
          />
        </div>
      </div>
      {collection.description ? (
        <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: collection.description }} />
      ) : null}
    </section>
  );
}
