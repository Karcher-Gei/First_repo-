/** Percentage off a regular price, rounded as shoppers expect ("-15 %"); 0 when not on sale. */
export function discountPercent(price: number, regularPrice: number | null | undefined): number {
  return regularPrice && regularPrice > price ? Math.round((1 - price / regularPrice) * 100) : 0;
}

type SaleVariant = { priceWithTax: number; customFields: { regularPrice: number | null } | null };

/**
 * A product's sale, for a tile showing `price` (its lowest price): the struck-through price when
 * the variant at that price is on sale, and the biggest discount among its variants.
 */
export function productSale(
  variants: SaleVariant[],
  price: number,
): { regularPrice: number | null; percent: number } {
  const atPrice = variants.find(
    (v) =>
      v.priceWithTax === price && discountPercent(v.priceWithTax, v.customFields?.regularPrice),
  );
  const percent = Math.max(
    0,
    ...variants.map((v) => discountPercent(v.priceWithTax, v.customFields?.regularPrice)),
  );
  return { regularPrice: atPrice?.customFields?.regularPrice ?? null, percent };
}

/** "jusqu’au 31 décembre 2026", in Tunisia time. */
export function saleEndText(endsAt: string): string {
  return `jusqu’au ${new Date(endsAt).toLocaleDateString('fr-TN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Tunis',
  })}`;
}
