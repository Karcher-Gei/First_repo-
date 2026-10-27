import { STATIC_PAGES, type StaticPageKey } from '@karcher/seo';

import type { PrestaShopReader } from '../prestashop';
import { orNull } from '../util';
import type { Report } from './report';

/** A PrestaShop CMS page, as the storefront's CMS import script reads it (out/cms-pages.json). */
export interface CmsPageExport {
  legacyId: number;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  html: string;
}

/**
 * Active CMS pages, exported for Payload: the storefront script converts their HTML to Payload's
 * rich text, which needs the CMS configuration (see apps/storefront/scripts/import-cms.ts).
 */
export async function exportCmsPages(
  ps: PrestaShopReader,
  report: Report,
): Promise<CmsPageExport[]> {
  const pages = await ps.cmsPages();
  const inactive = pages.filter((p) => p.active !== 1);
  if (inactive.length) {
    report.count('inactive CMS pages left out', inactive.length);
  }
  const active = pages.filter((p) => p.active === 1);
  report.count('CMS pages exported', active.length);
  return active.map((page) => ({
    legacyId: page.id_cms,
    slug: page.link_rewrite,
    title: page.meta_title,
    metaTitle: orNull(page.meta_title),
    metaDescription: orNull(page.meta_description),
    html: page.content ?? '',
  }));
}

/** Meta tags of the homepage and the fixed pages, for Payload (out/page-meta.json). */
export interface PageMetaExport {
  homepage: { title: string | null; description: string | null };
  pages: { page: StaticPageKey; title: string | null; description: string | null }[];
}

/** PrestaShop's name for a fixed page, when it differs from the storefront's. */
const PS_PAGE: Partial<Record<StaticPageKey, string>> = { brands: 'manufacturer' };

/**
 * Meta titles and descriptions of the homepage and the fixed pages (Préférences > Trafic & SEO).
 * Their friendly URLs are fixed in @karcher/seo; one that differs on the shop is reported, since
 * its old URL would stop working.
 */
export async function exportPageMetas(
  ps: PrestaShopReader,
  report: Report,
): Promise<PageMetaExport> {
  const metas = new Map((await ps.pageMetas()).map((m) => [m.page, m]));
  const home = metas.get('index');
  const pages: PageMetaExport['pages'] = [];
  for (const [path, page] of Object.entries(STATIC_PAGES)) {
    const meta = metas.get(PS_PAGE[page] ?? page);
    if (!meta) {
      continue;
    }
    if (`/${meta.url_rewrite}` !== path) {
      report.warn(
        `Fixed page "${meta.page}" is at /${meta.url_rewrite} on PrestaShop but ${path} here: add it to STATIC_PAGES in packages/seo`,
      );
    }
    pages.push({ page, title: orNull(meta.title), description: orNull(meta.description) });
  }
  report.count('fixed page meta tags exported', pages.length + (home ? 1 : 0));
  return {
    homepage: { title: orNull(home?.title), description: orNull(home?.description) },
    pages,
  };
}
