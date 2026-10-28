import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { categoryPath } from '@karcher/seo';

import type {
  PrestaShopReader,
  PsCategory,
  PsMenuEntry,
  PsCombinationAttribute,
  PsImage,
  PsManufacturer,
  PsProduct,
} from '../prestashop';
import { codeOf, imageRelativePath, orNull, priceWithTaxMillimes, validEan } from '../util';
import { ok, type VendureAdmin } from '../vendure-admin';
import { FEATURED_SLUG, importFeaturedCollection } from './homepage';
import { quoteOnlyCategories, quoteOnlyProducts } from './quote-only';
import type { Report } from './report';
import { pickSpecificPrice, prestaShopDate, saleOf, specificPriceStatus, type Sale } from './sales';
import { menuLabels, productRedirects, replacedCategories, type Redirect } from './structure';

/** Where the original product images are: a copy of PrestaShop's img/p folder, or the live site. */
export type ImageSource = { dir: string } | { baseUrl: string };

export interface CatalogOptions {
  images: ImageSource;
  /** Import only the first N products (by PrestaShop id), for a trial run. */
  limit?: number;
  /** VAT rate when a product's tax rules group has no rule for Tunisia. */
  defaultTaxRate: number;
  /** Categories of the quote-only professional range; empty: the "Professionnel" tree. */
  quoteOnlyCategoryIds: number[];
  /** Categories (with their subcategories) taken out of that range, e.g. accessories. */
  quoteOnlyExcludedCategoryIds: number[];
}

/** What the catalog import created, for the steps that follow it. */
export interface CatalogResult {
  productIds: Map<number, string>;
}

const TAX_ZONE = 'Tunisie';

