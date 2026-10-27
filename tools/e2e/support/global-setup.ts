import { ADMIN_API, ADMIN_PASSWORD, ADMIN_USER, FC3 } from './env';

/**
 * Checks the stack is up with the fixture imported, and gives the product the specs buy enough
 * stock: every run places orders, and an import resets stock to the fixture's quantities.
 */
export default async function globalSetup(): Promise<void> {
  const base = process.env.E2E_BASE_URL ?? 'http://localhost:3001';
  const product = await fetch(new URL(FC3.path, base)).catch(() => null);
  if (product?.status !== 200) {
    throw new Error(
      `${base}${FC3.path} did not answer 200. Start the stack (pnpm dev) and import the PrestaShop ` +
        'fixture first (README, "Browser tests").',
    );
  }

  const login = await fetch(ADMIN_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: `mutation ($u: String!, $p: String!) { login(username: $u, password: $p) { __typename } }`,
      variables: { u: ADMIN_USER, p: ADMIN_PASSWORD },
    }),
  });
  const token = login.headers.get('vendure-auth-token');
  if (!token) {
    throw new Error(`Could not sign in to ${ADMIN_API} as ${ADMIN_USER}`);
  }
  const admin = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
    return (await response.json()) as { data: Record<string, any> };
  };
  const { data } = await admin(
    `query ($sku: String!) { productVariants(options: { filter: { sku: { eq: $sku } } }) { items { id } } }`,
    { sku: FC3.sku },
  );
  const id = data.productVariants.items[0]?.id;
  if (!id) {
    throw new Error(`Variant ${FC3.sku} not found: import the PrestaShop fixture first`);
  }
  await admin(
    `mutation ($id: ID!) { updateProductVariants(input: [{ id: $id, stockOnHand: 500 }]) { id } }`,
    { id },
  );
}
