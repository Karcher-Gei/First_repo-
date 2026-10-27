import 'server-only';

import { vendureFetch, type TypedDocument } from '@karcher/graphql';

const SHOP_API_URL = process.env.VENDURE_SHOP_API_URL ?? 'http://localhost:3000/shop-api';

/**
 * Catalog reads from Vendure's Shop API, cached by Next.js for `revalidate` seconds.
 * Cart and account calls need the shopper's session token and must not be cached.
 */
export async function shopQuery<TResult, TVariables>(
  document: TypedDocument<TResult, TVariables>,
  variables: TVariables,
  revalidate = 300,
): Promise<TResult> {
  const { data } = await vendureFetch(document, variables, {
    url: SHOP_API_URL,
    init: { next: { revalidate, tags: ['vendure'] } },
  });
  return data;
}