export async function importCatalog(
  ps: PrestaShopReader,
  admin: VendureAdmin,
  options: CatalogOptions,
  report: Report,
): Promise<CatalogResult> {
  const allProducts = await ps.products();
  const products = options.limit ? allProducts.slice(0, options.limit) : allProducts;
  const importedIds = new Set(products.map((p) => p.id_product));

  const taxRates = await ps.taxRates('TN');
  const rateOf = (product: PsProduct) => {
    const rate = taxRates.get(product.id_tax_rules_group);
    if (rate === undefined) {
      report.warn(
        `Product ${product.id_product}: no Tunisian VAT rule for tax group ${product.id_tax_rules_group}, using ${options.defaultTaxRate}%`,
      );
      return options.defaultTaxRate;
    }
    return rate;
  };
  const taxCategories = await ensureTaxCategories(
    admin,
    new Set(products.map((p) => taxRates.get(p.id_tax_rules_group) ?? options.defaultTaxRate)),
    report,
  );

  const features = (await ps.productFeatures()).filter((f) => importedIds.has(f.id_product));
  const facetValueIds = await ensureFacets(admin, features, report);
  const brandIds = await importBrands(admin, await ps.manufacturers(), report);

  const images = (await ps.images()).filter((i) => importedIds.has(i.id_product));
  const assetIds = await importImages(admin, images, options.images, report);

  const combinations = groupBy(
    (await ps.combinations()).filter((c) => importedIds.has(c.id_product)),
    (c) => c.id_product,
  );
  const stock = new Map(
    (await ps.stock()).map((s) => [
      `${s.id_product}:${s.id_product_attribute}`,
      Math.max(0, s.quantity),
    ]),
  );
  const featuresByProduct = groupBy(features, (f) => f.id_product);
  const imagesByProduct = groupBy(images, (i) => i.id_product);

  // Discounts every visitor gets today; the others have no equivalent and are reported.
  const now = new Date();
  const specificPrices = (await ps.specificPrices()).filter(
    (sp) => sp.id_product === 0 || importedIds.has(sp.id_product),
  );
  const applicable = specificPrices.filter((sp) => {
    const status = specificPriceStatus(sp, now);
    if (status === 'future') {
      report.warn(
        `Specific price ${sp.id_specific_price} (product ${sp.id_product}) starts on ${sp.from}: create the sale in Vendure then`,
      );
    } else if (status !== 'applies' && status !== 'cart') {
      report.count(`specific prices left out (${status})`);
    }
    return status === 'applies';
  });

  // The professional range is sold on quote only: no price or stock on the site, no sale.
  const allCategories = await ps.categories();
  const assignments = await ps.categoryProducts();
  const quoteOnly = quoteOnlyProducts(
    products,
    assignments,
    quoteOnlyCategories(
      allCategories,
      options.quoteOnlyCategoryIds,
      options.quoteOnlyExcludedCategoryIds,
    ),
  );
  report.count('quote-only products (professional range)', quoteOnly.size);

  const existing = await existingProducts(admin);
  const productIds = new Map<number, string>();
  for (const product of products) {
    const rate = rateOf(product);
    const productImages = (imagesByProduct.get(product.id_product) ?? [])
      .map((image) => ({ image, assetId: assetIds.get(image.id_image) }))
      .filter((entry): entry is { image: PsImage; assetId: string } => Boolean(entry.assetId));
    const cover = productImages.find((entry) => entry.image.cover === 1) ?? productImages[0];
    const input = {
      enabled: product.active === 1,
      featuredAssetId: cover?.assetId ?? null,
      assetIds: productImages.map((entry) => entry.assetId),
      facetValueIds: [
        ...(featuresByProduct.get(product.id_product) ?? []).flatMap((f) => {
          const id = facetValueIds.get(f.id_feature_value);
          return id ? [id] : [];
        }),
        ...(brandIds.has(product.id_manufacturer) ? [brandIds.get(product.id_manufacturer)!] : []),
      ],
      customFields: {
        legacyId: product.id_product,
        // Vendure makes slugs unique (-2); the URL keeps PrestaShop's.
        urlSlug: product.link_rewrite,
        ean13: validEan(product.ean13),
        urlCategory: product.category_slug,
        defaultCategoryId: product.id_category_default,
        addedAt: prestaShopDate(product.date_add)?.toISOString() ?? null,
        unitsSold: Number(product.units_sold),
        quoteOnly: quoteOnly.has(product.id_product),
      },
      translations: [
        {
          languageCode: 'fr',
          name: product.name,
          slug: product.link_rewrite,
          description: product.description ?? '',
          customFields: {
            metaTitle: orNull(product.meta_title),
            metaDescription: orNull(product.meta_description),
          },
        },
      ],
    };
    if (product.ean13 && !validEan(product.ean13)) {
      report.warn(
        `Product ${product.id_product}: EAN "${product.ean13}" is not an EAN-8/13, left out of the URL`,
      );
    }

    try {
      const found = existing.get(product.id_product);
      const saved = found
        ? await updateProduct(admin, found, input)
        : await createProduct(admin, input);
      const productId = saved.id;
      productIds.set(product.id_product, productId);
      if (saved.slug !== product.link_rewrite) {
        // Its URL keeps PrestaShop's slug (urlSlug); only the dashboard shows Vendure's.
        report.count('products sharing a slug with another (URL unchanged)');
      }
      await syncVariants(admin, {
        productId,
        product,
        combinations: combinations.get(product.id_product) ?? [],
        existingVariants: found?.variants ?? [],
        priceOf: (impact) => priceWithTaxMillimes(Number(product.price) + Number(impact), rate),
        quoteOnly: quoteOnly.has(product.id_product),
        saleOf: (attributeId, impact) => {
          if (quoteOnly.has(product.id_product)) {
            return null;
          }
          const sp = pickSpecificPrice(applicable, product.id_product, attributeId);
          return sp
            ? saleOf(sp, {
                productPrice: Number(product.price),
                impact: Number(impact),
                ratePercent: rate,
              })
            : null;
        },
        stockOf: (attributeId) => stock.get(`${product.id_product}:${attributeId}`) ?? 0,
        taxCategoryId: taxCategories.get(rate)!,
        report,
      });
      report.count(found ? 'products updated' : 'products created');
    } catch (error) {
      report.warn(`Product ${product.id_product} (${product.name}): ${(error as Error).message}`);
    }
  }

  const replaced = replacedCategories(allCategories, assignments);
  await importCategories(admin, {
    categories: allCategories,
    assignments,
    productIds,
    images: options.images,
    menu: await ps.menuEntries(),
    replaced,
    report,
  });
  // A "Coup de cœur" category (imported above) takes the place of the featured products module's.
  if (!allCategories.some((c) => c.active === 1 && c.link_rewrite === FEATURED_SLUG)) {
    await importFeaturedCollection(ps, admin, productIds, report);
  }
  await saveRedirects(
    admin,
    [
      ...[...replaced].flatMap(([id, toPath]) => {
        const category = allCategories.find((c) => c.id_category === id)!;
        return [{ fromPath: categoryPath({ id, slug: category.link_rewrite }), toPath }];
      }),
      ...productRedirects(options.limit ? products : allProducts, allCategories, replaced),
    ],
    report,
  );
  return { productIds };
}

