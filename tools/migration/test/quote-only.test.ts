import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { PsCategory } from '../src/prestashop';
import { quoteOnlyCategories, quoteOnlyProducts } from '../src/import/quote-only';

function category(id: number, parent: number, depth: number, name: string): PsCategory {
  return {
    id_category: id,
    id_parent: parent,
    level_depth: depth,
    active: 1,
    position: 0,
    name,
    link_rewrite: name.toLowerCase(),
    description: null,
    meta_title: null,
    meta_description: null,
  };
}

const categories = [
  category(12, 2, 2, 'Maison et jardin'),
  category(15, 2, 2, 'Professionnel'),
  category(13, 12, 3, 'Nettoyeurs haute pression'),
  category(20, 15, 3, 'Balayeuses'),
  category(21, 20, 4, 'Balayeuses autoportées'),
];

describe('quoteOnlyCategories', () => {
  it('takes the "Professionnel" tree', () => {
    assert.deepEqual([...quoteOnlyCategories(categories, [])].sort(), [15, 20, 21]);
  });

  it('uses the configured categories instead', () => {
    assert.deepEqual([...quoteOnlyCategories(categories, [12])].sort(), [12, 13]);
  });

  it('takes out excluded categories with their subcategories', () => {
    assert.deepEqual([...quoteOnlyCategories(categories, [], [20])].sort(), [15]);
  });
});

describe('quoteOnlyProducts', () => {
  it('flags products by default category or by any listing', () => {
    const products = [
      { id_product: 1, id_category_default: 13 },
      { id_product: 2, id_category_default: 21 },
      { id_product: 3, id_category_default: 13 },
    ];
    const assignments = [{ id_category: 20, id_product: 3 }];
    assert.deepEqual(
      [...quoteOnlyProducts(products, assignments, new Set([15, 20, 21]))].sort(),
      [2, 3],
    );
  });
});
