import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  PrestaShopReader,
  PsCategory,
  PsCombinationAttribute,
  PsImage,
  PsProduct,
} from '../prestashop';
import { codeOf, imageRelativePath, orNull, priceWithTaxMillimes, validEan } from '../util';
import { ok, type VendureAdmin } from '../vendure-admin';
import type { Report } from './report';

/** Where the original product images are: a copy of PrestaShop's img/p folder, or the live site. */
export type ImageSource = { dir: string } | { baseUrl: string };

export interface CatalogOptions {
  images: ImageSource;
  /** Import only the first N products (by PrestaShop id), for a trial run. */
  limit?: number;
  /** VAT rate when a product's tax rules group has no rule for Tunisia. */
  defaultTaxRate: number;
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
      facetValueIds: (featuresByProduct.get(product.id_product) ?? []).flatMap((f) => {
        const id = facetValueIds.get(f.id_feature_value);
        return id ? [id] : [];
      }),
      customFields: {
        legacyId: product.id_product,
        ean13: validEan(product.ean13),
        urlCategory: product.category_slug,
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
        // The old URL still works (the storefront redirects it), but it is no longer the canonical one.
        report.warn(
          `Product ${product.id_product}: slug "${product.link_rewrite}" is used by another product, Vendure made it "${saved.slug}"`,
        );
      }
      await syncVariants(admin, {
        productId,
        product,
        combinations: combinations.get(product.id_product) ?? [],
        existingVariants: found?.variants ?? [],
        priceOf: (impact) => priceWithTaxMillimes(Number(product.price) + Number(impact), rate),
        stockOf: (attributeId) => stock.get(`${product.id_product}:${attributeId}`) ?? 0,
        taxCategoryId: taxCategories.get(rate)!,
        report,
      });
      report.count(found ? 'products updated' : 'products created');
    } catch (error) {
      report.warn(`Product ${product.id_product} (${product.name}): ${(error as Error).message}`);
    }
  }

  await importCategories(
    admin,
    await ps.categories(),
    await ps.categoryProducts(),
    productIds,
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

/** Uploads each original image once; assets keep the PrestaShop image id for the old image URLs. */
async function importImages(
  admin: VendureAdmin,
  images: PsImage[],
  source: ImageSource,
  report: Report,
): Promise<Map<number, string>> {
  type Asset = { id: string; customFields: { legacyImageId: number | null } | null };
  const existing = await admin.all<Asset>(
    `query ($skip: Int, $take: Int) { assets(options: { skip: $skip, take: $take }) { totalItems items { id customFields { legacyImageId } } } }`,
    (data: { assets: { items: Asset[]; totalItems: number } }) => data.assets,
  );
  const result = new Map<number, string>();
  for (const asset of existing) {
    if (asset.customFields?.legacyImageId != null) {
      result.set(asset.customFields.legacyImageId, asset.id);
    }
  }
  for (const image of images) {
    if (result.has(image.id_image)) {
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
        await admin.uploadAsset(file, `${image.product_slug}.jpg`, image.id_image),
      );
      report.count('images uploaded');
    } catch (error) {
      report.warn((error as Error).message);
    }
  }
  return result;
}

async function readImage(source: ImageSource, imageId: number): Promise<Uint8Array | null> {
  const relative = imageRelativePath(imageId);
  if ('dir' in source) {
    return readFile(path.join(source.dir, relative)).catch(() => null);
  }
  const response = await fetch(`${source.baseUrl.replace(/\/$/, '')}/${relative}`).catch(
    () => null,
  );
  return response?.ok ? new Uint8Array(await response.arrayBuffer()) : null;
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
    stockOf: (productAttributeId: number) => number;
    taxCategoryId: string;
    report: Report;
  },
): Promise<void> {
  const { product, combinations } = args;
  const wanted = combinations.length
    ? [...groupBy(combinations, (c) => c.id_product_attribute)].map(
        ([attributeId, attributes]) => ({
          attributeId,
          sku: orNull(attributes[0]!.reference) ?? `PS-${product.id_product}-${attributeId}`,
          name: `${product.name} ${attributes.map((a) => a.attribute_name).join(' ')}`,
          price: args.priceOf(attributes[0]!.price),
          stockOnHand: args.stockOf(attributeId),
          attributes,
        }),
      )
    : [
        {
          attributeId: 0,
          sku: orNull(product.reference) ?? `PS-${product.id_product}`,
          name: product.name,
          price: args.priceOf(0),
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
 * Inactive categories are left out; their URLs fall back to the legacy redirects table.
 */
async function importCategories(
  admin: VendureAdmin,
  categories: PsCategory[],
  assignments: { id_category: number; id_product: number }[],
  productIds: Map<number, string>,
  report: Report,
): Promise<void> {
  type Row = { id: string; customFields: { legacyId: number | null } | null };
  const existing = new Map(
    (
      await admin.all<Row>(
        `query ($skip: Int, $take: Int) { collections(options: { skip: $skip, take: $take }) { totalItems items { id customFields { legacyId } } } }`,
        (data: { collections: { items: Row[]; totalItems: number } }) => data.collections,
      )
    ).flatMap((row) =>
      row.customFields?.legacyId != null ? [[row.customFields.legacyId, row.id]] : [],
    ),
  );
  const productsOf = groupBy(assignments, (a) => a.id_category);
  const collectionIds = new Map<number, string>();

  // Parents first: categories come ordered by depth, then position.
  for (const category of categories) {
    if (category.active !== 1) {
      report.warn(
        `Category ${category.id_category} (${category.name}) is inactive and was not imported`,
      );
      continue;
    }
    const ids = (productsOf.get(category.id_category) ?? []).flatMap((a) => {
      const id = productIds.get(a.id_product);
      return id ? [id] : [];
    });
    const input = {
      isPrivate: false,
      inheritFilters: false,
      customFields: { legacyId: category.id_category },
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
          },
        },
      ],
    };
    try {
      const found = existing.get(category.id_category);
      if (found) {
        await admin.gql(
          `mutation ($input: UpdateCollectionInput!) { updateCollection(input: $input) { id } }`,
          {
            input: { ...input, id: found },
          },
        );
        collectionIds.set(category.id_category, found);
        report.count('categories updated');
      } else {
        const { createCollection } = await admin.gql<{ createCollection: { id: string } }>(
          `mutation ($input: CreateCollectionInput!) { createCollection(input: $input) { id } }`,
          { input: { ...input, parentId: collectionIds.get(category.id_parent) } },
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