/** One Vendure tax category per VAT rate in use ("TVA 19%"), with its rate in the Tunisia zone. */
async function ensureTaxCategories(
  admin: VendureAdmin,
  rates: Set<number>,
  report: Report,
): Promise<Map<number, string>> {
  const { zones } = await admin.gql<{ zones: { items: { id: string; name: string }[] } }>(
    `{ zones(options: { take: 100 }) { items { id name } } }`,
  );
  const zone = zones.items.find((z) => z.name === TAX_ZONE);
  if (!zone) {
    throw new Error(
      `Zone "${TAX_ZONE}" not found: run "pnpm --filter @karcher/server setup:channel" first`,
    );
  }
  const { taxCategories } = await admin.gql<{
    taxCategories: { items: { id: string; name: string }[] };
  }>(`{ taxCategories(options: { take: 100 }) { items { id name } } }`);
  const result = new Map<number, string>();
  for (const rate of rates) {
    const name = `TVA ${rate}%`;
    let id = taxCategories.items.find((c) => c.name === name)?.id;
    if (!id) {
      ({
        createTaxCategory: { id },
      } = await admin.gql<{ createTaxCategory: { id: string } }>(
        `mutation ($name: String!) { createTaxCategory(input: { name: $name }) { id } }`,
        { name },
      ));
      await admin.gql(
        `mutation ($name: String!, $value: Float!, $categoryId: ID!, $zoneId: ID!) {
          createTaxRate(input: { name: $name, value: $value, enabled: true, categoryId: $categoryId, zoneId: $zoneId }) { id }
        }`,
        { name, value: rate, categoryId: id, zoneId: zone.id },
      );
      report.count('tax categories created');
    }
    result.set(rate, id);
  }
  return result;
}

/** PrestaShop features become Vendure facets (filters on category pages, specifications on product pages). */
async function ensureFacets(
  admin: VendureAdmin,
  features: { id_feature: number; feature_name: string; id_feature_value: number; value: string }[],
  report: Report,
): Promise<Map<number, string>> {
  type Facet = { id: string; code: string; values: { id: string; code: string }[] };
  const facets = await admin.all<Facet>(
    `query ($skip: Int, $take: Int) { facets(options: { skip: $skip, take: $take }) { totalItems items { id code values { id code } } } }`,
    (data: { facets: { items: Facet[]; totalItems: number } }) => data.facets,
  );
  const result = new Map<number, string>();
  for (const [, values] of groupBy(features, (f) => f.id_feature)) {
    const name = values[0]!.feature_name;
    const code = codeOf(name);
    let facet = facets.find((f) => f.code === code);
    if (!facet) {
      ({ createFacet: facet } = await admin.gql<{ createFacet: Facet }>(
        `mutation ($input: CreateFacetInput!) { createFacet(input: $input) { id code values { id code } } }`,
        { input: { code, isPrivate: false, translations: [{ languageCode: 'fr', name }] } },
      ));
      facets.push(facet);
      report.count('facets created');
    }
    for (const value of uniqueBy(values, (v) => v.id_feature_value)) {
      const valueCode = codeOf(value.value);
      let id = facet.values.find((v) => v.code === valueCode)?.id;
      if (!id) {
        const { createFacetValues } = await admin.gql<{
          createFacetValues: { id: string; code: string }[];
        }>(
          `mutation ($input: [CreateFacetValueInput!]!) { createFacetValues(input: $input) { id code } }`,
          {
            input: [
              {
                facetId: facet.id,
                code: valueCode,
                translations: [{ languageCode: 'fr', name: value.value }],
              },
            ],
          },
        );
        id = createFacetValues[0]!.id;
        facet.values.push({ id, code: valueCode });
        report.count('facet values created');
      }
      result.set(value.id_feature_value, id);
    }
  }
  return result;
}

