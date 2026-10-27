import { breadcrumbJsonLd, productJsonLd } from '@karcher/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';

import { ArrowLink, SectionHeading } from '@/components/brand';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { BuyBox } from '@/components/BuyBox';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery } from '@/components/ProductGallery';
import { ProductRail } from '@/components/ProductRail';
import { ServiceHighlights } from '@/components/ServiceHighlights';
import { categoryHref, productHref } from '@/lib/paths';
import { COLLECTION_BY_SLUG, PRODUCT_BY_LEGACY_ID } from '@/lib/queries';
import { redirectOrNotFound } from '@/lib/redirects';
import { absoluteUrl } from '@/lib/site';
import { excerpt, plainText } from '@/lib/text';
import { shopQuery } from '@/lib/vendure';

/** Product page. Reached through the proxy from /{category}/{id}-{slug}{-ean13}.html */
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

async function loadProduct(id: string) {
  const legacyId = Number(id);
  if (!Number.isSafeInteger(legacyId)) {
    return null;
  }
  const { products } = await shopQuery(PRODUCT_BY_LEGACY_ID, { legacyId });
  return products.items[0] ?? null;
}

type Product = NonNullable<Awaited<ReturnType<typeof loadProduct>>>;

/**
 * The category the breadcrumb goes through: the PrestaShop default category the URL is built
 * from when it is one of the product's collections, else the deepest migrated collection.
 */
function mainCategory(product: Product) {
  const migrated = product.collections.filter((c) => categoryHref(c));
  return (
    migrated.find((c) => c.slug === product.customFields?.urlCategory) ??
    [...migrated].sort((a, b) => b.breadcrumbs.length - a.breadcrumbs.length)[0] ??
    null
  );
}

/** Facet values grouped by facet, e.g. Type: Aspirateur. */
function specifications(product: Product) {
  const groups = new Map<string, { name: string; values: string[] }>();
  for (const value of product.facetValues) {
    const group = groups.get(value.facet.id) ?? { name: value.facet.name, values: [] };
    group.values.push(value.name);
    groups.set(value.facet.id, group);
  }
  return [...groups.values()];
}

