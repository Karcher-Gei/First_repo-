import { breadcrumbJsonLd } from '@karcher/seo';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { Container, SectionHeading } from '@/components/brand';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { ProductListing } from '@/components/ProductListing';
import { getBrand, type Brand } from '@/lib/brands';
import { loadListing } from '@/lib/catalog';
import { categoryQuery, isFiltered, parseCategoryParams } from '@/lib/category-params';
import { redirectOrNotFound } from '@/lib/redirects';
import { absoluteUrl } from '@/lib/site';
import { excerpt, plainText } from '@/lib/text';

/** Brand page, PrestaShop's manufacturer page. Reached through the proxy from /{id}_{slug}. */
type SearchParams = Record<string, string | string[] | undefined> & { from?: string };
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

function crumbsOf(brand: Brand): Crumb[] {
  return [
    { name: 'Accueil', href: '/' },
    { name: 'Marques', href: '/brands' },
    { name: brand.name, href: brand.href },
  ];
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [brand, query] = await Promise.all([getBrand((await params).id), searchParams]);
  if (!brand) {
    return {};
  }
  const listingParams = parseCategoryParams(query);
  const { page } = listingParams;
  const filtered = isFiltered(listingParams);
  const pageQuery = filtered
    ? ''
    : categoryQuery({ page, facetValueIds: [], order: null, inStock: false });
  return {
    title:
      page > 1
        ? `${brand.name} (page ${page})`
        : brand.metaTitle
          ? { absolute: brand.metaTitle }
          : brand.name,
    description:
      brand.metaDescription ?? (excerpt(plainText(brand.description ?? ''), 155) || undefined),
    alternates: { canonical: brand.href + pageQuery },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const brand = await getBrand(id);
  if (!brand) {
    return redirectOrNotFound(query.from);
  }
  const listingParams = parseCategoryParams(query);
  if (query.from && query.from !== brand.href) {
    permanentRedirect(brand.href + categoryQuery(listingParams));
  }

  const listing = await loadListing({ facetValueId: brand.id }, listingParams);
  const crumbs = crumbsOf(brand);
  const jsonLd = breadcrumbJsonLd(
    crumbs.map((crumb) => ({ name: crumb.name, url: absoluteUrl(crumb.href ?? brand.href) })),
  );
  const description = plainText(brand.description ?? '');
  const intro = excerpt(description, 240);

  return (
    <div className="-mt-6 space-y-10 md:-mt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <section className="full-bleed relative overflow-hidden bg-anthracite text-white">
        <div
          aria-hidden="true"
          className="slant absolute -right-16 top-0 hidden h-full w-[30%] bg-brand md:block"
        />
        <Container className="relative space-y-4 py-8 md:py-12">
          <Breadcrumbs items={crumbs} inverted />
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand">Marque</p>
          <h1 className="font-heading text-5xl font-extrabold uppercase leading-[0.95] md:text-6xl">
            {brand.name}
          </h1>
          <p className="text-sm font-semibold">
            {listing.totalItems} produit{listing.totalItems > 1 ? 's' : ''}
          </p>
          {intro ? (
            <p className="max-w-2xl text-white/75">
              {intro}{' '}
              {description.length > intro.length ? (
                <a href="#a-propos" className="font-semibold text-white underline">
                  En savoir plus
                </a>
              ) : null}
            </p>
          ) : null}
        </Container>
      </section>

      <ProductListing listing={listing} params={listingParams} path={brand.href} />

      {brand.description && description.length > intro.length ? (
        <section id="a-propos" className="scroll-mt-48 rounded-card bg-stage p-6 md:p-10">
          <SectionHeading title={brand.name} kicker="À propos" />
          <div
            className="rich-text max-w-3xl"
            dangerouslySetInnerHTML={{ __html: brand.description }}
          />
        </section>
      ) : null}
    </div>
  );
}
