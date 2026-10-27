import { timingSafeEqual } from 'node:crypto';

import { revalidateTag } from 'next/cache';

/**
 * Called by Vendure (StorefrontCachePlugin) when the catalog changes: products, prices, stock,
 * collections, facets or assets. Every cached Shop API read carries the "vendure" tag; it is
 * expired at once, so no shopper sees a price the dashboard has just changed.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get('x-revalidate-secret') ?? '';
  if (!secret || !sameSecret(given, secret)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  revalidateTag('vendure', { expire: 0 });
  return Response.json({ revalidated: true, now: Date.now() });
}

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
