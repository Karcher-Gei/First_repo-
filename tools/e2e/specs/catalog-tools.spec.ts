import { adminApi } from '../support/admin';
import { FC3 } from '../support/env';
import { expect, test } from '../support/test';

// The webmaster's catalog tools (Catalog > Mise à jour CSV, the product's "Catégories" block).

const PREVIEW = `query ($csv: String!) { previewCatalogCsv(csv: $csv) {
  changed unchanged errors applied rows { line sku errors changes { field from to } } } }`;
const APPLY = `mutation ($csv: String!) { applyCatalogCsv(csv: $csv) { changed errors applied } }`;

test('the catalog exports as CSV for Excel', async ({ request }) => {
  const admin = await adminApi(request);
  const { catalogCsvExport } = await admin<{ catalogCsvExport: string }>('{ catalogCsvExport }');
  const [header, ...rows] = catalogCsvExport.replace(/^﻿/, '').trim().split('\r\n');
  expect(header).toBe(
    'Référence;Produit;Version;Prix TTC;Prix barré TTC;Remise %;Fin de promotion;Stock;Sur devis;Actif;Catégories',
  );
  expect(rows.find((row) => row.startsWith(`${FC3.sku};`))).toContain('Aspirateur laveur FC 3');
});

test('a CSV is checked and previewed before it changes anything', async ({ request }) => {
  const admin = await adminApi(request);
  const csv = [
    'Référence;Stock;Prix barré TTC',
    'XX-404;3;',
    'PS-104;2;12000',
    `${FC3.sku};douze;`,
  ].join('\n');
  const { previewCatalogCsv: report } = await admin(PREVIEW, { csv });
  expect(report).toMatchObject({ changed: 0, errors: 3, applied: false });
  expect(report.rows.map((r: { errors: string[] }) => r.errors[0])).toEqual([
    expect.stringContaining('introuvable'),
    expect.stringContaining('Produit sur devis'),
    expect.stringContaining('nombre entier'),
  ]);
});

test('a CSV updates stock and the storefront follows', async ({ request, page }) => {
  const admin = await adminApi(request);
  const stock = 100 + Math.floor(Math.random() * 400);
  const csv = `Référence;Stock\n${FC3.sku};${stock}\n`;
  const { previewCatalogCsv: preview } = await admin(PREVIEW, { csv });
  expect(preview.rows[0].changes).toEqual([
    { field: 'Stock', from: expect.any(String), to: String(stock) },
  ]);
  const { applyCatalogCsv } = await admin(APPLY, { csv });
  expect(applyCatalogCsv).toMatchObject({ changed: 1, errors: 0, applied: true });

  // Back to "en stock" on the product page, without waiting for the cache to expire.
  await expect(async () => {
    await page.goto(FC3.path);
    await expect(page.locator('main')).toContainText('En stock', { timeout: 2000 });
  }).toPass({ timeout: 45_000 });
});

test('the categories of a product are set from its page', async ({ request, page }) => {
  const admin = await adminApi(request);
  const { products } = await admin(
    `{ products(options: { filter: { sku: { eq: "${FC3.sku}" } } }) { items { id } } }`,
  );
  const productId = products.items[0].id;
  const categories = async () =>
    (
      await admin(`query ($id: ID!) { productCategories(productId: $id) { id name assigned } }`, {
        id: productId,
      })
    ).productCategories as { id: string; name: string; assigned: boolean }[];
  const before = await categories();
  const proRange = before.find((c) => c.name === 'Professionnel')!;
  const set = (ids: string[]) =>
    admin(
      `mutation ($p: ID!, $c: [ID!]!) { setProductCategories(productId: $p, collectionIds: $c) { id } }`,
      {
        p: productId,
        c: ids,
      },
    );

  await set([...before.filter((c) => c.assigned).map((c) => c.id), proRange.id]);
  await expect(async () => {
    await page.goto('/15-professionnel');
    await expect(page.locator('main article').filter({ hasText: 'FC 3' })).toHaveCount(1, {
      timeout: 2000,
    });
  }).toPass({ timeout: 45_000 });

  await set(before.filter((c) => c.assigned).map((c) => c.id));
  expect((await categories()).find((c) => c.id === proRange.id)?.assigned).toBe(false);
});