const BRAND_FACET = 'marque';

/**
 * Active PrestaShop manufacturers become values of the "marque" facet, keeping their id for the
 * brand pages (/{id}_{slug}) and their description and meta tags. Inactive ones are left out, so
 * their URLs answer 404 as on PrestaShop.
 */
async function importBrands(
  admin: VendureAdmin,
  manufacturers: PsManufacturer[],
  report: Report,
): Promise<Map<number, string>> {
  type Value = { id: string; customFields: { legacyManufacturerId: number | null } | null };
  type Facet = { id: string; values: Value[] };
  const active = manufacturers.filter((m) => m.active === 1);
  if (manufacturers.length > active.length) {
    report.count('inactive brands left out', manufacturers.length - active.length);
  }
  const result = new Map<number, string>();
  if (!active.length) {
    return result;
  }

  const fields = `id values { id customFields { legacyManufacturerId } }`;
  const { facets } = await admin.gql<{ facets: { items: Facet[] } }>(
    `query ($code: String!) { facets(options: { filter: { code: { eq: $code } } }) { items { ${fields} } } }`,
    { code: BRAND_FACET },
  );
  let facet = facets.items[0];
  if (!facet) {
    ({ createFacet: facet } = await admin.gql<{ createFacet: Facet }>(
      `mutation ($input: CreateFacetInput!) { createFacet(input: $input) { ${fields} } }`,
      {
        input: {
          code: BRAND_FACET,
          isPrivate: false,
          translations: [{ languageCode: 'fr', name: 'Marque' }],
        },
      },
    ));
    report.count('facets created');
  }

  for (const brand of active) {
    const translation = {
      languageCode: 'fr',
      name: brand.name,
      customFields: {
        description: orNull(brand.description),
        metaTitle: orNull(brand.meta_title),
        metaDescription: orNull(brand.meta_description),
      },
    };
    const found = facet.values.find(
      (v) => v.customFields?.legacyManufacturerId === brand.id_manufacturer,
    );
    if (found) {
      await admin.gql(
        `mutation ($input: [UpdateFacetValueInput!]!) { updateFacetValues(input: $input) { id } }`,
        { input: [{ id: found.id, translations: [translation] }] },
      );
      result.set(brand.id_manufacturer, found.id);
      report.count('brands updated');
      continue;
    }
    const { createFacetValues } = await admin.gql<{ createFacetValues: { id: string }[] }>(
      `mutation ($input: [CreateFacetValueInput!]!) { createFacetValues(input: $input) { id } }`,
      {
        input: [
          {
            facetId: facet.id,
            code: `${codeOf(brand.name)}-${brand.id_manufacturer}`,
            customFields: { legacyManufacturerId: brand.id_manufacturer },
            translations: [translation],
          },
        ],
      },
    );
    result.set(brand.id_manufacturer, createFacetValues[0]!.id);
    report.count('brands created');
  }
  return result;
}

