/** schema.org JSON-LD builders. Missing on today's PrestaShop product pages. */

export interface ProductJsonLdInput {
  name: string;
  url: string;
  description?: string;
  images: string[];
  sku?: string;
  gtin13?: string | null;
  /** Price in major units, e.g. 1542 for 1 542,000 TND. */
  price: number;
  currency: string;
  inStock: boolean;
  /** End of a sale price, e.g. "2026-12-31". */
  priceValidUntil?: string | null;
}

export function productJsonLd(p: ProductJsonLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    url: p.url,
    ...(p.description ? { description: p.description } : {}),
    image: p.images,
    brand: { '@type': 'Brand', name: 'Kärcher' },
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.gtin13 ? { gtin13: p.gtin13 } : {}),
    offers: {
      '@type': 'Offer',
      url: p.url,
      price: p.price.toFixed(3),
      priceCurrency: p.currency,
      ...(p.priceValidUntil ? { priceValidUntil: p.priceValidUntil } : {}),
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
