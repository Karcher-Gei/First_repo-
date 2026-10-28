import { FC3, K4 } from '../support/env';
import { expect, test } from '../support/test';

// What the import of the PrestaShop fixture must produce on the storefront.

test('product page keeps PrestaShop meta tags and image legends', async ({ page }) => {
  await page.goto(FC3.path);
  await expect(page).toHaveTitle('Aspirateur laveur FC 3 Kärcher | Karcher Tunisie');
  await expect(page.locator('meta[name=description]')).toHaveAttribute(
    'content',
    'Nettoyeur de sols FC 3 : aspire et lave en un passage.',
  );
  await expect(
    page.locator('main img[alt="Aspirateur laveur FC 3 Kärcher"]').first(),
  ).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Images du produit' }).getByRole('button'),
  ).toHaveCount(2);
});

test('combinations are versions with their own price', async ({ page }) => {
  await page.goto(K4.path);
  await page.locator('label:has-text("Home")').click();
  await expect(page.locator('main')).toContainText('950,000');
  await expect(page.locator('main')).toContainText('1.324-033.0');
});

test('homepage and fixed pages keep their meta tags', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Kärcher Tunisie - Nettoyeurs haute pression et aspirateurs');
  await page.goto('/nous-contacter');
  await expect(page).toHaveTitle('Contactez-nous');
});

test('homepage: PrestaShop slider and carousels among the Kärcher sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('La puissance du nettoyage');
  await expect(page.getByRole('region', { name: 'À la une' })).toContainText(
    'Nettoyeurs haute pression K 4',
  );
  await expect(page.locator('main h2')).toContainText([
    'Promotions',
    'Coup de cœur',
    'Meilleures ventes',
    'Nos catégories',
  ]);
});

test('CMS page converted from PrestaShop HTML', async ({ page }) => {
  await page.goto('/content/62-devenir-revendeur');
  await expect(page.locator('main h2').first()).toBeVisible();
});

test('customers sign in with their PrestaShop password; old MD5 ones are sent to reset', async ({
  page,
}) => {
  await page.goto('/compte/connexion');
  await page.fill('input[name=emailAddress]', 'Karim.Trabelsi@example.tn');
  await page.fill('input[name=password]', '123456');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.locator('form [role=alert]')).toBeVisible();

  await page.fill('input[name=emailAddress]', 'amel.bensalah@example.tn');
  await page.fill('input[name=password]', 'motdepasse1');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('/compte');
  await page.goto('/compte/adresses');
  await expect(page.locator('main')).toContainText('12 rue de Marseille');
});

test('categories sharing a slug keep their PrestaShop URLs', async ({ page }) => {
  for (const path of ['/14-aspirateurs', '/17-aspirateurs']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aspirateurs');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      new RegExp(`${path}$`),
    );
  }
  // The professional one: menu label in the breadcrumb.
  await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' })).toContainText(
    'Aspirateurs pro',
  );
});

test('the menu keeps PrestaShop labels and leaves out the selections', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('header');
  await expect(header).toContainText('Maison & jardin');
  await expect(header).toContainText('Aspirateurs pro');
  await expect(header).not.toContainText('Coup de cœur');
  // Still a page of its own, behind the homepage carousel.
  expect((await page.request.get('/19-coup-de-coeur')).status()).toBe(200);
});

test('replaced categories and inactive products redirect like PrestaShop', async ({ request }) => {
  const expectations = {
    '/18-promotions': '/promotions',
    '/nettoyeurs-haute-pression/103-ancien-modele-k-2.html': '/13-nettoyeurs-haute-pression',
  };
  for (const [from, to] of Object.entries(expectations)) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers().location).toMatch(new RegExp(`${to}$`));
  }
});
