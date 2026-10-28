/**
 * Gate A of the migration plan: every public URL the PrestaShop shop can serve, built from its
 * database with the same builders the new storefront uses. Compare it with a crawl of the live
 * site and the Search Console export; any URL missing from either side needs a decision.
 *
 *   pnpm --filter @karcher/migration inventory   ->  tools/migration/out/url-inventory.csv
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  brandPath,
  categoryPath,
  cmsPath,
  imagePath,
  productPath,
  slugify,
  STATIC_PAGES,
} from '@karcher/seo';

import { productRedirects, replacedCategories } from './import/structure';
import { configFromEnv, PrestaShopReader } from './prestashop';
import { validEan } from './util';

interface InventoryRow {
  type: 'static' | 'category' | 'product' | 'brand' | 'cms' | 'image';
  id: number | '';
  path: string;
  active: boolean;
  /** What the new site answers: the page, a redirect the import sets up, or 404. */
  expect: 'page' | 'redirect' | 'gone';
}

const expectOf = (active: boolean, redirected = false): InventoryRow['expect'] =>
  redirected ? 'redirect' : active ? 'page' : 'gone';

const IMAGE_SIZES = ['home_default', 'large_default'];

async function main(): Promise<void> {
  const reader = PrestaShopReader.create(configFromEnv());
  try {
    const [categories, products, manufacturers, cmsPages, images, assignments] = await Promise.all([
      reader.categories(),
      reader.products(),
      reader.manufacturers(),
      reader.cmsPages(),
      reader.images(),
      reader.categoryProducts(),
    ]);
    const activeProducts = new Set(products.filter((p) => p.active).map((p) => p.id_product));
    const replaced = replacedCategories(categories, assignments);
    const redirectedProducts = new Set(
      productRedirects(products, categories, replaced).map((r) => r.fromPath),
    );

    const rows: InventoryRow[] = [
      ...Object.keys(STATIC_PAGES).map((p) => ({
        type: 'static' as const,
        id: '' as const,
        path: p,
        active: true,
        expect: 'page' as const,
      })),
      ...categories.map((c) => ({
        type: 'category' as const,
        id: c.id_category,
        path: categoryPath({ id: c.id_category, slug: c.link_rewrite }),
        active: c.active === 1,
        expect: expectOf(c.active === 1, c.active === 1 && replaced.has(c.id_category)),
      })),
      ...products.map((p) => {
        const productUrl = productPath({
          id: p.id_product,
          slug: p.link_rewrite,
          category: p.category_slug,
          ean13: validEan(p.ean13),
        });
        return {
          type: 'product' as const,
          id: p.id_product,
          path: productUrl,
          active: p.active === 1,
          expect: expectOf(p.active === 1, redirectedProducts.has(productUrl)),
        };
      }),
      ...manufacturers.map((m) => ({
        type: 'brand' as const,
        id: m.id_manufacturer,
        // PrestaShop builds the brand slug from its name.
        path: brandPath({ id: m.id_manufacturer, slug: slugify(m.name) }),
        active: m.active === 1,
        expect: expectOf(m.active === 1),
      })),
      ...cmsPages.map((c) => ({
        type: 'cms' as const,
        id: c.id_cms,
        path: cmsPath({ id: c.id_cms, slug: c.link_rewrite }),
        active: c.active === 1,
        expect: expectOf(c.active === 1),
      })),
      ...images.flatMap((i) =>
        IMAGE_SIZES.map((size) => ({
          type: 'image' as const,
          id: i.id_image,
          path: imagePath({ imageId: i.id_image, size, slug: i.product_slug }),
          active: activeProducts.has(i.id_product),
          expect: expectOf(activeProducts.has(i.id_product)),
        })),
      ),
    ];

    const here = path.dirname(fileURLToPath(import.meta.url));
    const outDir = path.join(here, '../out');
    mkdirSync(outDir, { recursive: true });
    const csv = [
      'type,id,path,active,expect',
      ...rows.map((r) => `${r.type},${r.id},${r.path},${r.active},${r.expect}`),
    ].join('\n');
    const outFile = path.join(outDir, 'url-inventory.csv');
    writeFileSync(outFile, `${csv}\n`);

    const count = (type: InventoryRow['type']) =>
      rows.filter((r) => r.type === type && r.active).length;
    console.log(`Wrote ${rows.length} URLs to ${path.relative(process.cwd(), outFile)}`);
    console.log(
      `Active: ${count('product')} products, ${count('category')} categories, ${count('brand')} brands, ` +
        `${count('cms')} CMS pages, ` +
        `${count('image')} image URLs, ${count('static')} fixed pages`,
    );
  } finally {
    await reader.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
