import type { PsCategory, PsProduct } from '../prestashop';

/**
 * The professional range is sold on quote only: its prices and stock never reach the site
 * (QuotesPlugin, quote-only.ts). It is the "Professionnel" category tree: the top-level
 * categories named so, or those given in PS_QUOTE_ONLY_CATEGORY_IDS, with their subcategories,
 * less those given in PS_QUOTE_ONLY_EXCLUDED_CATEGORY_IDS and theirs (e.g. accessories sold online).
 */
export function quoteOnlyCategories(
  categories: PsCategory[],
  configuredIds: number[],
  excludedIds: number[] = [],
): Set<number> {
  const roots = configuredIds.length
    ? configuredIds
    : categories
        .filter((c) => c.level_depth === 2 && /profession/i.test(`${c.name} ${c.link_rewrite}`))
        .map((c) => c.id_category);
  const result = new Set(roots);
  const excluded = new Set(excludedIds);
  // Categories come ordered by depth, so a parent is always seen before its children.
  for (const category of categories) {
    if (excluded.has(category.id_parent)) {
      excluded.add(category.id_category);
    } else if (result.has(category.id_parent) && !excluded.has(category.id_category)) {
      result.add(category.id_category);
    }
  }
  return result;
}

/** Products whose default category, or any category they are listed in, is quote-only. */
export function quoteOnlyProducts(
  products: Pick<PsProduct, 'id_product' | 'id_category_default'>[],
  assignments: { id_category: number; id_product: number }[],
  categories: Set<number>,
): Set<number> {
  const result = new Set(
    products.filter((p) => categories.has(p.id_category_default)).map((p) => p.id_product),
  );
  for (const assignment of assignments) {
    if (categories.has(assignment.id_category)) {
      result.add(assignment.id_product);
    }
  }
  return result;
}
