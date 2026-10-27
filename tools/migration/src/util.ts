/** EAN-8 or EAN-13; anything else (PrestaShop accepts free text) is dropped. */
export function validEan(ean: string | null | undefined): string | null {
  return ean && /^(\d{8}|\d{13})$/.test(ean) ? ean : null;
}

/**
 * PrestaShop stores prices excluding VAT with 6 decimals; Vendure stores them including VAT, as an
 * integer in millimes (the channel has pricesIncludeTax and TND has 3 decimals).
 */
export function priceWithTaxMillimes(priceExclTax: string | number, ratePercent: number): number {
  return Math.round(Number(priceExclTax) * (1 + ratePercent / 100) * 1000);
}

/** Lowercase ASCII code for facets and option groups: "Haute pression" -> "haute-pression". */
export function codeOf(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'x'
  );
}

/** Where PrestaShop keeps an original product image: img/p/2/2/9/2/2292.jpg */
export function imageRelativePath(imageId: number): string {
  return `${String(imageId).split('').join('/')}/${imageId}.jpg`;
}

/** Empty strings from PrestaShop become null. */
export function orNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
