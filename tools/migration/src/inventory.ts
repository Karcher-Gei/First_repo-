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

import { categoryPath, cmsPath, imagePath, productPath, STATIC_PAGES } from '@karcher/seo';

import { configFromEnv, PrestaShopReader } from './prestashop';

interface InventoryRow {
  type: 'static' | 'category' | 'product' | 'cms' | 'image';
  id: number | '';
  path: string;
  active: boolean;
}

const IMAGE_SIZES = ['home_default', 'large_default'];

function validEan(ean: string | null | undefined): string | null {
  return ean && /^(\d{8}|\d{13})$/.test(ean) ? ean : null;
}

async function main(): Promise<void> {
  const reader = PrestaShopReader.create(configFromEnv());
  try {
    const [categories, products, cmsPages, images] = await Promise.all([
      reader.categories(),
      reader.products(),
      reader.cmsPages(),
      reader.images(),
    ]);
    const activeProducts = new Set(products.filter(p => p.active).map(p => p.id_product));

    const rows: InventoryRow[] = [
      ...Object.keys(STATIC_PAGES).map(p => ({ type: 'static' as const, id: '' as const, path: p, active: true })),
      ...categories.map(c => ({
        type: 'category' as const,
        id: c.id_category,
        path: categoryPath({ id: c.id_category, slug: c.link_rewrite }),
        active: c.active === 1,
      })),
      ...products.map(p => ({
        type: 'product' as const,
        id: p.id_product,
        path: productPath({
          id: p.id_product,
          slug: p.link_rewrite,
          category: p.category_slug,
          ean13: validEan(p.ean13),
        }),
        active: p.active === 1,
      })),
      ...cmsPages.map(c => ({
        type: 'cms' as const,
        id: c.id_cms,
        path: cmsPath({ id: c.id_cms, slug: c.link_rewrite }),
        active: c.active === 1,
      })),
      ...images.flatMap(i =>
        IMAGE_SIZES.map(size => ({
          type: 'image' as const,
          id: i.id_image,
          path: imagePath({ imageId: i.id_image, size, slug: i.product_slug }),
          active: activeProducts.has(i.id_product),
        })),
      ),
    ];

    const here = path.dirname(fileURLToPath(import.meta.url));
    const outDir = path.join(here, '../out');
    mkdirSync(outDir, { recursive: true });
    const csv = ['type,id,path,active', ...rows.map(r => `${r.type},${r.id},${r.path},${r.active}`)].join('\n');
    const outFile = path.join(outDir, 'url-inventory.csv');
    writeFileSync(outFile, `${csv}\n`);

    const count = (type: InventoryRow['type']) => rows.filter(r => r.type === type && r.active).length;
    console.log(`Wrote ${rows.length} URLs to ${path.relative(process.cwd(), outFile)}`);
    console.log(
      `Active: ${count('product')} products, ${count('category')} categories, ${count('cms')} CMS pages, ` +
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
