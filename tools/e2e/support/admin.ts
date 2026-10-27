import type { APIRequestContext } from '@playwright/test';

import { ADMIN_API, ADMIN_PASSWORD, ADMIN_USER } from './env';

/** A signed-in Admin API client, for specs that act as the webmaster in the dashboard would. */
export async function adminApi(request: APIRequestContext) {
  const login = await request.post(ADMIN_API, {
    data: {
      query: `mutation ($u: String!, $p: String!) { login(username: $u, password: $p) { __typename } }`,
      variables: { u: ADMIN_USER, p: ADMIN_PASSWORD },
    },
  });
  const token = login.headers()['vendure-auth-token'];
  return async <T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> => {
    const response = await request.post(ADMIN_API, {
      headers: { authorization: `Bearer ${token}` },
      data: { query, variables },
    });
    const body = (await response.json()) as { data: T; errors?: { message: string }[] };
    if (body.errors) {
      throw new Error(body.errors.map((e) => e.message).join('; '));
    }
    return body.data;
  };
}
