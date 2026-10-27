import { breadcrumbJsonLd, categoryPath, productJsonLd } from '@karcher/seo';
import { Button, Price } from '@karcher/ui';
import type { Metadata } from 'next';
import Image from 'next/image';
import { permanentRedirect } from 'next/navigation';

import { productHref } from '@/lib/paths';
import { PRODUCT_BY_LEGACY_ID } from '@/lib/queries';
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

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
  const category = product.collections.find(c => c.customFields.legacyId != null);
  const images = product.assets.length > 0 ? product.assets : product.featuredAsset ? [product.featuredAsset] : [];
  const jsonLd = [
    productJsonLd({
      name: product.name,
      url: absoluteUrl(href ?? '/'),
      description: plainText(product.description),
      images: images.map(image => `${image.preview}?preset=large`),
      sku: variant?.sku,
      gtin13: product.customFields.ean13,
      price: (variant?.priceWithTax ?? 0) / 1000,
      currency: 'TND',
      inStock: variant?.stockLevel !== 'OUT_OF_STOCK',
    }),
    breadcrumbJsonLd([
      { name: 'Accueil', url: absoluteUrl('/') },
      ...(category?.customFields.legacyId != null
        ? [{ name: category.name, url: absoluteUrl(categoryPath({ id: category.customFields.legacyId, slug: category.slug })) }]
        : []),
      { name: product.name, url: absoluteUrl(href ?? '/') },
    ]),
  ];

  return (
    <article className="grid gap-10 md:grid-cols-2">
      <script
        type="application/ld+json"
        // Escape "<" so text from the catalog can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="space-y-4">
        {images.map((image, index) => (
          <Image
            key={image.preview}
            src={`${image.preview}?preset=large`}
            alt={product.name}
            width={800}
            height={800}
            priority={index === 0}
            className="aspect-square w-full rounded-card border border-line object-contain"
          />
        ))}
      </div>
      <div className="space-y-6">
        <h1 className="text-3xl font-black">{product.name}</h1>
        {variant ? (
          <>
            <p className="text-sm text-ink-muted">Réf. {variant.sku}</p>
            <Price value={variant.priceWithTax} />
            {/* TODO(Features phase): add-to-cart and quote request (QuotesPlugin) as server actions */}
            <Button disabled={variant.stockLevel === 'OUT_OF_STOCK'}>Ajouter au panier</Button>
          </>
        ) : null}
        <div className="space-y-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
      </div>
    </article>
  );
}
