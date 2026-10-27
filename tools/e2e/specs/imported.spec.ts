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
