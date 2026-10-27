import { FC3 } from '../support/env';
import { expect, test } from '../support/test';

const cardNames = (page: import('@playwright/test').Page) => page.locator('main article h3');

test('category filters: stock, facet and sort, with noindex on filtered URLs', async ({ page }) => {
  await page.goto('/13-nettoyeurs-haute-pression');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    /\/13-nettoyeurs-haute-pression$/,
  );
  await page.check('input[name=stock]');
  await expect(page).toHaveURL(/stock=1/);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  await page.getByRole('link', { name: 'Tout effacer' }).click();
  await expect(page).toHaveURL(/\/13-nettoyeurs-haute-pression$/);

  await page.goto('/12-home-garden');
  await page.selectOption('select[name=order]', 'prix-asc');
  await expect(page).toHaveURL(/order=prix-asc/);
  await page.locator('label:has-text("Aspirateur") input').check();
  await expect(page).toHaveURL(/q=/);
  await expect(cardNames(page)).toHaveText(['Aspirateur laveur FC 3']);
});

test('search with filters keeps the search term', async ({ page }) => {
  await page.goto('/recherche?s=nettoyeur');
  await expect(cardNames(page).first()).toBeVisible();
  await page.check('input[name=stock]');
  await expect(page).toHaveURL(/s=nettoyeur.*stock=1|stock=1.*s=nettoyeur/);
  await page.getByRole('link', { name: 'Tout effacer' }).click();
  await expect(page).toHaveURL(/\/recherche\?s=nettoyeur$/);
});

test('sales: badge, struck-through price and the promotions page', async ({ page }) => {
  await page.goto(FC3.path);
  const buyBox = page.locator('main').getByText('-15 %').first();
  await expect(buyBox).toBeVisible();
  await expect(page.locator('main del').first()).toContainText('1 542,500');

  await page.goto('/promotions');
  await expect(cardNames(page)).toHaveCount(3);
  await expect(page.locator('main article').filter({ hasText: 'FC 3' })).toContainText('-15 %');
});

test('new products and best sellers follow PrestaShop', async ({ page }) => {
  await page.goto('/meilleures-ventes');
  await expect(cardNames(page)).toHaveText([
    'Aspirateur laveur FC 3',
    'Nettoyeur haute pression K 4 Power Control',
    'Brosse de lavage',
  ]);
  await page.goto('/nouveaux-produits');
  await expect(cardNames(page).first()).toHaveText('Balayeuse KM 70/20 C');
});

test('brand pages and supplier URLs', async ({ page, request }) => {
  await page.goto('/2_karcher');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kärcher');
  await expect(page).toHaveTitle('Produits Kärcher en Tunisie');
  await expect(cardNames(page)).toHaveCount(2);

  const wrongSlug = await request.get('/2_autre', { maxRedirects: 0 });
  expect(wrongSlug.status()).toBe(308);
  expect(wrongSlug.headers().location).toMatch(/\/2_karcher$/);
  expect((await request.get('/5_ancienne-marque')).status()).toBe(404);
  const supplier = await request.get('/3__karcher-france', { maxRedirects: 0 });
  expect(supplier.status()).toBe(301);
  expect(supplier.headers().location).toMatch(/\/brands$/);
});
