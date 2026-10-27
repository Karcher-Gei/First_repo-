import { KM70, SHOP_API } from '../support/env';
import { expect, test } from '../support/test';

// The professional range is sold on quote only: its price and stock must never be public.

test('product page: no price, no stock, no cart, only the quote request', async ({ page }) => {
  await page.goto(KM70.path);
  const main = page.locator('main');
  await expect(main.getByText('Prix sur devis').first()).toBeVisible();
  await expect(main.getByRole('link', { name: 'Demander un devis' }).first()).toHaveAttribute(
    'href',
    /\/devis\?produit=/,
  );
  await expect(main.getByRole('button', { name: /Ajouter/ })).toHaveCount(0);
  await expect(main).not.toContainText(/\d[\d\s  ]*,\d{3} DT/);
  await expect(main).not.toContainText(/En stock|Rupture|Stock limité/);

  const html = await page.content();
  expect(html).not.toContain('10000000');
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join('')).not.toContain('"offers"');
});

test('listings: "Prix sur devis" and no stock filter or price sort', async ({ page }) => {
  await page.goto('/15-professionnel');
  await expect(page.locator('main article').filter({ hasText: 'KM 70/20' })).toContainText(
    'Prix sur devis',
  );
  await expect(page.locator('input[name=stock]')).toHaveCount(0);
  await expect(page.locator('select[name=order] option[value^=prix]')).toHaveCount(0);
});

test('the public Shop API reveals neither price nor stock, and refuses the cart', async ({
  request,
}) => {
  const gql = async (query: string) =>
    (await (await request.post(SHOP_API, { data: { query } })).json()) as { data: any };

  const { data: products } = await gql(
    `{ products(options: { filter: { legacyId: { eq: ${KM70.legacyId} } } }) {
        items { variants { id price priceWithTax stockLevel } } } }`,
  );
  const variant = products.products.items[0].variants[0];
  expect(variant).toMatchObject({ price: 0, priceWithTax: 0, stockLevel: 'ON_REQUEST' });

  const { data: search } = await gql(
    `{ search(input: { term: "balayeuse", groupByProduct: true }) {
        items { priceWithTax { ... on SinglePrice { value } ... on PriceRange { min max } } } } }`,
  );
  expect(JSON.stringify(search.search.items)).not.toContain('10000000');

  const { data: cart } = await gql(
    `mutation { addItemToOrder(productVariantId: "${variant.id}", quantity: 1) {
        __typename ... on ErrorResult { errorCode } } }`,
  );
  expect(cart.addItemToOrder.errorCode).toBe('ORDER_INTERCEPTOR_ERROR');
});
