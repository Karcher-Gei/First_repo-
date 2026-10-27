import { categoryPath, cmsPath, STATIC_PAGES } from '@karcher/seo';
import type { MetadataRoute } from 'next';

import { getCms } from '@/lib/cms';
import { productHref } from '@/lib/paths';
import { SITEMAP_COLLECTIONS, SITEMAP_PRODUCTS } from '@/lib/queries';
import { absoluteUrl } from '@/lib/site';
import { shopQuery } from '@/lib/vendure';

export const revalidate = 3600;

/** Generated live from Vendure and Payload; today's PrestaShop sitemap stopped updating in April 2024. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    ...Object.keys(STATIC_PAGES).map(path => ({ url: absoluteUrl(path) })),
  ];

  const { collections } = await shopQuery(SITEMAP_COLLECTIONS, {});
  for (const collection of collections.items) {
    const { legacyId } = collection.customFields;
    if (legacyId != null) {
      entries.push({
        url: absoluteUrl(categoryPath({ id: legacyId, slug: collection.slug })),
        lastModified: collection.updatedAt,
      });
    }
  }

  const take = 100;
  for (let skip = 0; ; skip += take) {
    const { products } = await shopQuery(SITEMAP_PRODUCTS, { skip, take });
    for (const product of products.items) {
      const href = productHref(product);
      if (href) {
        entries.push({ url: absoluteUrl(href), lastModified: product.updatedAt });
      }
    }
    if (products.items.length < take) {
      break;
    }
  }

  const cms = await getCms();
  const pages = await cms.find({ collection: 'pages', limit: 500, depth: 0 });
  for (const page of pages.docs) {
    entries.push({ url: absoluteUrl(cmsPath({ id: page.legacyId, slug: page.slug })), lastModified: page.updatedAt });
  }

  return entries;
}
