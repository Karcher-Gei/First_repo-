import { FC3 } from '../support/env';
import { addToCart, expect, test } from '../support/test';

test('quote request from a product page', async ({ page }) => {
  await page.goto(FC3.path);
  await page.getByRole('link', { name: 'Demander un devis' }).first().click();
  await expect(page).toHaveURL(/\/devis\?produit=/);
  await expect(page.locator('fieldset li').first()).toContainText('FC 3');

  await page.locator('input[name^=quantity-]').first().fill('25');
  await page.fill('input[name=fullName]', 'Hatem Jaziri');
  await page.fill('input[name=company]', 'Clean Pro SARL');
  await page.fill('input[name=email]', 'hatem@cleanpro.tn');
  await page.fill('textarea[name=message]', 'Tarif pour 25 machines, livraison Sfax.');
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();
  await expect(page.locator('form [role=status]')).toContainText(
    'Votre demande de devis est envoyée',
  );
});

test('quote request for the whole cart keeps its quantities', async ({ page }) => {
  await addToCart(page, FC3.path, 3);
  await page.goto('/panier');
  await page.getByRole('link', { name: 'Demander un devis pour ce panier' }).click();
  await expect(page).toHaveURL(/\/devis\?panier=1/);
  await expect(page.locator('input[name^=quantity-]').first()).toHaveValue('3');
});

test('warranty registration', async ({ page }) => {
  await page.goto('/garantie');
  await page.fill('input[name=fullName]', 'Hatem Jaziri');
  await page.fill('input[name=email]', 'hatem@cleanpro.tn');
  await page.fill('input[name=productSku]', '1.673-535.0');
  await page.fill('input[name=serialNumber]', 'SN-0042');
  await page.fill('input[name=purchaseDate]', '2026-09-15');
  await page.locator('main').getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('form [role=status]')).toContainText('Votre machine est enregistrée');
  await expect(page.locator('input[name=serialNumber]')).toHaveValue('');
});
