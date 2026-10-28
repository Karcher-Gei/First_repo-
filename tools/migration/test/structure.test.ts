import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { PsCategory, PsMenuEntry, PsProduct } from '../src/prestashop';
import { menuLabels, productRedirects, replacedCategories } from '../src/import/structure';

function category(id: number, slug: string, active = 1): PsCategory {
  return {
    id_category: id,
    id_parent: 2,
    level_depth: 2,
    active,
    position: 0,
    name: slug,
    link_rewrite: slug,
    description: null,
    meta_title: null,
    meta_description: null,
  };
}

function product(id: number, overrides: Partial<PsProduct> = {}): PsProduct {
  return {
    id_product: id,
    id_tax_rules_group: 1,
    reference: '',
    ean13: '',
    price: '100',
    active: 0,
    id_category_default: 13,
    id_manufacturer: 0,
    date_add: null,
    units_sold: 0,
    redirect_type: '301-category',
    id_type_redirected: 0,
    category_slug: 'nettoyeurs-haute-pression',
    name: `Produit ${id}`,
    link_rewrite: `produit-${id}`,
    description: null,
    meta_title: null,
    meta_description: null,
    ...overrides,
  };
}

const categories = [
  category(13, 'nettoyeurs-haute-pression'),
  category(14, 'ancienne-gamme', 0),
  category(37, 'promotions'),
  category(38, 'bestsellers'),
  category(42, 'bestsellers'),
];

describe('menuLabels', () => {
  it('keeps the active category entries, trimmed, first one wins', () => {
    const entry = (
      id: number,
      type: string,
      value: string,
      title: string,
      active = 1,
    ): PsMenuEntry => ({
      id_novmegamenu: id,
      id_parent: 1,
      type,
      value,
      active,
      title,
    });
    const labels = menuLabels([
      entry(1, 'category', '12', ' HOME & GARDEN '),
      entry(2, 'category', '12', 'Doublon'),
      entry(3, 'url', '', 'Accueil'),
      entry(4, 'cms', '62', 'DEVENIR REVENDEUR'),
      entry(5, 'category', '13', 'Inactif', 0),
    ]);
    assert.deepEqual([...labels], [[12, 'HOME & GARDEN']]);
  });
});

describe('replacedCategories', () => {
  it('sends Promotions to /promotions and an empty Bestsellers to /meilleures-ventes', () => {
    const replaced = replacedCategories(categories, [{ id_category: 38 }]);
    assert.deepEqual(
      [...replaced],
      [
        [37, '/promotions'],
        [42, '/meilleures-ventes'],
      ],
    );
  });
});

describe('productRedirects', () => {
  const replaced = new Map([[37, '/promotions']]);

  it('sends an inactive product to its default category', () => {
    assert.deepEqual(productRedirects([product(103)], categories, replaced), [
      {
        fromPath: '/nettoyeurs-haute-pression/103-produit-103.html',
        toPath: '/13-nettoyeurs-haute-pression',
      },
    ]);
  });

  it('follows the chosen target, a replaced category or another product', () => {
    const redirects = productRedirects(
      [
        product(1, { redirect_type: '302-category', id_type_redirected: 37 }),
        product(2, { redirect_type: '301-product', id_type_redirected: 3 }),
        product(3, { active: 1, ean13: '4054278634537' }),
      ],
      categories,
      replaced,
    );
    assert.deepEqual(
      redirects.map((r) => r.toPath),
      ['/promotions', '/nettoyeurs-haute-pression/3-produit-3-4054278634537.html'],
    );
  });

  it('leaves out active products, 404s and targets that are gone', () => {
    const redirects = productRedirects(
      [
        product(1, { active: 1 }),
        product(2, { redirect_type: '404' }),
        product(3, { id_type_redirected: 14 }),
        product(4, { redirect_type: '301-product', id_type_redirected: 99 }),
      ],
      categories,
      replaced,
    );
    assert.deepEqual(redirects, []);
  });
});
