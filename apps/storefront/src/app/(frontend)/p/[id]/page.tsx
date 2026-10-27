import { breadcrumbJsonLd, productJsonLd } from '@karcher/seo';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { BuyBox } from '@/components/BuyBox';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery } from '@/components/ProductGallery';
import { ServiceHighlights } from '@/components/ServiceHighlights';
import { categoryHref, productHref } from '@/lib/paths';
import { COLLECTION_BY_SLUG, PRODUCT_BY_LEGACY_ID } from '@/lib/queries';
import { redirectOrNotFound } from '@/lib/redirects';
import { absoluteUrl } from '@/lib/site';
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

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  const images =
    product.assets.length > 0
      ? product.assets
      : product.featuredAsset
        ? [product.featuredAsset]
        : [];
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
      currency: 'TND',
      inStock,
    }),
    breadcrumbJsonLd(
      crumbs.map((crumb) => ({ name: crumb.name, url: absoluteUrl(crumb.href ?? href ?? '/') })),
    ),
  ];

  return (
    <div className="space-y-12">
      <article className="space-y-6">
        <script
          type="application/ld+json"
          // Escape "<" so text from the catalog can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <ProductGallery images={images} alt={product.name} />
          <div className="space-y-6">
            <header className="space-y-2">
              <h1 className="text-2xl font-black md:text-3xl">{product.name}</h1>
            </header>
            <BuyBox productId={product.id} variants={product.variants} />
            <ServiceHighlights compact />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {product.description ? (
            <section className="space-y-3" aria-labelledby="product-description">
              <h2 id="product-description" className="text-xl font-black uppercase">
                Description
              </h2>
              <div
                className="max-w-none space-y-3 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </section>
          ) : null}
          {specs.length > 0 ? (
            <section className="space-y-3" aria-labelledby="product-specs">
              <h2 id="product-specs" className="text-xl font-black uppercase">
                Caractéristiques
              </h2>
              <dl className="divide-y divide-line rounded-card border border-line text-sm">
                {specs.map((spec) => (
                  <div key={spec.name} className="grid grid-cols-2 gap-4 px-4 py-2">
                    <dt className="text-ink-muted">{spec.name}</dt>
                    <dd className="font-semibold">{spec.values.join(', ')}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </article>

      {related.length > 0 ? (
        <section className="space-y-4" aria-labelledby="related-products">
          <h2 id="related-products" className="text-xl font-black uppercase">
            Dans la même catégorie
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.product.id}
                product={item.product}
                priceWithTax={item.priceWithTax}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
