/**
 * karcher-gei.tn URL formats, inherited from PrestaShop 1.7 and kept identical after the migration.
 *
 *   product   /{category}/{id}{-attributeId}-{slug}{-ean13}.html   /home-garden/867-aspirateur-laveur-fcv-3.html
 *   category  /{id}-{slug}                                          /12-home-garden
 *   cms       /content/{id}-{slug}                                  /content/62-devenir-revendeur
 *   image     /{imageId}-{size}/{slug}.{ext}                        /2292-home_default/aspirateur-laveur-fcv-3.jpg
 *   brand     /brand/{id}-{slug}                                    /brand/2-karcher
 *   supplier  /supplier/{id}-{slug}, /fournisseur                   /supplier/3-karcher-france (no pages: sent to /brands)
 *
 * Brand and supplier URLs follow the shop's routes (Shop Parameters > Traffic & SEO); PrestaShop's
 * default formats, /{id}_{slug} and /{id}__{slug}, are recognised too.
 *   static    fixed paths                                           /promotions, /nous-contacter, ...
 *
 * Pages are found by ID, never by slug: a wrong slug or category answers 301 to the canonical path.
 */

export const STATIC_PAGES = {
  '/promotions': 'prices-drop',
  '/meilleures-ventes': 'best-sales',
  '/nouveaux-produits': 'new-products',
  '/nous-contacter': 'contact',
  '/magasins': 'stores',
  '/brands': 'brands',
  '/reduction': 'discount',
} as const;

export type StaticPageKey = (typeof STATIC_PAGES)[keyof typeof STATIC_PAGES];

export type LegacyRoute =
  | {
      kind: 'product';
      productId: number;
      productAttributeId: number | null;
      category: string | null;
      slug: string;
      ean13: string | null;
    }
  | { kind: 'category'; categoryId: number; slug: string }
  | { kind: 'cms'; cmsId: number; slug: string }
  | { kind: 'image'; imageId: number; size: string; slug: string; ext: string }
  | { kind: 'brand'; brandId: number; slug: string }
  | { kind: 'supplier' }
  | { kind: 'static'; page: StaticPageKey };

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';

// id, optional combination id, lazy slug, optional EAN-8/EAN-13 suffix
const PRODUCT_RE = new RegExp(
  `^(?:/(${SLUG}))?/(\\d+)(?:-(\\d+))?-(${SLUG}?)(?:-(\\d{13}|\\d{8}))?\\.html$`,
);
const CATEGORY_RE = new RegExp(`^/(\\d+)-(${SLUG})$`);
const CMS_RE = new RegExp(`^/content/(\\d+)-(${SLUG})$`);
const IMAGE_RE = new RegExp(`^/(\\d+)-([a-z_]+)/(${SLUG})\\.(jpe?g|png|webp|gif)$`);
const BRAND_RE = new RegExp(`^/(?:brand/(\\d+)-|(\\d+)_)(${SLUG})$`);
const SUPPLIER_RE = new RegExp(`^/(?:supplier/\\d+-${SLUG}|\\d+__${SLUG}|fournisseur)$`);

/** Parses a request path (no domain, no query string) into the page it addresses, or null. */
export function parseLegacyPath(rawPath: string): LegacyRoute | null {
  const path = rawPath.toLowerCase();

  const staticPage = (STATIC_PAGES as Record<string, StaticPageKey>)[path];
  if (staticPage) {
    return { kind: 'static', page: staticPage };
  }

  let m = IMAGE_RE.exec(path);
  if (m) {
    return { kind: 'image', imageId: Number(m[1]), size: m[2]!, slug: m[3]!, ext: m[4]! };
  }

  m = PRODUCT_RE.exec(path);
  if (m) {
    return {
      kind: 'product',
      category: m[1] ?? null,
      productId: Number(m[2]),
      productAttributeId: m[3] ? Number(m[3]) : null,
      slug: m[4]!,
      ean13: m[5] ?? null,
    };
  }

  m = CMS_RE.exec(path);
  if (m) {
    return { kind: 'cms', cmsId: Number(m[1]), slug: m[2]! };
  }

  m = CATEGORY_RE.exec(path);
  if (m) {
    return { kind: 'category', categoryId: Number(m[1]), slug: m[2]! };
  }

  m = BRAND_RE.exec(path);
  if (m) {
    return { kind: 'brand', brandId: Number(m[1] ?? m[2]), slug: m[3]! };
  }

  if (SUPPLIER_RE.test(path)) {
    return { kind: 'supplier' };
  }

  return null;
}

export interface ProductPathInput {
  id: number;
  slug: string;
  /** Slug of the product's default category; omitted for products without one. */
  category?: string | null;
  ean13?: string | null;
}

export function productPath({ id, slug, category, ean13 }: ProductPathInput): string {
  const prefix = category ? `/${category}` : '';
  const suffix = ean13 ? `-${ean13}` : '';
  return `${prefix}/${id}-${slug}${suffix}.html`;
}

export function categoryPath({ id, slug }: { id: number; slug: string }): string {
  return `/${id}-${slug}`;
}

export function brandPath({ id, slug }: { id: number; slug: string }): string {
  return `/brand/${id}-${slug}`;
}

export function cmsPath({ id, slug }: { id: number; slug: string }): string {
  return `/content/${id}-${slug}`;
}

export function imagePath({
  imageId,
  size,
  slug,
  ext = 'jpg',
}: {
  imageId: number;
  size: string;
  slug: string;
  ext?: string;
}): string {
  return `/${imageId}-${size}/${slug}.${ext}`;
}

/** Turns a product or category name into a PrestaShop-style slug: "Nettoyeur Haute Pression K 2" -> "nettoyeur-haute-pression-k-2". */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
