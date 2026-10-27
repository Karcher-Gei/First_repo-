import 'server-only';

import { vendureFetch, type TypedDocument } from '@karcher/graphql';
import { cookies } from 'next/headers';

const SHOP_API_URL = process.env.VENDURE_SHOP_API_URL ?? 'http://localhost:3000/shop-api';

/** Holds Vendure's session token: the shopper's cart, and their account once signed in. */
const SESSION_COOKIE = 'kgei_session';

/** Matches Vendure's default session duration (authOptions.sessionDuration, 1 year). */
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/**
 * Reads data that belongs to the shopper (cart, account) in a Server Component.
 * Never cached, and never creates a session: without a cookie, Vendure answers as an anonymous visitor.
 */
export async function shopSessionQuery<TResult, TVariables>(
  document: TypedDocument<TResult, TVariables>,
  variables: TVariables,
): Promise<TResult> {
  const { data } = await vendureFetch(document, variables, {
    url: SHOP_API_URL,
    authToken: await sessionToken(),
    init: { cache: 'no-store' },
  });
  return data;
}

/**
 * Runs a mutation for the shopper from a Server Action or Route Handler, and keeps the session
 * cookie in step with the token Vendure returns (a new cart session, or a login).
 */
export async function shopSessionMutation<TResult, TVariables>(
  document: TypedDocument<TResult, TVariables>,
  variables: TVariables,
): Promise<TResult> {
  const { data, authToken } = await vendureFetch(document, variables, {
    url: SHOP_API_URL,
    authToken: await sessionToken(),
    init: { cache: 'no-store' },
  });
  if (authToken) {
    (await cookies()).set(SESSION_COOKIE, authToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  }
  return data;
}

/** Signs the shopper out on this device. Server Actions only. */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
