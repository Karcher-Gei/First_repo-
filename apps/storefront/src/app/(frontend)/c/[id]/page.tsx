import { breadcrumbJsonLd } from '@karcher/seo';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';

import { Container, SectionHeading } from '@/components/brand';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { ProductListing } from '@/components/ProductListing';
import { loadListing } from '@/lib/catalog';
import { categoryQuery, isFiltered, parseCategoryParams } from '@/lib/category-params';
import { categoryHref } from '@/lib/paths';
import { COLLECTION_BY_LEGACY_ID } from '@/lib/queries';
import { redirectOrNotFound } from '@/lib/redirects';
import { absoluteUrl } from '@/lib/site';
import { excerpt, plainText } from '@/lib/text';
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

  const listing = await loadListing(
    { collectionId: collection.id },
    categoryParams,
    collection.customFields?.filterFacetIds ?? [],
  );
  const crumbs = crumbsOf(collection);
  const subcategories = [...(collection.children ?? [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((child) => {
      const href = categoryHref(child);
      return href ? [{ name: child.name, href, image: child.featuredAsset?.preview ?? null }] : [];
    });
  const jsonLd = breadcrumbJsonLd(
    crumbs.map((crumb) => ({ name: crumb.name, url: absoluteUrl(crumb.href ?? path) })),
  );

  const intro = excerpt(plainText(collection.description), 240);
  return (
    <div className="-mt-6 space-y-10 md:-mt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <section className="full-bleed relative overflow-hidden bg-stage">
        <div
          aria-hidden="true"
          className="slant absolute -right-16 top-0 hidden h-full w-[30%] bg-brand md:block"
        />
        <Container className="relative grid items-center gap-8 py-8 md:grid-cols-[1fr_18rem] md:py-12">
          <div className="space-y-4">
            <Breadcrumbs items={crumbs} />
            <h1 className="font-heading text-5xl font-extrabold uppercase leading-[0.95] md:text-6xl">
              {collection.name}
            </h1>
            <p className="text-sm font-semibold">
              {listing.totalItems} produit{listing.totalItems > 1 ? 's' : ''}
            </p>
            {intro ? (
              <p className="max-w-2xl text-ink-muted">
                {intro}{' '}
                {collection.description &&
                plainText(collection.description).length > intro.length ? (
                  <a href="#a-propos" className="font-semibold text-ink underline">
                    En savoir plus
                  </a>
                ) : null}
              </p>
            ) : null}
          </div>
          {collection.featuredAsset ? (
            // Cropped to a disc, whatever the shape and background of the category image.
            <div className="relative hidden aspect-square overflow-hidden rounded-full bg-white ring-8 ring-white md:block">
              <Image
                src={`${collection.featuredAsset.preview}?preset=medium`}
                alt=""
                fill
                priority
                sizes="18rem"
                className="object-cover"
              />
            </div>
          ) : null}
        </Container>
      </section>

      {subcategories.length > 0 ? (
        <ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          aria-label="Sous-catégories"
        >
          {subcategories.map((sub) => (
            <li key={sub.href}>
              <Link
                href={sub.href}
                className="group flex h-full flex-col items-center gap-2 rounded-card p-3 text-center ring-1 ring-line transition hover:shadow-md hover:ring-ink/30"
              >
                <span className="relative block aspect-square w-full rounded-card bg-stage">
                  {sub.image ? (
                    <Image
                      src={`${sub.image}?preset=thumb`}
                      alt=""
                      fill
                      sizes="10rem"
                      className="object-contain p-3 mix-blend-multiply transition-transform group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span className="font-heading text-base font-bold uppercase leading-tight">
                  {sub.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <ProductListing listing={listing} params={categoryParams} path={path} />

      {/* The full description, when the introduction above had to be shortened. */}
      {collection.description && plainText(collection.description).length > intro.length ? (
        <section id="a-propos" className="scroll-mt-48 rounded-card bg-stage p-6 md:p-10">
          <SectionHeading title={collection.name} kicker="À propos" />
          <div
            className="rich-text max-w-3xl"
            dangerouslySetInnerHTML={{ __html: collection.description }}
          />
        </section>
      ) : null}
    </div>
  );
}
