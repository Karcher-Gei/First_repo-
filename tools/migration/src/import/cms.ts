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
