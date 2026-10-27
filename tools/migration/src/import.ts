/**
 * Imports the PrestaShop shop into Vendure: catalog (taxes, features, images, products,
 * categories, brands), customers with their passwords, and CMS pages and fixed pages' meta tags
 * exported for Payload.
 * Safe to run again: everything is matched on its PrestaShop id (customers on their e-mail).
 *
 *   pnpm --filter @karcher/migration import:shop                   # everything
 *   pnpm --filter @karcher/migration import:shop --only=catalog --limit=20
 *
 * Then: pnpm --filter @karcher/storefront import:cms  (reads out/cms-pages.json and out/page-meta.json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { importCatalog, type ImageSource } from './import/catalog';
import { exportCmsPages, exportPageMetas } from './import/cms';
import { importCustomers } from './import/customers';
import { Report } from './import/report';
import { configFromEnv, PrestaShopReader } from './prestashop';
import { VendureAdmin, vendureConfigFromEnv } from './vendure-admin';

const STEPS = ['catalog', 'customers', 'cms'] as const;
type Step = (typeof STEPS)[number];

function imageSourceFromEnv(): ImageSource {
  const { PS_IMAGE_DIR, PS_IMAGE_BASE_URL } = process.env;
  if (PS_IMAGE_DIR) {
    return { dir: PS_IMAGE_DIR };
  }
  if (PS_IMAGE_BASE_URL) {
    return { baseUrl: PS_IMAGE_BASE_URL };
  }
  throw new Error(
    'Set PS_IMAGE_DIR (a copy of img/p) or PS_IMAGE_BASE_URL (e.g. https://karcher-gei.tn/img/p)',
  );
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { only: { type: 'string' }, limit: { type: 'string' } },
  });
  const steps = (values.only?.split(',') ?? [...STEPS]) as Step[];
  const unknown = steps.filter((s) => !STEPS.includes(s));
  if (unknown.length) {
    throw new Error(`Unknown step(s) ${unknown.join(', ')}; choose from ${STEPS.join(', ')}`);
  }

  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../out');
  mkdirSync(outDir, { recursive: true });
  const report = new Report();
  const ps = PrestaShopReader.create(configFromEnv());
  try {
    const admin =
      steps.includes('catalog') || steps.includes('customers')
        ? await VendureAdmin.connect(vendureConfigFromEnv())
        : null;

    if (steps.includes('catalog')) {
      console.log('Catalog…');
      await importCatalog(
        ps,
        admin!,
        {
          images: imageSourceFromEnv(),
          limit: values.limit ? Number(values.limit) : undefined,
          defaultTaxRate: 19,
        },
        report,
      );
    }

    if (steps.includes('customers')) {
      console.log('Customers…');
      const databaseUrl = process.env.VENDURE_DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('VENDURE_DATABASE_URL is not set (needed to store password hashes)');
      }
      const resets = await importCustomers(ps, admin!, databaseUrl, report);
      const csv = [
        'email,firstName,lastName,reason',
        ...resets.map((r) => [r.email, r.firstName, r.lastName, r.reason].map(csvCell).join(',')),
      ].join('\n');
      writeFileSync(path.join(outDir, 'password-reset.csv'), `${csv}\n`);
    }

    if (steps.includes('cms')) {
      console.log('CMS pages…');
      const pages = await exportCmsPages(ps, report);
      writeFileSync(path.join(outDir, 'cms-pages.json'), `${JSON.stringify(pages, null, 2)}\n`);
      const metas = await exportPageMetas(ps, report);
      writeFileSync(path.join(outDir, 'page-meta.json'), `${JSON.stringify(metas, null, 2)}\n`);
    }
  } finally {
    await ps.close();
    writeFileSync(path.join(outDir, 'import-report.txt'), report.toText());
  }

  console.log(`\n${report.summary()}`);
  console.log(
    `\nReport, password resets and CMS export in ${path.relative(process.cwd(), outDir)}/`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
