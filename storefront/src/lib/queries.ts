import { typedQuery } from '@karcher/graphql';

/*
 * Hand-typed Shop API queries. Once the Vendure server runs, `pnpm codegen` can generate these
 * types from the schema instead (see packages/graphql/codegen.ts).
 */

export interface LegacyFields {
  legacyId: number | null;
  ean13: string | null;
  urlCategory: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  featuredAsset: { preview: string } | null;
  customFields: LegacyFields;
}

export interface VariantSummary {
  id: string;
  priceWithTax: number;
  product: ProductSummary;
}

const PRODUCT_SUMMARY = /* GraphQL */ `
  id
  name
  slug
  featuredAsset { preview }
  customFields { legacyId ean13 urlCategory }
`;

export interface ProductDetail extends ProductSummary {
  description: string;
  assets: { preview: string }[];
  collections: { name: string; slug: string; customFields: { legacyId: number | null } }[];
  variants: { id: string; sku: string; priceWithTax: number; stockLevel: string }[];
}

export const PRODUCT_BY_LEGACY_ID = typedQuery<
  { products: { items: ProductDetail[] } },
  { legacyId: number }
>(/* GraphQL */ `
  query ProductByLegacyId($legacyId: Int!) {
    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {
      items {
        ${PRODUCT_SUMMARY}
        description
        assets { preview }
        collections { name slug customFields { legacyId } }
        variants { id sku priceWithTax stockLevel }
      }
    }
  }
`);

export interface CollectionWithProducts {
  id: string;
  name: string;
  slug: string;
  description: string;
  customFields: { legacyId: number | null };
  productVariants: { totalItems: number; items: VariantSummary[] };
}

const COLLECTION_FIELDS = /* GraphQL */ `
  id
  name
  slug
  description
  customFields { legacyId }
  productVariants(options: { take: $take }) {
    totalItems
    items { id priceWithTax product { ${PRODUCT_SUMMARY} } }
  }
`;

export const COLLECTION_BY_LEGACY_ID = typedQuery<
  { collections: { items: CollectionWithProducts[] } },
  { legacyId: number; take: number }
>(/* GraphQL */ `
  query CollectionByLegacyId($legacyId: Int!, $take: Int!) {
    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {
      items { ${COLLECTION_FIELDS} }
    }
  }
`);

export const COLLECTION_BY_SLUG = typedQuery<
  { collection: CollectionWithProducts | null },
  { slug: string; take: number }
>(/* GraphQL */ `
  query CollectionBySlug($slug: String!, $take: Int!) {
    collection(slug: $slug) { ${COLLECTION_FIELDS} }
  }
`);

export const LEGACY_IMAGE = typedQuery<
  { legacyImage: { preview: string } | null },
  { imageId: number }
>(/* GraphQL */ `
  query LegacyImage($imageId: Int!) {
    legacyImage(imageId: $imageId) { preview }
  }
`);

export const LEGACY_REDIRECT = typedQuery<
  { legacyRedirect: { toPath: string; statusCode: number } | null },
  { path: string }
>(/* GraphQL */ `
  query LegacyRedirect($path: String!) {
    legacyRedirect(path: $path) { toPath statusCode }
  }
`);

export interface SubmitFormInput {
  form: 'contact' | 'reseller' | 'after-sales';
  fullName: string;
  email: string;
  phone?: string | null;
  fields?: Record<string, string>;
}

export const SUBMIT_FORM = typedQuery<{ submitForm: string }, { input: SubmitFormInput }>(/* GraphQL */ `
  mutation SubmitForm($input: SubmitFormInput!) {
    submitForm(input: $input)
  }
`);

export const SITEMAP_PRODUCTS = typedQuery<
  { products: { totalItems: number; items: (Pick<ProductSummary, 'slug' | 'customFields'> & { updatedAt: string })[] } },
  { skip: number; take: number }
>(/* GraphQL */ `
  query SitemapProducts($skip: Int!, $take: Int!) {
    products(options: { skip: $skip, take: $take }) {
      totalItems
      items { slug updatedAt customFields { legacyId ean13 urlCategory } }
    }
  }
`);

export const SITEMAP_COLLECTIONS = typedQuery<
  { collections: { items: { slug: string; updatedAt: string; customFields: { legacyId: number | null } }[] } },
  Record<string, never>
>(/* GraphQL */ `
  query SitemapCollections {
    collections(options: { take: 500 }) {
      items { slug updatedAt customFields { legacyId } }
    }
  }
`);
