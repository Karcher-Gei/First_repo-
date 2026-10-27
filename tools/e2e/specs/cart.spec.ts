import { FC3 } from '../support/env';
import { addToCart, digits, expect, formatted, millimes, test } from '../support/test';

test('add a product, change its quantity and remove it', async ({ page }) => {
  await addToCart(page, FC3.path, 2);
  await expect(page.locator('header a[href="/panier"]')).toContainText('2');

  await page.goto('/panier');
  const unit = millimes((await page.getByText('l’unité').first().textContent()) ?? '');
  const totals = page.locator('aside dl');
  await expect(totals).toContainText('Sous-total');
  expect(digits(await totals.textContent())).toContain(formatted(2 * unit));

  await page.locator('main input[type=number]').first().fill('3');
  await page.getByRole('button', { name: 'Mettre à jour' }).first().click();
  await expect.poll(async () => digits(await totals.textContent())).toContain(formatted(3 * unit));

  await page.getByRole('button', { name: 'Retirer' }).first().click();
  await expect(page.getByText('Votre panier est vide.')).toBeVisible();
});
