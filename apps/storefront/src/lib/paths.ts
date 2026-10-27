import { categoryPath, productPath } from '@karcher/seo';

import type { ProductSummary } from './queries';

/**
 * Canonical URL of a migrated product. Products created after the migration have no
 * legacyId yet: give them one in the Vendure dashboard (SEO tab) before publishing.
 */
export function productHref(product: Pick<ProductSummary, 'slug' | 'customFields'>): string | null {
  if (product.customFields?.legacyId == null) {
    return null;
  }
  const { legacyId, ean13, urlCategory } = product.customFields;
  return productPath({ id: legacyId, slug: product.slug, category: urlCategory, ean13 });
}

/** URL of a migrated category, from its legacyId (PrestaShop id), or null without one. */
export function categoryHref(collection: {
  slug: string;
  customFields: { legacyId: number | null } | null;
}): string | null {
  const legacyId = collection.customFields?.legacyId;
  return legacyId == null ? null : categoryPath({ id: legacyId, slug: collection.slug });
}
