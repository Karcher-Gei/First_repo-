import { productPath } from '@karcher/seo';

import type { ProductSummary } from './queries';

/**
 * Canonical URL of a migrated product. Products created after the migration have no
 * legacyId yet: give them one in the Vendure dashboard (SEO tab) before publishing.
 */
export function productHref(product: Pick<ProductSummary, 'slug' | 'customFields'>): string | null {
  const { legacyId, ean13, urlCategory } = product.customFields;
  if (legacyId == null) {
    return null;
  }
  return productPath({ id: legacyId, slug: product.slug, category: urlCategory, ean13 });
}
