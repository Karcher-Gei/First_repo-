import path from 'node:path';

import type { PrestaShopReader } from '../prestashop';
import { orNull } from '../util';
import type { VendureAdmin } from '../vendure-admin';
import type { ImageSource } from './catalog';
import type { Report } from './report';

/**
 * PrestaShop's homepage: the modules hooked on displayHome, in order. The standard ones have an
 * equivalent block in Payload (apps/storefront/src/cms/blocks.ts); any other is reported, so its
 * content can be rebuilt by hand.
 */

export const FEATURED_SLUG = 'coup-de-coeur';

export interface HomepageSlide {
  /** A file path, or a URL on the live site. */
  image: string;
  alt: string;
  heading: string | null;
  /** A path on this site (/13-nettoyeurs-haute-pression) or an external URL. */
  link: string | null;
}

export type HomepageSection =
  | { kind: 'slider'; slides: HomepageSlide[] }
  | {
      kind: 'carousel';
      title: string;
      source: 'collection' | 'best-sellers' | 'newest';
      collectionSlug?: string;
      link?: string;
      limit: number;
    };

/** out/homepage.json, read by the storefront's import:cms. */
export interface HomepageExport {
  sections: HomepageSection[];
}

const CAROUSELS: Record<
  string,
  { title: string; limitKey: string } & Omit<
    Extract<HomepageSection, { kind: 'carousel' }>,
    'kind' | 'title' | 'limit'
  >
> = {
  ps_specials: {
    title: 'Promotions',
    source: 'collection',
    collectionSlug: 'promotions',
    link: '/promotions',
    limitKey: 'BLOCKSPECIALS_SPECIALS_NBR',
  },
  ps_featuredproducts: {
    title: 'Coup de cœur',
    source: 'collection',
    collectionSlug: FEATURED_SLUG,
    limitKey: 'HOME_FEATURED_NBR',
  },
  ps_bestsellers: {
    title: 'Meilleures ventes',
    source: 'best-sellers',
    limitKey: 'PS_BLOCK_BESTSELLERS_TO_DISPLAY',
  },
  ps_newproducts: { title: 'Nouveaux produits', source: 'newest', limitKey: 'NEW_PRODUCTS_NBR' },
};
const LIMIT_KEYS = Object.values(CAROUSELS).map((c) => c.limitKey);

/** The shop's own domain: slide links to it become paths, so they work on any host. */
const SHOP_HOST = /^(www\.)?karcher-gei\.tn$/i;

/**
 * The featured products module (ps_featuredproducts) shows the products of one category, by
 * default Home (id 2), which is not imported as a category: they become the "Coup de cœur"
 * collection, outside the menu.
 */
export async function importFeaturedCollection(
  ps: PrestaShopReader,
  admin: VendureAdmin,
  productIds: Map<number, string>,
  report: Report,
): Promise<void> {
  const config = await ps.configuration(['HOME_FEATURED_CAT']);
  const categoryId = Number(config.get('HOME_FEATURED_CAT') ?? 2);
  const ids = [
    ...new Set(
      (await ps.categoryProducts())
        .filter((a) => a.id_category === categoryId)
        .flatMap((a) => (productIds.has(a.id_product) ? [productIds.get(a.id_product)!] : [])),
    ),
  ];
  if (ids.length === 0) {
    return;
  }

  const input = {
    isPrivate: false,
    filters: [
      {
        code: 'product-id-filter',
        arguments: [
          { name: 'productIds', value: JSON.stringify(ids) },
          { name: 'combineWithAnd', value: 'true' },
        ],
      },
    ],
    translations: [
      { languageCode: 'fr', name: 'Coup de cœur', slug: FEATURED_SLUG, description: '' },
    ],
  };
  const { collections } = await admin.gql<{ collections: { items: { id: string }[] } }>(
    `query ($slug: String!) { collections(options: { filter: { slug: { eq: $slug } } }) { items { id } } }`,
    { slug: FEATURED_SLUG },
  );
  const found = collections.items[0];
  if (found) {
    await admin.gql(
      `mutation ($input: UpdateCollectionInput!) { updateCollection(input: $input) { id } }`,
      { input: { ...input, id: found.id } },
    );
  } else {
    await admin.gql(
      `mutation ($input: CreateCollectionInput!) { createCollection(input: $input) { id } }`,
      { input },
    );
  }
  report.count('featured products ("Coup de cœur")', ids.length);
}

/** Slider images sit in modules/ps_imageslider/images, next to img/ (two levels above img/p). */
export function slideImageSource(products: ImageSource): ImageSource {
  return 'dir' in products
    ? { dir: path.resolve(products.dir, '../../modules/ps_imageslider/images') }
    : {
        baseUrl: new URL(
          '../../modules/ps_imageslider/images/',
          `${products.baseUrl.replace(/\/$/, '')}/`,
        ).href,
      };
}

export async function exportHomepage(
  ps: PrestaShopReader,
  slideImages: ImageSource,
  report: Report,
): Promise<HomepageExport> {
  const [modules, config, categories] = await Promise.all([
    ps.homeModules(),
    ps.configuration(LIMIT_KEYS),
    ps.categories(),
  ]);
  const sections: HomepageSection[] = [];
  for (const module of modules.filter((m) => m.active === 1)) {
    if (module.name === 'ps_imageslider') {
      const slides = (await ps.homeSlides()).map((slide) => ({
        image:
          'dir' in slideImages
            ? path.join(slideImages.dir, slide.image)
            : new URL(encodeURIComponent(slide.image), slideImages.baseUrl).href,
        alt: orNull(slide.legend) ?? orNull(slide.title) ?? '',
        heading: orNull(slide.title),
        link: localLink(slide.url),
      }));
      if (slides.length) {
        sections.push({ kind: 'slider', slides });
        report.count('homepage slides exported', slides.length);
      }
      continue;
    }
    const carousel = CAROUSELS[module.name];
    if (carousel) {
      const { limitKey, ...rest } = carousel;
      sections.push({ kind: 'carousel', ...rest, limit: Number(config.get(limitKey) ?? 8) || 8 });
      continue;
    }
    report.warn(
      `Homepage module "${module.name}" has no equivalent: rebuild its content in Payload (Homepage)`,
    );
  }
  // A theme that builds the homepage itself (novthemeconfig, Revolution Slider...) leaves none of the
  // standard modules: start from the shop's own selections instead.
  if (!sections.some((section) => section.kind === 'carousel')) {
    const featured = categories.some((c) => c.active === 1 && c.link_rewrite === FEATURED_SLUG);
    sections.push(
      ...defaultCarousels.filter((c) => featured || c.collectionSlug !== FEATURED_SLUG),
    );
    report.warn(
      'No standard product module on the homepage: default carousels exported (Promotions, Coup de cœur, Meilleures ventes); arrange them in Payload (Homepage)',
    );
  }
  report.count('homepage sections exported', sections.length);
  return { sections };
}

function carousel(module: string, extra: { link?: string } = {}) {
  const { limitKey: _limitKey, ...rest } = CAROUSELS[module]!;
  return { kind: 'carousel' as const, ...rest, ...extra, limit: 8 };
}

const defaultCarousels = [
  carousel('ps_specials'),
  carousel('ps_featuredproducts'),
  carousel('ps_bestsellers', { link: '/meilleures-ventes' }),
];

function localLink(url: string | null): string | null {
  const value = orNull(url);
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    return SHOP_HOST.test(parsed.hostname) ? parsed.pathname + parsed.search : value;
  } catch {
    return value.startsWith('/') ? value : `/${value}`;
  }
}
