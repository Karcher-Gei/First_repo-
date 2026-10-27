import { cartCount } from '@/lib/cart';

/** Number of items in the shopper's cart, for the header link. */
export async function GET() {
  return Response.json(
    { count: await cartCount() },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
