import { describe, expect, it } from 'vitest';

import { brandPath, categoryPath, cmsPath, imagePath, parseLegacyPath, productPath, slugify } from './legacy-urls';

// Real paths taken from karcher-gei.tn's sitemap and pages (October 2026).
describe('parseLegacyPath', () => {
  it('parses a product URL with an EAN-13 suffix', () => {
    expect(
      parseLegacyPath('/home-garden/1-k2-classic-nettoyeur-haute-pression-4054278249025.html'),
    ).toEqual({
      kind: 'product',
      category: 'home-garden',
      productId: 1,
      productAttributeId: null,
      slug: 'k2-classic-nettoyeur-haute-pression',
      ean13: '4054278249025',
    });
  });

  it('parses a product URL without EAN', () => {
    expect(parseLegacyPath('/home-garden/867-aspirateur-laveur-fcv-3.html')).toEqual({
      kind: 'product',
      category: 'home-garden',
      productId: 867,
      productAttributeId: null,
      slug: 'aspirateur-laveur-fcv-3',
      ean13: null,
    });
  });

  it('keeps digits that end a slug when they are not an EAN', () => {
    const route = parseLegacyPath('/home-garden/817-fc7-nettoyeur-de-sols-sans-fil-blanc.html');
    expect(route).toMatchObject({ productId: 817, slug: 'fc7-nettoyeur-de-sols-sans-fil-blanc' });
  });

  it('parses a combination id', () => {
    expect(parseLegacyPath('/home-garden/12-34-k4-power-control.html')).toMatchObject({
      productId: 12,
      productAttributeId: 34,
      slug: 'k4-power-control',
    });
  });

  it('parses a product without a category segment', () => {
    expect(parseLegacyPath('/867-aspirateur-laveur-fcv-3.html')).toMatchObject({
      kind: 'product',
      category: null,
      productId: 867,
    });
  });

  it('parses categories, CMS pages and images', () => {
    expect(parseLegacyPath('/12-home-garden')).toEqual({ kind: 'category', categoryId: 12, slug: 'home-garden' });
    expect(parseLegacyPath('/content/62-devenir-revendeur')).toEqual({
      kind: 'cms',
      cmsId: 62,
      slug: 'devenir-revendeur',
    });
    expect(parseLegacyPath('/2292-home_default/aspirateur-laveur-fcv-3.jpg')).toEqual({
      kind: 'image',
      imageId: 2292,
      size: 'home_default',
      slug: 'aspirateur-laveur-fcv-3',
      ext: 'jpg',
    });
  });

  it('parses brand and supplier URLs', () => {
    expect(parseLegacyPath('/2_karcher')).toEqual({ kind: 'brand', brandId: 2, slug: 'karcher' });
    expect(parseLegacyPath('/3__karcher-france')).toEqual({ kind: 'supplier' });
    expect(parseLegacyPath('/fournisseur')).toEqual({ kind: 'supplier' });
    expect(parseLegacyPath('/2_')).toBeNull();
  });

  it('parses the fixed pages', () => {
    expect(parseLegacyPath('/promotions')).toEqual({ kind: 'static', page: 'prices-drop' });
    expect(parseLegacyPath('/nous-contacter')).toEqual({ kind: 'static', page: 'contact' });
  });

  it('is case-insensitive like PrestaShop', () => {
    expect(parseLegacyPath('/12-Home-Garden')).toMatchObject({ kind: 'category', categoryId: 12 });
  });

  it('returns null for anything else', () => {
    expect(parseLegacyPath('/')).toBeNull();
    expect(parseLegacyPath('/panier')).toBeNull();
    expect(parseLegacyPath('/home-garden/aspirateur.html')).toBeNull();
    expect(parseLegacyPath('/admin-cms')).toBeNull();
  });
});

describe('path builders', () => {
  it('round-trips every page type', () => {
    const paths = [
      productPath({ id: 1, slug: 'k2-classic-nettoyeur-haute-pression', category: 'home-garden', ean13: '4054278249025' }),
      productPath({ id: 867, slug: 'aspirateur-laveur-fcv-3', category: 'home-garden' }),
      categoryPath({ id: 12, slug: 'home-garden' }),
      brandPath({ id: 2, slug: 'karcher' }),
      cmsPath({ id: 62, slug: 'devenir-revendeur' }),
      imagePath({ imageId: 2292, size: 'home_default', slug: 'aspirateur-laveur-fcv-3' }),
    ];
    expect(paths).toEqual([
      '/home-garden/1-k2-classic-nettoyeur-haute-pression-4054278249025.html',
      '/home-garden/867-aspirateur-laveur-fcv-3.html',
      '/12-home-garden',
      '/2_karcher',
      '/content/62-devenir-revendeur',
      '/2292-home_default/aspirateur-laveur-fcv-3.jpg',
    ]);
    for (const path of paths) {
      expect(parseLegacyPath(path)).not.toBeNull();
    }
  });

  it('slugifies French names like PrestaShop', () => {
    expect(slugify('Nettoyeur haute pression K 2 Compact')).toBe('nettoyeur-haute-pression-k-2-compact');
    expect(slugify('Détergents & accessoires')).toBe('detergents-accessoires');
  });
});