/**
 * Uploads each original image once; assets keep the PrestaShop image id for the old image URLs
 * and its legend as alt text (kept in step on every run).
 */
async function importImages(
  admin: VendureAdmin,
  images: PsImage[],
  source: ImageSource,
  report: Report,
): Promise<Map<number, string>> {
  type Asset = {
    id: string;
    customFields: { legacyImageId: number | null; alt: string | null } | null;
  };
  const existing = await admin.all<Asset>(
    `query ($skip: Int, $take: Int) { assets(options: { skip: $skip, take: $take }) { totalItems items { id customFields { legacyImageId alt } } } }`,
    (data: { assets: { items: Asset[]; totalItems: number } }) => data.assets,
  );
  const result = new Map<number, string>();
  const altOf = new Map<string, string | null>();
  for (const asset of existing) {
    if (asset.customFields?.legacyImageId != null) {
      result.set(asset.customFields.legacyImageId, asset.id);
      altOf.set(asset.id, asset.customFields.alt);
    }
  }
  for (const [index, image] of images.entries()) {
    if (index > 0 && index % 100 === 0) {
      console.log(`  images: ${index} / ${images.length}`);
    }
    const alt = orNull(image.legend);
    const assetId = result.get(image.id_image);
    if (assetId) {
      if ((altOf.get(assetId) ?? null) !== alt) {
        await admin.gql(
          `mutation ($input: UpdateAssetInput!) { updateAsset(input: $input) { id } }`,
          { input: { id: assetId, customFields: { alt } } },
        );
        report.count('image alt texts updated');
      }
      report.count('images already imported');
      continue;
    }
    const file = await readImage(source, image.id_image);
    if (!file) {
      report.warn(`Image ${image.id_image} (product ${image.id_product}): original not found`);
      continue;
    }
    try {
      result.set(
        image.id_image,
        await admin.uploadAsset(file, `${image.product_slug}.jpg`, {
          legacyImageId: image.id_image,
          alt,
        }),
      );
      report.count('images uploaded');
    } catch (error) {
      report.warn((error as Error).message);
    }
  }
  return result;
}

async function readImage(source: ImageSource, imageId: number): Promise<Uint8Array | null> {
  return readImageFile(source, imageRelativePath(imageId));
}

/** A file under the image source; "../c/12.jpg" reaches PrestaShop's category images next to img/p. */
async function readImageFile(source: ImageSource, relative: string): Promise<Uint8Array | null> {
  if ('dir' in source) {
    return readFile(path.join(source.dir, relative)).catch(() => null);
  }
  const url = new URL(relative, `${source.baseUrl.replace(/\/$/, '')}/`);
  // Thousands of downloads from the live shop: a stalled one is abandoned, a failed one retried.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (response.status === 404) {
        return null;
      }
      if (response.ok) {
        return new Uint8Array(await response.arrayBuffer());
      }
    } catch {
      // Network error or timeout: try again.
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }
  return null;
}

interface ExistingProduct {
  id: string;
  variants: { id: string; sku: string }[];
}

async function existingProducts(admin: VendureAdmin): Promise<Map<number, ExistingProduct>> {
  type Row = ExistingProduct & { customFields: { legacyId: number | null } | null };
  const rows = await admin.all<Row>(
    `query ($skip: Int, $take: Int) {
      products(options: { skip: $skip, take: $take }) {
        totalItems items { id customFields { legacyId } variants { id sku } }
      }
    }`,
    (data: { products: { items: Row[]; totalItems: number } }) => data.products,
  );
  return new Map(
    rows.flatMap((row) =>
      row.customFields?.legacyId != null ? [[row.customFields.legacyId, row]] : [],
    ),
  );
}

/** Vendure appends -2, -3... to a slug another product already has; returns the slug it kept. */
async function createProduct(
  admin: VendureAdmin,
  input: object,
): Promise<{ id: string; slug: string }> {
  const { createProduct } = await admin.gql<{ createProduct: { id: string; slug: string } }>(
    `mutation ($input: CreateProductInput!) { createProduct(input: $input) { id slug } }`,
    { input },
  );
  return createProduct;
}

