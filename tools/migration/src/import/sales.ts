import type { PsSpecificPrice } from '../prestashop';

/**
 * PrestaShop specific prices (Catalogue > Prix catalogue and the "Prix spécifiques" of a product)
 * turned into Vendure sales: the variant's price becomes the discounted price, and its regular
 * price is kept to be shown struck through until the end date.
 *
 * Only prices every visitor gets are migrated. Prices for a customer group, a customer, a
 * minimum quantity or another country have no equivalent and are reported; cart prices
 * (internal to PrestaShop) are ignored.
 */

export interface Sale {
  /** Discounted price with tax, in millimes. */
  price: number;
  /** Price with tax before the discount, in millimes. */
  regularPrice: number;
  endsAt: Date | null;
}

export type SpecificPriceStatus =
  | 'applies'
  | 'expired'
  | 'future'
  | 'cart'
  | 'customer-group'
  | 'customer'
  | 'quantity'
  | 'country';

/** Whether a specific price applies to every visitor today; the shop's country is Tunisia. */
export function specificPriceStatus(sp: PsSpecificPrice, now: Date): SpecificPriceStatus {
  if (sp.id_cart !== 0) {
    return 'cart';
  }
  if (sp.id_customer !== 0) {
    return 'customer';
  }
  if (sp.id_group !== 0) {
    return 'customer-group';
  }
  if (sp.from_quantity > 1) {
    return 'quantity';
  }
  if (sp.country_iso && sp.country_iso !== 'TN') {
    return 'country';
  }
  const from = prestaShopDate(sp.from);
  const to = prestaShopDate(sp.to);
  if (to && to < now) {
    return 'expired';
  }
  if (from && from > now) {
    return 'future';
  }
  return 'applies';
}

/**
 * The specific price PrestaShop would use for a product or one of its combinations: one for that
 * combination wins over one for the whole product, which wins over one for every product.
 */
export function pickSpecificPrice(
  applicable: PsSpecificPrice[],
  productId: number,
  attributeId: number,
): PsSpecificPrice | null {
  const score = (sp: PsSpecificPrice) =>
    (sp.id_product_attribute === attributeId && attributeId !== 0 ? 2 : 0) +
    (sp.id_product === productId ? 1 : 0);
  const candidates = applicable.filter(
    (sp) =>
      (sp.id_product === productId || sp.id_product === 0) &&
      (sp.id_product_attribute === attributeId || sp.id_product_attribute === 0),
  );
  return candidates.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Price of a product or combination with a specific price, as PrestaShop computes it:
 * a fixed price replaces the product price (the combination's impact is still added, unless the
 * fixed price is for that combination), then the reduction applies, as a percentage or as an
 * amount with or without tax. Null when the result is not lower than the regular price.
 */
export function saleOf(
  sp: PsSpecificPrice,
  args: { productPrice: number; impact: number; ratePercent: number },
): Sale | null {
  const withTax = (exclTax: number) => exclTax * (1 + args.ratePercent / 100);
  const regular = withTax(args.productPrice + args.impact);

  const fixed = Number(sp.price) >= 0;
  const base = fixed
    ? Number(sp.price) + (sp.id_product_attribute === 0 ? args.impact : 0)
    : args.productPrice + args.impact;
  const reduction = Number(sp.reduction);
  let price = withTax(base);
  if (sp.reduction_type === 'percentage') {
    price *= 1 - reduction;
  } else {
    price -= sp.reduction_tax === 1 ? reduction : withTax(reduction);
  }

  const sale = {
    price: Math.max(0, Math.round(price * 1000)),
    regularPrice: Math.round(regular * 1000),
    endsAt: prestaShopDate(sp.to),
  };
  return sale.price < sale.regularPrice ? sale : null;
}

/**
 * A PrestaShop DATETIME, kept as text: "0000-00-00 00:00:00" means no date, and the shop's clock
 * is Tunisia's (UTC+1, no daylight saving).
 */
export function prestaShopDate(value: string | null): Date | null {
  if (!value || value.startsWith('0000')) {
    return null;
  }
  const date = new Date(`${value.replace(' ', 'T')}+01:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
