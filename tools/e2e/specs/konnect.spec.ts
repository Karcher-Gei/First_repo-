import type { Page } from '@playwright/test';

import { addToCart, expect, fillCheckout, test, uniqueEmail } from '../support/test';

// Konnect is replaced by support/konnect-mock.cjs: /pay/{ref} plays the shopper paying, calls
// the webhook and redirects back; with ?fail=1 the payment fails.

async function payWithKonnect(page: Page, name: string) {
  await addToCart(page);
  await fillCheckout(page, {
    firstName: name,
    lastName: 'Trabelsi',
    email: uniqueEmail(name.toLowerCase()),
    street: '5 avenue Habib Bourguiba',
    city: 'Sousse',
    province: 'Sousse',
    postalCode: '4000',
    phone: '+216 98 000 000',
  });
  await page.check('input[name=paymentMethod][value=konnect]');
  await page.getByRole('button', { name: 'Commander et payer' }).click();
}

test('a successful Konnect payment confirms the order', async ({ page }) => {
  await payWithKonnect(page, 'Sami');
  await expect(page).toHaveURL(/\/commande\/confirmation\//);
  await expect(page.getByText('Merci pour votre commande')).toBeVisible({ timeout: 20_000 });
});

test('after a failed Konnect payment the shopper can pay again', async ({ page, context }) => {
  let failOnce = true;
  await context.route('http://localhost:4010/pay/*', (route) => {
    const url = failOnce ? `${route.request().url()}?fail=1` : route.request().url();
    failOnce = false;
    return route.continue({ url });
  });
  await payWithKonnect(page, 'Leila');
  await expect(page).toHaveURL(/\/commande\/paiement/);
  await expect(page.locator('main [role=alert]')).toBeVisible();

  await page.getByRole('button', { name: 'Payer avec Konnect' }).click();
  await expect(page).toHaveURL(/\/commande\/confirmation\//);
  await expect(page.getByText('Merci pour votre commande')).toBeVisible({ timeout: 20_000 });
});
