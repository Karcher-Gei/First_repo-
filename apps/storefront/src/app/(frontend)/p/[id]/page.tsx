import { breadcrumbJsonLd, productJsonLd } from '@karcher/seo';
import { cn, Price } from '@karcher/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';

import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { AddToCartForm } from '@/components/cart';
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

const STOCK = {
  IN_STOCK: { label: 'En stock', className: 'text-success' },
  LOW_STOCK: { label: 'Stock limité', className: 'text-warning' },
  OUT_OF_STOCK: { label: 'Rupture de stock', className: 'text-danger' },
} as Record<string, { label: string; className: string }>;

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
  return {
    title: product.name,
    description: plainText(product.description).slice(0, 155),
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

  const variant = product.variants[0];
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
  const stock = variant ? STOCK[variant.stockLevel] : undefined;
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
      inStock: variant?.stockLevel !== 'OUT_OF_STOCK',
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
              {variant ? <p className="text-sm text-ink-muted">Réf. {variant.sku}</p> : null}
            </header>
            {variant ? (
              <div className="space-y-4 rounded-card border border-line p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-2xl">
                    <Price value={variant.priceWithTax} />
                  </span>
                  {stock ? (
                    <span className={cn('text-sm font-semibold', stock.className)}>
                      {stock.label}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-ink-muted">Prix TTC</p>
                <AddToCartForm
                  variantId={variant.id}
                  disabled={variant.stockLevel === 'OUT_OF_STOCK'}
                />
                <p className="border-t border-line pt-3 text-sm">
                  Professionnel ou grande quantité ?{' '}
                  <Link
                    href={`/devis?produit=${product.id}&variante=${variant.id}`}
                    className="font-semibold underline"
                  >
                    Demander un devis
                  </Link>
                </p>
              </div>
            ) : null}
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
