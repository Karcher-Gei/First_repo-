import { categoryPath, productPath } from '@karcher/seo';

import type { PsCategory, PsMenuEntry, PsProduct } from '../prestashop';
import { validEan } from '../util';

/**
 * How the PrestaShop category tree maps onto the new site: menu labels, categories left out of
 * the menu, categories replaced by an automatic page, and where inactive products send visitors.
 */

/** Short labels of the main menu (novmegamenu), by category id; empty without the module. */
export function menuLabels(entries: PsMenuEntry[]): Map<number, string> {
  const result = new Map<number, string>();
  for (const entry of entries) {
    const id = Number(entry.value);
    if (entry.type === 'category' && entry.active === 1 && id > 0 && !result.has(id)) {
      result.set(id, entry.title.trim());
    }
  }
  return result;
}

/**
 * Hand-filled categories the new site replaces with an automatic page: "Promotions" lists every
 * product on sale, and an empty "Bestsellers" the real best sellers. A "Bestsellers" with products
 * stays a hand-picked selection.
 */
export function replacedCategories(
  categories: PsCategory[],
  assignments: { id_category: number }[],
): Map<number, string> {
  const filled = new Set(assignments.map((a) => a.id_category));
  const result = new Map<number, string>();
  for (const category of categories) {
    if (category.link_rewrite === 'promotions') {
      result.set(category.id_category, '/promotions');
    } else if (category.link_rewrite === 'bestsellers' && !filled.has(category.id_category)) {
      result.set(category.id_category, '/meilleures-ventes');
    }
  }
  return result;
}

export interface Redirect {
  fromPath: string;
  toPath: string;
}

/**
 * PrestaShop sends an inactive product's URL to a category or another product (redirect_type
 * "301-category", "302-product"...). Both become permanent redirects: Vendure's table only keeps
 * 301s, and a product that left the catalog is not coming back. Targets that are not on the new
 * site (inactive or replaced category, inactive product) fall back to the replacing page or are
 * skipped, leaving a 404.
 */
export function productRedirects(
  products: PsProduct[],
  categories: PsCategory[],
  replaced: Map<number, string>,
): Redirect[] {
  const categoryById = new Map(categories.map((c) => [c.id_category, c]));
  const productById = new Map(products.map((p) => [p.id_product, p]));
  const categoryTarget = (id: number): string | null => {
    const replacement = replaced.get(id);
    if (replacement) {
      return replacement;
    }
    const category = categoryById.get(id);
    return category && category.active === 1
      ? categoryPath({ id, slug: category.link_rewrite })
      : null;
  };

  const result: Redirect[] = [];
  for (const product of products) {
    if (product.active === 1) {
      continue;
    }
    const [, kind] = /^30[12]-(category|product)$/.exec(product.redirect_type ?? '') ?? [];
    let toPath: string | null = null;
    if (kind === 'category') {
      toPath = categoryTarget(product.id_type_redirected || product.id_category_default);
    } else if (kind === 'product') {
      const target = productById.get(product.id_type_redirected);
      toPath = target && target.active === 1 ? pathOf(target) : null;
    }
    if (toPath) {
      result.push({ fromPath: pathOf(product), toPath });
    }
  }
  return result;
}

/** The product's URL on PrestaShop: /{default category}/{id}-{slug}{-ean13}.html */
export function pathOf(product: PsProduct): string {
  return productPath({
    id: product.id_product,
    slug: product.link_rewrite,
    category: product.category_slug,
    ean13: validEan(product.ean13),
  });
}
