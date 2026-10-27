import { addToCart, expect, fillCheckout, test, uniqueEmail } from '../support/test';

test('a guest checks out with the test payment method', async ({ page }) => {
  await addToCart(page, undefined, 2);
  await fillCheckout(page, {
    firstName: 'Amel',
    lastName: 'Ben Salah',
    email: uniqueEmail('amel'),
    street: '12 rue de Marseille',
    city: 'Tunis',
    province: 'Tunis',
    postalCode: '1000',
    phone: '+216 20 000 000',
  });
  await page.check('input[name=paymentMethod][value=test]');
  await page.getByRole('button', { name: 'Commander et payer' }).click();

  await expect(page).toHaveURL(/\/commande\/confirmation\/[A-Z0-9]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Merci pour votre commande');
  await page.goto('/panier');
  await expect(page.getByText('Votre panier est vide.')).toBeVisible();
});
