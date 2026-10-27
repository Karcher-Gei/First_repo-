import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { PsSpecificPrice } from '../src/prestashop';
import {
  pickSpecificPrice,
  prestaShopDate,
  saleOf,
  specificPriceStatus,
} from '../src/import/sales';

const NO_DATE = '0000-00-00 00:00:00';

function sp(overrides: Partial<PsSpecificPrice>): PsSpecificPrice {
  return {
    id_specific_price: 1,
    id_cart: 0,
    id_product: 867,
    id_product_attribute: 0,
    id_customer: 0,
    id_group: 0,
    country_iso: null,
    from_quantity: 1,
    price: '-1.000000',
    reduction: '0.000000',
    reduction_tax: 1,
    reduction_type: 'percentage',
    from: NO_DATE,
    to: NO_DATE,
    ...overrides,
  };
}

const now = new Date('2026-10-27T12:00:00Z');

describe('specificPriceStatus', () => {
  it('keeps prices for every visitor, today, in Tunisia', () => {
    assert.equal(specificPriceStatus(sp({}), now), 'applies');
    assert.equal(specificPriceStatus(sp({ country_iso: 'TN' }), now), 'applies');
    assert.equal(
      specificPriceStatus(sp({ from: '2026-10-01 00:00:00', to: '2026-11-01 00:00:00' }), now),
      'applies',
    );
  });

  it('reports the prices with no equivalent', () => {
    assert.equal(specificPriceStatus(sp({ id_cart: 55 }), now), 'cart');
    assert.equal(specificPriceStatus(sp({ id_customer: 3 }), now), 'customer');
    assert.equal(specificPriceStatus(sp({ id_group: 4 }), now), 'customer-group');
    assert.equal(specificPriceStatus(sp({ from_quantity: 10 }), now), 'quantity');
    assert.equal(specificPriceStatus(sp({ country_iso: 'FR' }), now), 'country');
    assert.equal(specificPriceStatus(sp({ to: '2020-02-01 00:00:00' }), now), 'expired');
    assert.equal(specificPriceStatus(sp({ from: '2099-01-01 00:00:00' }), now), 'future');
  });
});

describe('pickSpecificPrice', () => {
  const forProduct = sp({ id_specific_price: 1 });
  const forCombination = sp({ id_specific_price: 2, id_product_attribute: 12 });
  const forEveryProduct = sp({ id_specific_price: 3, id_product: 0 });

  it('prefers the most specific price, as PrestaShop does', () => {
    const all = [forEveryProduct, forProduct, forCombination];
    assert.equal(pickSpecificPrice(all, 867, 12)?.id_specific_price, 2);
    assert.equal(pickSpecificPrice(all, 867, 11)?.id_specific_price, 1);
    assert.equal(pickSpecificPrice(all, 101, 0)?.id_specific_price, 3);
    assert.equal(pickSpecificPrice([forCombination], 867, 11), null);
  });
});

describe('saleOf', () => {
  // 1296.218487 excl. VAT at 19% = 1542.500 DT
  const fc3 = { productPrice: 1296.218487, impact: 0, ratePercent: 19 };

  it('applies a percentage', () => {
    assert.deepEqual(saleOf(sp({ reduction: '0.150000' }), fc3), {
      price: 1311125,
      regularPrice: 1542500,
      endsAt: null,
    });
  });

  it('applies an amount with or without tax', () => {
    const withTax = sp({ reduction: '50.000000', reduction_type: 'amount', reduction_tax: 1 });
    assert.equal(saleOf(withTax, fc3)?.price, 1492500);
    const exclTax = sp({ reduction: '50.000000', reduction_type: 'amount', reduction_tax: 0 });
    assert.equal(saleOf(exclTax, fc3)?.price, 1483000);
  });

  it('replaces the price with a fixed price, adding the combination impact', () => {
    const fixed = sp({ price: '1000.000000' });
    assert.equal(saleOf(fixed, { ...fc3, impact: 100 })?.price, 1309000);
    const fixedForCombination = sp({ price: '1000.000000', id_product_attribute: 12 });
    assert.equal(saleOf(fixedForCombination, { ...fc3, impact: 100 })?.price, 1190000);
  });

  it('ignores a "discount" that does not lower the price', () => {
    assert.equal(saleOf(sp({ price: '2000.000000' }), fc3), null);
  });

  it('keeps the end date', () => {
    const sale = saleOf(sp({ reduction: '0.1', to: '2026-12-31 23:59:59' }), fc3);
    assert.equal(sale?.endsAt?.toISOString(), '2026-12-31T22:59:59.000Z');
  });
});

describe('prestaShopDate', () => {
  it('reads empty dates as none and others in Tunisia time', () => {
    assert.equal(prestaShopDate(NO_DATE), null);
    assert.equal(prestaShopDate(null), null);
    assert.equal(prestaShopDate('2023-04-01 10:00:00')?.toISOString(), '2023-04-01T09:00:00.000Z');
  });
});