async function updateProduct(
  admin: VendureAdmin,
  found: ExistingProduct,
  input: object,
): Promise<{ id: string; slug: string }> {
  const { updateProduct } = await admin.gql<{ updateProduct: { id: string; slug: string } }>(
    `mutation ($input: UpdateProductInput!) { updateProduct(input: $input) { id slug } }`,
    { input: { ...input, id: found.id } },
  );
  return updateProduct;
}

/**
 * A product without combinations gets one variant; one with combinations gets an option group per
 * attribute group (Version, Couleur...) and a variant per combination. On a re-run, variants are
 * matched by SKU and their price, stock and tax category refreshed.
 */
async function syncVariants(
  admin: VendureAdmin,
  args: {
    productId: string;
    product: PsProduct;
    combinations: PsCombinationAttribute[];
    existingVariants: { id: string; sku: string }[];
    priceOf: (impactExclTax: string | number) => number;
    saleOf: (productAttributeId: number, impactExclTax: string | number) => Sale | null;
    /** Quote-only variants do not track inventory, so no stock shows through the search. */
    quoteOnly: boolean;
    stockOf: (productAttributeId: number) => number;
    taxCategoryId: string;
    report: Report;
  },
): Promise<void> {
  const { product, combinations } = args;
  // On sale: the sale price, and the regular price kept to be struck through. Otherwise any
  // earlier sale is cleared.
  const priced = (price: number, sale: Sale | null) => {
    if (sale) {
      args.report.count('variants on sale');
    }
    return {
      price: sale?.price ?? price,
      trackInventory: args.quoteOnly ? 'FALSE' : 'INHERIT',
      customFields: {
        regularPrice: sale?.regularPrice ?? null,
        saleEndsAt: sale?.endsAt?.toISOString() ?? null,
      },
    };
  };
  const wanted = combinations.length
    ? [...groupBy(combinations, (c) => c.id_product_attribute)].map(
        ([attributeId, attributes]) => ({
          attributeId,
          sku: orNull(attributes[0]!.reference) ?? `PS-${product.id_product}-${attributeId}`,
          name: `${product.name} ${attributes.map((a) => a.attribute_name).join(' ')}`,
          ...priced(
            args.priceOf(attributes[0]!.price),
            args.saleOf(attributeId, attributes[0]!.price),
          ),
          stockOnHand: args.stockOf(attributeId),
          attributes,
        }),
      )
    : [
        {
          attributeId: 0,
          sku: orNull(product.reference) ?? `PS-${product.id_product}`,
          name: product.name,
          ...priced(args.priceOf(0), args.saleOf(0, 0)),
          stockOnHand: args.stockOf(0),
          attributes: [] as PsCombinationAttribute[],
        },
      ];

  if (args.existingVariants.length > 0) {
    const updates = wanted.flatMap((variant) => {
      const match =
        args.existingVariants.find((v) => v.sku === variant.sku) ??
        (wanted.length === 1 && args.existingVariants.length === 1
          ? args.existingVariants[0]
          : undefined);
      if (!match) {
        args.report.warn(
          `Product ${product.id_product}: variant ${variant.sku} not found in Vendure, not updated`,
        );
        return [];
      }
      return [
        {
          id: match.id,
          sku: variant.sku,
          price: variant.price,
          trackInventory: variant.trackInventory,
          customFields: variant.customFields,
          stockOnHand: variant.stockOnHand,
          taxCategoryId: args.taxCategoryId,
        },
      ];
    });
    if (updates.length) {
      await admin.gql(
        `mutation ($input: [UpdateProductVariantInput!]!) { updateProductVariants(input: $input) { id } }`,
        { input: updates },
      );
    }
    return;
  }

  const optionIds = new Map<number, string>();
  for (const [groupId, rows] of groupBy(combinations, (c) => c.id_attribute_group)) {
    const options = uniqueBy(rows, (r) => r.id_attribute).sort(
      (a, b) => a.attribute_position - b.attribute_position,
    );
    const { createProductOptionGroup } = await admin.gql<{
      createProductOptionGroup: { id: string; options: { id: string; code: string }[] };
    }>(
      `mutation ($input: CreateProductOptionGroupInput!) {
        createProductOptionGroup(input: $input) { id options { id code } }
      }`,
      {
        input: {
          code: codeOf(rows[0]!.group_name),
          translations: [{ languageCode: 'fr', name: rows[0]!.group_name }],
          options: options.map((o) => ({
            code: `${codeOf(o.attribute_name)}-${o.id_attribute}`,
            translations: [{ languageCode: 'fr', name: o.attribute_name }],
          })),
        },
      },
    );
    ok(
      (
        await admin.gql<{ addOptionGroupToProduct: { __typename: string; message?: string } }>(
          `mutation ($productId: ID!, $groupId: ID!) {
            addOptionGroupToProduct(productId: $productId, optionGroupId: $groupId) { __typename }
          }`,
          { productId: args.productId, groupId: createProductOptionGroup.id },
        )
      ).addOptionGroupToProduct,
      `option group ${groupId}`,
    );
    for (const option of options) {
      const created = createProductOptionGroup.options.find(
        (o) => o.code === `${codeOf(option.attribute_name)}-${option.id_attribute}`,
      );
      optionIds.set(option.id_attribute, created!.id);
    }
  }

  await admin.gql(
    `mutation ($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { id } }`,
    {
      input: wanted.map((variant) => ({
        productId: args.productId,
        sku: variant.sku,
        price: variant.price,
        trackInventory: variant.trackInventory,
        customFields: variant.customFields,
        stockOnHand: variant.stockOnHand,
        taxCategoryId: args.taxCategoryId,
        optionIds: variant.attributes.map((a) => optionIds.get(a.id_attribute)!),
        translations: [{ languageCode: 'fr', name: variant.name }],
      })),
    },
  );
}

