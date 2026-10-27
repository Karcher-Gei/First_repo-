import { breadcrumbJsonLd } from '@karcher/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';

import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { CategoryFilters } from '@/components/CategoryFilters';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { loadListing } from '@/lib/catalog';
import {
  categoryQuery,
  isFiltered,
  parseCategoryParams,
  SORTS,
  type SortKey,
} from '@/lib/category-params';
import { categoryHref } from '@/lib/paths';
import { COLLECTION_BY_LEGACY_ID } from '@/lib/queries';
import { redirectOrNotFound } from '@/lib/redirects';
import { absoluteUrl } from '@/lib/site';
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

type Collection = NonNullable<Awaited<ReturnType<typeof loadCollection>>>;

/** Home, then the ancestors (Vendure's hidden root collection has no legacyId and drops out), then this category. */
function crumbsOf(collection: Collection): Crumb[] {
  const ancestors = [collection.parent?.parent, collection.parent].flatMap((c) =>
    c && categoryHref(c) ? [{ name: c.name, href: categoryHref(c) }] : [],
  );
  return [
    { name: 'Accueil', href: '/' },
    ...ancestors,
    { name: collection.name, href: categoryHref(collection) },
  ];
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [collection, query] = await Promise.all([loadCollection((await params).id), searchParams]);
  if (!collection) {
    return {};
  }
  const canonical = categoryHref(collection);
  const listingParams = parseCategoryParams(query);
  const { page } = listingParams;
  // Each page of the plain listing is indexable on its own URL; filtered or sorted variants are not.
  const filtered = isFiltered(listingParams);
  const pageQuery = filtered
    ? ''
    : categoryQuery({ page, facetValueIds: [], order: null, inStock: false });
  // Meta tags migrated from PrestaShop win; PrestaShop titles already end with the shop name.
  const metaTitle = collection.customFields?.metaTitle;
  return {
    title:
      page > 1
        ? `${collection.name} (page ${page})`
        : metaTitle
          ? { absolute: metaTitle }
          : collection.name,
    description: collection.customFields?.metaDescription ?? undefined,
    alternates: { canonical: canonical ? canonical + pageQuery : undefined },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const collection = await loadCollection(id);
  if (!collection) {
    return redirectOrNotFound(query.from);
  }
  const canonical = categoryHref(collection);
  const categoryParams = parseCategoryParams(query);
  if (canonical && query.from && query.from !== canonical) {
    permanentRedirect(canonical + categoryQuery(categoryParams));
  }
  const path = canonical ?? query.from ?? '/';

  const listing = await loadListing({ collectionId: collection.id }, categoryParams);
  const sorts = (Object.keys(SORTS) as SortKey[]).map((key) => ({ key, label: SORTS[key].label }));
  const crumbs = crumbsOf(collection);
  const subcategories = [...(collection.children ?? [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((child) => {
      const href = categoryHref(child);
      return href ? [{ name: child.name, href }] : [];
    });
  const jsonLd = breadcrumbJsonLd(
    crumbs.map((crumb) => ({ name: crumb.name, url: absoluteUrl(crumb.href ?? path) })),
  );

  return (
    <section className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Breadcrumbs items={crumbs} />
      <header className="space-y-3">
        <h1 className="text-3xl font-black uppercase">{collection.name}</h1>
        {subcategories.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Sous-catégories">
            {subcategories.map((sub) => (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  className="inline-block rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink hover:bg-brand"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm text-ink-muted">
          {listing.totalItems} produit{listing.totalItems > 1 ? 's' : ''}
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[14rem_1fr] md:gap-8">
        <aside aria-label="Filtres">
          <CategoryFilters
            action={path}
            facets={listing.facets}
            params={categoryParams}
            sorts={sorts}
          />
        </aside>
        <div className="space-y-6">
          {listing.products.length === 0 ? (
            <p>Aucun produit ne correspond à ces filtres.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
            page={categoryParams.page}
            pageCount={listing.pageCount}
            hrefFor={(page) => path + categoryQuery({ ...categoryParams, page })}
          />
        </div>
      </div>
      {collection.description ? (
        <div
          className="max-w-3xl leading-relaxed text-ink-muted"
          dangerouslySetInnerHTML={{ __html: collection.description }}
        />
      ) : null}
    </section>
  );
}
