/**
 * A GraphQL document carrying its result and variable types, as produced by
 * graphql-codegen's client preset in `documentMode: 'string'`, or written by hand.
 */
export interface TypedDocument<TResult, TVariables> {
  toString(): string;
  /** Phantom field: carries the types only, never set at runtime. */
  __apiType?: (variables: TVariables) => TResult;
}

/** Wraps a query string with its types, for hand-written queries until codegen runs. */
export function typedQuery<TResult, TVariables = Record<string, never>>(
  query: string,
): TypedDocument<TResult, TVariables> {
  return { toString: () => query };
}

export class VendureError extends Error {
  constructor(
    message: string,
    readonly errors: readonly { message: string; extensions?: Record<string, unknown> }[] = [],
  ) {
    super(message);
    this.name = 'VendureError';
  }
}

export interface VendureFetchOptions {
  /** Shop API URL, e.g. http://localhost:3000/shop-api */
  url: string;
  /** Session token (Vendure's `vendure-auth-token` header) for carts and accounts. */
  authToken?: string;
  /** Passed to fetch; Next.js reads `next.revalidate` / `next.tags` from it. */
  init?: Omit<RequestInit, 'method' | 'body' | 'headers'> & {
    headers?: Record<string, string>;
    next?: { revalidate?: number | false; tags?: string[] };
  };
}

export interface VendureResponse<TResult> {
  data: TResult;
  /** New session token when Vendure created or refreshed the session. */
  authToken: string | null;
}

export async function vendureFetch<TResult, TVariables>(
  document: TypedDocument<TResult, TVariables>,
  variables: TVariables,
  { url, authToken, init }: VendureFetchOptions,
): Promise<VendureResponse<TResult>> {
  const response = await fetch(url, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
    body: JSON.stringify({ query: document.toString(), variables }),
  });
  if (!response.ok) {
    throw new VendureError(`Vendure responded ${response.status} ${response.statusText}`);
  }
  const body = (await response.json()) as {
    data?: TResult;
    errors?: { message: string; extensions?: Record<string, unknown> }[];
  };
  if (body.errors?.length) {
    throw new VendureError(body.errors.map(e => e.message).join('; '), body.errors);
  }
  if (!body.data) {
    throw new VendureError('Vendure returned no data');
  }
  return { data: body.data, authToken: response.headers.get('vendure-auth-token') };
}