async function relatedProducts(product: Product, categorySlug: string | undefined) {
  if (!categorySlug) {
    return [];
  }
  const { collection } = await shopQuery(COLLECTION_BY_SLUG, { slug: categorySlug, take: 12 });
  const seen = new Set([product.id]);
  return (collection?.productVariants.items ?? [])
    .filter((variant) => !seen.has(variant.product.id) && seen.add(variant.product.id))
    .slice(0, 4);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await loadProduct((await params).id);
  if (!product) {
    return {};
  }
  // Meta tags migrated from PrestaShop win; PrestaShop titles already end with the shop name.
  return {
    title: product.seo?.metaTitle ? { absolute: product.seo.metaTitle } : product.name,
    description: product.seo?.metaDescription ?? plainText(product.description).slice(0, 155),
    alternates: { canonical: productHref(product) ?? undefined },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const product = await loadProduct(id);
  if (!product) {
    return redirectOrNotFound(from);
  }
  const href = productHref(product);
  if (href && from && from !== href) {
    permanentRedirect(href);
  }

  // Combinations: the lowest price and any stock stand for the product in search results.
  const variant = [...product.variants].sort((a, b) => a.priceWithTax - b.priceWithTax)[0];
  const inStock = product.variants.some((v) => v.stockLevel !== 'OUT_OF_STOCK');
  const category = mainCategory(product);
  const crumbs: Crumb[] = [
    { name: 'Accueil', href: '/' },
    ...(category?.parent && categoryHref(category.parent)
      ? [{ name: category.parent.name, href: categoryHref(category.parent) }]
      : []),
    ...(category ? [{ name: category.name, href: categoryHref(category) }] : []),
    { name: product.name, href },
  ];
  const images = (
    product.assets.length > 0
      ? product.assets
      : product.featuredAsset
        ? [product.featuredAsset]
        : []
  ).map((asset) => ({ preview: asset.preview, alt: asset.customFields?.alt }));
  const specs = specifications(product);
  const related = await relatedProducts(product, category?.slug);

  const jsonLd = [
    productJsonLd({
      name: product.name,
      url: absoluteUrl(href ?? '/'),
      description: plainText(product.description),
      images: images.map((image) => `${image.preview}?preset=large`),
      sku: variant?.sku,
      gtin13: product.customFields?.ean13,
      price: (variant?.priceWithTax ?? 0) / 1000,
      priceValidUntil: variant?.customFields?.saleEndsAt?.slice(0, 10),
      currency: 'TND',
      inStock,
    }),
    breadcrumbJsonLd(
      crumbs.map((crumb) => ({ name: crumb.name, url: absoluteUrl(crumb.href ?? href ?? '/') })),
    ),
  ];

  const summary = plainText(product.description);
  const chips = specs.flatMap((spec) => spec.values);

  return (
    <div className="space-y-14 pb-24 md:space-y-20 md:pb-0">
      <article className="space-y-5">
        <script
          type="application/ld+json"
          // Escape "<" so text from the catalog can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="md:sticky md:top-44 md:self-start">
            <ProductGallery images={images} alt={product.name} />
          </div>
          <div className="space-y-6">
            <header className="space-y-3">
              {category && categoryHref(category) ? (
                <Link
                  href={categoryHref(category)!}
                  className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted hover:text-ink"
                >
                  {category.name}
                </Link>
              ) : null}
              <h1 className="font-heading text-4xl font-extrabold leading-[1.02] md:text-5xl">
                {product.name}
              </h1>
              {chips.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Caractéristiques principales">
                  {chips.map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full bg-stage px-3 py-1 text-xs font-semibold"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
              ) : null}
              {summary ? (
                <p className="text-ink-muted">
                  {excerpt(summary, 220)}{' '}
                  <a href="#description" className="font-semibold text-ink underline">
                    En savoir plus
                  </a>
                </p>
              ) : null}
            </header>
            <BuyBox productId={product.id} variants={product.variants} />
            <ServiceHighlights compact />
          </div>
        </div>
      </article>

      <nav
        aria-label="Sur cette page"
        className="full-bleed sticky top-[7.5rem] z-20 hidden border-y border-line bg-surface/95 backdrop-blur md:block"
      >
        <ul className="mx-auto flex max-w-7xl gap-8 px-4 font-heading text-lg font-bold uppercase tracking-wide">
          {[
            ['#description', 'Description'],
            ...(specs.length ? [['#caracteristiques', 'Caractéristiques']] : []),
            ['#service', 'Garantie et SAV'],
            ...(related.length ? [['#produits-similaires', 'Produits similaires']] : []),
          ].map(([anchor, label]) => (
            <li key={anchor}>
              <a href={anchor} className="inline-block py-3 hover:text-ink-muted">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section id="description" className="scroll-mt-48" aria-labelledby="product-description">
          <SectionHeading id="product-description" title="Description" />
          {product.description ? (
            <div
              className="rich-text max-w-3xl"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p className="text-ink-muted">Description à venir.</p>
          )}
        </section>
        {specs.length > 0 ? (
          <section id="caracteristiques" className="scroll-mt-48" aria-labelledby="product-specs">
            <SectionHeading id="product-specs" title="Caractéristiques" />
            <dl className="overflow-hidden rounded-card ring-1 ring-line">
              {specs.map((spec, index) => (
                <div
                  key={spec.name}
                  className={`grid grid-cols-2 gap-4 px-4 py-3 text-sm ${index % 2 ? '' : 'bg-stage'}`}
                >
                  <dt className="text-ink-muted">{spec.name}</dt>
                  <dd className="font-semibold">{spec.values.join(', ')}</dd>
                </div>
              ))}
              {variant ? (
                <div className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                  <dt className="text-ink-muted">Référence</dt>
                  <dd className="font-semibold">{variant.sku}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}
      </div>

      <section
        id="service"
        className="grid scroll-mt-48 gap-4 md:grid-cols-2"
        aria-label="Garantie et service après-vente"
      >
        <div className="flex flex-col justify-between gap-6 rounded-card bg-anthracite p-8 text-white">
          <div className="space-y-2">
            <h2 className="font-heading text-3xl font-extrabold uppercase leading-none">
              Garantie constructeur Kärcher
            </h2>
            <p className="text-white/70">
              Enregistrez votre machine avec sa référence et son numéro de série pour faciliter la
              prise en charge sous garantie.
            </p>
          </div>
          <ArrowLink href="/garantie" inverted>
            Enregistrer ma machine
          </ArrowLink>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-card bg-stage p-8">
          <div className="space-y-2">
            <h2 className="font-heading text-3xl font-extrabold uppercase leading-none">
              Une question sur ce produit ?
            </h2>
            <p className="text-ink-muted">
              Accessoires compatibles, pièces, conseil d’utilisation : notre équipe vous répond.
            </p>
          </div>
          <ArrowLink href="/nous-contacter">Nous contacter</ArrowLink>
        </div>
      </section>

      {related.length > 0 ? (
        <section
          id="produits-similaires"
          className="scroll-mt-48"
          aria-labelledby="related-products"
        >
          <SectionHeading
            id="related-products"
            kicker="Dans la même catégorie"
            title="Produits similaires"
            action={
              category && categoryHref(category)
                ? { href: categoryHref(category)!, label: 'Tout voir' }
                : undefined
            }
          />
          <ProductRail label="Produits similaires">
            {related.map((item) => (
              <ProductCard
                key={item.product.id}
                product={item.product}
                priceWithTax={item.priceWithTax}
              />
            ))}
          </ProductRail>
        </section>
      ) : null}
    </div>
  );
}
