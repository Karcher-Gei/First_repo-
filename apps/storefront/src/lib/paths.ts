import { categoryPath, productPath } from '@karcher/seo';

/**
 * Canonical URL of a migrated product. The URL slug field keeps PrestaShop's slug
 * where Vendure had to make it unique. Products created after the migration have no
 * legacyId yet: give them one in the Vendure dashboard (SEO tab) before publishing.
 */
export function productHref(product: {
  slug: string;
  customFields: {
    legacyId: number | null;
    urlSlug?: string | null;
    ean13: string | null;
    urlCategory: string | null;
  } | null;
}): string | null {
  if (product.customFields?.legacyId == null) {
    return null;
  }
  const { legacyId, urlSlug, ean13, urlCategory } = product.customFields;
  return productPath({ id: legacyId, slug: urlSlug || product.slug, category: urlCategory, ean13 });
}

/**
 * URL of a migrated category, from its legacyId (PrestaShop id), or null without one. The URL slug
 * field keeps PrestaShop's slug where Vendure had to make it unique (two "aspirateurs" categories).
 */
export function categoryHref(collection: {
  slug: string;
  customFields: { legacyId: number | null; urlSlug?: string | null } | null;
}): string | null {
  const legacyId = collection.customFields?.legacyId;
  return legacyId == null
    ? null
    : categoryPath({ id: legacyId, slug: collection.customFields?.urlSlug || collection.slug });
}

/** Short name shown in the menu and breadcrumbs (PrestaShop's long SEO names stay as page titles). */
export function categoryLabel(collection: {
  name: string;
  customFields?: { menuLabel?: string | null } | null;
}): string {
  return collection.customFields?.menuLabel?.trim() || collection.name;
}