/**
 * Categories become collections listing exactly the products assigned to them in PrestaShop
 * (product-id filter, not inherited from subcategories, as PrestaShop shows them).
 * Inactive categories are left out; their URLs fall back to the legacy redirects table, as do
 * those replaced by an automatic page (Promotions). The main menu's labels become menu labels,
 * and categories absent from it (selections such as Coup de cœur) are hidden from the menu.
 */
async function importCategories(
  admin: VendureAdmin,
  {
    categories,
    assignments,
    productIds,
    images,
    menu,
    replaced,
    report,
  }: {
    categories: PsCategory[];
    assignments: { id_category: number; id_product: number }[];
    productIds: Map<number, string>;
    images: ImageSource;
    menu: PsMenuEntry[];
    replaced: Map<number, string>;
    report: Report;
  },
): Promise<void> {
  const labels = menuLabels(menu);
  type Row = {
    id: string;
    slug: string;
    featuredAsset: { id: string } | null;
    customFields: { legacyId: number | null } | null;
  };
  const rows = await admin.all<Row>(
    `query ($skip: Int, $take: Int) { collections(options: { skip: $skip, take: $take }) { totalItems items { id slug featuredAsset { id } customFields { legacyId } } } }`,
    (data: { collections: { items: Row[]; totalItems: number } }) => data.collections,
  );
  const existing = new Map(
    rows.flatMap((row) =>
      row.customFields?.legacyId != null ? [[row.customFields.legacyId, row]] : [],
    ),
  );
  // The "Coup de cœur" collection an earlier run built from the featured products module becomes
  // the PrestaShop category of that name, instead of a second one at /coup-de-coeur-2.
  const featured = rows.find(
    (row) => row.slug === FEATURED_SLUG && row.customFields?.legacyId == null,
  );
  const productsOf = groupBy(assignments, (a) => a.id_category);
  const collectionIds = new Map<number, string>();

  const categoryImage = async (category: PsCategory): Promise<string | undefined> => {
    const file = await readImageFile(images, `../c/${category.id_category}.jpg`);
    if (!file) {
      return undefined;
    }
    try {
      const id = await admin.uploadAsset(file, `${category.link_rewrite}.jpg`);
      report.count('category images uploaded');
      return id;
    } catch (error) {
      report.warn(`Category ${category.id_category} image: ${(error as Error).message}`);
      return undefined;
    }
  };

  // Parents first: categories come ordered by depth, then position.
  for (const category of categories) {
    if (category.active !== 1) {
      report.warn(
        `Category ${category.id_category} (${category.name}) is inactive and was not imported`,
      );
      continue;
    }
    if (replaced.has(category.id_category)) {
      report.count(`categories replaced by ${replaced.get(category.id_category)}`);
      continue;
    }
    // Without the menu module, every category stays in the menu.
    const label = labels.get(category.id_category);
    const hideFromMenu = labels.size > 0 && label === undefined;
    if (hideFromMenu) {
      report.count("categories hidden from the menu (not in PrestaShop's)");
    }
    const ids = (productsOf.get(category.id_category) ?? []).flatMap((a) => {
      const id = productIds.get(a.id_product);
      return id ? [id] : [];
    });
    const input = {
      isPrivate: false,
      inheritFilters: false,
      customFields: {
        legacyId: category.id_category,
        urlSlug: category.link_rewrite,
        hideFromMenu,
      },
      filters: ids.length
        ? [
            {
              code: 'product-id-filter',
              arguments: [
                { name: 'productIds', value: JSON.stringify(ids) },
                { name: 'combineWithAnd', value: 'true' },
              ],
            },
          ]
        : [],
      translations: [
        {
          languageCode: 'fr',
          name: category.name,
          slug: category.link_rewrite,
          description: category.description ?? '',
          customFields: {
            metaTitle: orNull(category.meta_title),
            metaDescription: orNull(category.meta_description),
            menuLabel: label && label !== category.name ? label : null,
          },
        },
      ],
    };
    try {
      const found =
        existing.get(category.id_category) ??
        (category.link_rewrite === FEATURED_SLUG ? featured : undefined);
      // The category image (img/c/{id}.jpg) is uploaded once; later runs keep the asset.
      const imageAssetId = found?.featuredAsset ? undefined : await categoryImage(category);
      const withImage = imageAssetId
        ? { ...input, featuredAssetId: imageAssetId, assetIds: [imageAssetId] }
        : input;
      if (found) {
        await admin.gql(
          `mutation ($input: UpdateCollectionInput!) { updateCollection(input: $input) { id } }`,
          { input: { ...withImage, id: found.id } },
        );
        collectionIds.set(category.id_category, found.id);
        report.count('categories updated');
      } else {
        const { createCollection } = await admin.gql<{ createCollection: { id: string } }>(
          `mutation ($input: CreateCollectionInput!) { createCollection(input: $input) { id } }`,
          { input: { ...withImage, parentId: collectionIds.get(category.id_parent) } },
        );
        collectionIds.set(category.id_category, createCollection.id);
        report.count('categories created');
      }
    } catch (error) {
      report.warn(
        `Category ${category.id_category} (${category.name}): ${(error as Error).message}`,
      );
    }
  }
}

/** Old URLs that lead elsewhere now, in Vendure's legacy redirects table (editable in the dashboard). */
async function saveRedirects(admin: VendureAdmin, redirects: Redirect[], report: Report) {
  for (const redirect of redirects) {
    await admin.gql(
      `mutation ($input: LegacyRedirectInput!) { upsertLegacyRedirect(input: $input) { id } }`,
      { input: { ...redirect, statusCode: 301 } },
    );
  }
  report.count('redirects saved', redirects.length);
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

function uniqueBy<T, K>(items: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => !seen.has(key(item)) && (seen.add(key(item)), true));
}
