import { STATIC_PAGES, type StaticPageKey } from '@karcher/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactForm } from '@/components/ContactForm';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { ProductListing } from '@/components/ProductListing';
import { getBrands } from '@/lib/brands';
import { loadListing, rankedProducts } from '@/lib/catalog';
import { categoryQuery, isFiltered, parseCategoryParams } from '@/lib/category-params';
import { getCms } from '@/lib/cms';
import { COLLECTION_ID_BY_SLUG } from '@/lib/queries';
import { shopQuery } from '@/lib/vendure';

/** Fixed pages kept from PrestaShop (/promotions, /nous-contacter, ...). Reached through the proxy. */
type SearchParams = Record<string, string | string[] | undefined> & { envoye?: string };
type Props = {
  params: Promise<{ page: string }>;
  searchParams: Promise<SearchParams>;
};

/**
 * `sale` lists the "Promotions" collection (variants with a struck-through price) with filters;
 * `newest` and `best-selling` list products by PrestaShop's date added and units sold.
 */
const PAGES: Record<
  StaticPageKey,
  { title: string; listing?: 'sale' | 'newest' | 'best-selling' }
> = {
  'prices-drop': { title: 'Promotions', listing: 'sale' },
  'best-sales': { title: 'Meilleures ventes', listing: 'best-selling' },
  'new-products': { title: 'Nouveaux produits', listing: 'newest' },
  discount: { title: 'Réductions', listing: 'sale' },
  brands: { title: 'Marques' },
  contact: { title: 'Nous contacter' },
  stores: { title: 'Nos magasins' },
};

const PATH_OF = Object.fromEntries(
  Object.entries(STATIC_PAGES).map(([path, key]) => [key, path]),
) as Record<StaticPageKey, string>;

function isPageKey(value: string): value is StaticPageKey {
  return value in PAGES;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ page }, query] = await Promise.all([params, searchParams]);
  if (!isPageKey(page)) {
    return {};
  }
  const listingParams = parseCategoryParams(query);
  const filtered = isFiltered(listingParams);
  // Meta tags migrated from PrestaShop (Préférences > Trafic & SEO), edited in Payload.
  const cms = await getCms();
  const { pages } = await cms.findGlobal({ slug: 'fixed-pages', depth: 0 });
  const meta = pages?.find((entry) => entry.page === page);
  return {
    title: meta?.title ? { absolute: meta.title } : PAGES[page].title,
    description: meta?.description || undefined,
    alternates: {
      canonical:
        PATH_OF[page] +
        (filtered ? '' : categoryQuery({ ...listingParams, facetValueIds: [], order: null })),
    },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function StaticPage({ params, searchParams }: Props) {
  const [{ page }, query] = await Promise.all([params, searchParams]);
  if (!isPageKey(page)) {
    notFound();
  }
  const { title, listing } = PAGES[page];
  const path = PATH_OF[page];
  const listingParams = parseCategoryParams(query);

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
        {title}
      </h1>
      {listing === 'sale' ? <SaleListing path={path} params={listingParams} /> : null}
      {listing === 'newest' || listing === 'best-selling' ? (
        <RankedGrid ranking={listing} path={path} page={listingParams.page} />
      ) : null}
      {page === 'brands' ? <BrandList /> : null}
      {page === 'stores' || page === 'contact' ? <StoreList /> : null}
      {page === 'contact' ? <ContactForm sent={query.envoye === '1'} /> : null}
    </section>
  );
}

async function SaleListing({
  path,
  params,
}: {
  path: string;
  params: ReturnType<typeof parseCategoryParams>;
}) {
  const { collection } = await shopQuery(COLLECTION_ID_BY_SLUG, { slug: 'promotions' });
  if (!collection) {
    return <p className="text-ink-muted">Aucune promotion pour le moment.</p>;
  }
  const listing = await loadListing({ collectionId: collection.id }, params);
  return (
    <ProductListing
      listing={listing}
      params={params}
      path={path}
      empty="Aucune promotion ne correspond à ces filtres."
    />
  );
}

async function RankedGrid({
  ranking,
  path,
  page,
}: {
  ranking: 'newest' | 'best-selling';
  path: string;
  page: number;
}) {
  const { products, pageCount } = await rankedProducts(ranking, page);
  if (products.length === 0) {
    return <p className="text-ink-muted">Aucun produit pour le moment.</p>;
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map(({ product, priceWithTax, from }) => (
          <ProductCard
            key={product.id}
            product={product}
            priceWithTax={priceWithTax}
            priceFrom={from}
          />
        ))}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(p) => path + (p > 1 ? `?page=${p}` : '')}
      />
    </div>
  );
}

async function BrandList() {
  const brands = await getBrands();
  if (brands.length === 0) {
    return <p className="text-ink-muted">Aucune marque pour le moment.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand) => (
        <li key={brand.id}>
          <Link
            href={brand.href}
            className="group flex h-full flex-col justify-between gap-6 rounded-card bg-stage p-6 transition-shadow hover:shadow-lg"
          >
            <span className="font-heading text-3xl font-extrabold uppercase leading-none">
              {brand.name}
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase">
              Voir les produits
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function StoreList() {
  const cms = await getCms();
  const { docs } = await cms.find({ collection: 'stores', limit: 20, sort: 'order' });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {docs.map((store) => (
        <address key={store.id} className="rounded-card border border-line p-5 not-italic">
          <h2 className="mb-2 font-bold">{store.name}</h2>
          <p className="whitespace-pre-line text-sm">{store.address}</p>
          {store.openingHours ? (
            <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{store.openingHours}</p>
          ) : null}
          {store.phone ? <p className="mt-2 text-sm font-semibold">Tél. {store.phone}</p> : null}
        </address>
      ))}
    </div>
  );
}
