// Configures the default channel for the Tunisian shop: TND, French, a Tunisia zone with 19% VAT,
// a shipping method and the Konnect payment method. Safe to run again; existing records are kept.
// Needs a running server: `pnpm dev:server`, then `pnpm setup:channel`.
import 'dotenv/config';

const port = process.env.PORT || process.env.VENDURE_SERVER_PORT || 3000;
const adminApi = `${process.env.SERVER_PUBLIC_URL || `http://localhost:${port}`}/admin-api`;
const IS_DEV = process.env.APP_ENV === 'dev';

let token = '';

async function gql(query, variables = {}) {
  const res = await fetch(adminApi, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  token = res.headers.get('vendure-auth-token') ?? token;
  const body = await res.json();
  if (body.errors) {
    throw new Error(body.errors.map((e) => e.message).join('\n'));
  }
  return body.data;
}

/** Mutations return error results instead of throwing; fail loudly on them. */
function ok(result) {
  if (result && 'errorCode' in result && result.errorCode) {
    throw new Error(`${result.errorCode}: ${result.message}`);
  }
  return result;
}

const login = await gql(
  `mutation ($u: String!, $p: String!) { login(username: $u, password: $p) { ... on CurrentUser { id } ... on ErrorResult { errorCode message } } }`,
  { u: process.env.SUPERADMIN_USERNAME, p: process.env.SUPERADMIN_PASSWORD },
);
ok(login.login);

await gql(
  `mutation { updateGlobalSettings(input: { availableLanguages: [fr, en] }) { ... on GlobalSettings { id } } }`,
);

// Country and zone
const { countries } = await gql(
  `{ countries(options: { filter: { code: { eq: "TN" } } }) { items { id } } }`,
);
const countryId =
  countries.items[0]?.id ??
  (
    await gql(`mutation { createCountry(input: {
            code: "TN", enabled: true,
            translations: [{ languageCode: fr, name: "Tunisie" }, { languageCode: en, name: "Tunisia" }]
        }) { id } }`)
  ).createCountry.id;

const { zones } = await gql(
  `{ zones(options: { filter: { name: { eq: "Tunisie" } } }) { items { id } } }`,
);
const zoneId =
  zones.items[0]?.id ??
  (
    await gql(
      `mutation ($c: [ID!]!) { createZone(input: { name: "Tunisie", memberIds: $c }) { id } }`,
      {
        c: [countryId],
      },
    )
  ).createZone.id;

// Tax: standard Tunisian VAT. Add the reduced rates (7%, 13%) as categories when products need them.
const { taxCategories } = await gql(
  `{ taxCategories(options: { filter: { name: { eq: "TVA 19%" } } }) { items { id } } }`,
);
const taxCategoryId =
  taxCategories.items[0]?.id ??
  (await gql(`mutation { createTaxCategory(input: { name: "TVA 19%", isDefault: true }) { id } }`))
    .createTaxCategory.id;

const { taxRates } = await gql(
  `{ taxRates(options: { filter: { name: { eq: "TVA 19%" } } }) { items { id } } }`,
);
if (!taxRates.items.length) {
  await gql(
    `mutation ($z: ID!, $t: ID!) { createTaxRate(input: { name: "TVA 19%", enabled: true, value: 19, categoryId: $t, zoneId: $z }) { id } }`,
    { z: zoneId, t: taxCategoryId },
  );
}

// Channel: prices are entered tax-inclusive, as in PrestaShop.
const { activeChannel } = await gql(`{ activeChannel { id } }`);
ok(
  (
    await gql(
      `mutation ($id: ID!, $z: ID!) { updateChannel(input: {
                id: $id,
                defaultLanguageCode: fr, availableLanguageCodes: [fr],
                defaultCurrencyCode: TND, availableCurrencyCodes: [TND],
                pricesIncludeTax: true,
                defaultTaxZoneId: $z, defaultShippingZoneId: $z
            }) { ... on Channel { id } ... on ErrorResult { errorCode message } } }`,
      { id: activeChannel.id, z: zoneId },
    )
  ).updateChannel,
);

// Shipping: rate 0 until the real delivery prices are set in the dashboard.
const { shippingMethods } = await gql(
  `{ shippingMethods(options: { filter: { code: { eq: "standard" } } }) { items { id } } }`,
);
if (!shippingMethods.items.length) {
  await gql(`mutation { createShippingMethod(input: {
        code: "standard",
        fulfillmentHandler: "manual-fulfillment",
        checker: { code: "default-shipping-eligibility-checker", arguments: [{ name: "orderMinimum", value: "0" }] },
        calculator: { code: "default-shipping-calculator", arguments: [
            { name: "rate", value: "0" }, { name: "includesTax", value: "include" }, { name: "taxRate", value: "19" }
        ] },
        translations: [{ languageCode: fr, name: "Livraison standard", description: "" }]
    }) { id } }`);
}

// Payment methods: Konnect everywhere, plus the dummy handler for local checkout tests.
const paymentMethodsWanted = [
  { code: 'konnect', handler: 'konnect', name: 'Paiement en ligne (Konnect)' },
  ...(IS_DEV
    ? [{ code: 'test', handler: 'dummy-payment-handler', name: 'Paiement test (dev)' }]
    : []),
];
const { paymentMethods } = await gql(`{ paymentMethods { items { code } } }`);
for (const pm of paymentMethodsWanted) {
  if (paymentMethods.items.some((existing) => existing.code === pm.code)) continue;
  const args =
    pm.handler === 'dummy-payment-handler' ? [{ name: 'automaticSettle', value: 'true' }] : [];
  await gql(
    `mutation ($code: String!, $handler: String!, $name: String!, $args: [ConfigArgInput!]!) {
            createPaymentMethod(input: {
                code: $code, enabled: true,
                handler: { code: $handler, arguments: $args },
                translations: [{ languageCode: fr, name: $name, description: "" }]
            }) { id } }`,
    { ...pm, args },
  );
}

console.log(
  'Default channel configured: TND, fr, zone Tunisie, TVA 19%, shipping "standard", payment methods.',
);
