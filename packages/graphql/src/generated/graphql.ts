/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type SubmitFormInput = {
  email: string;
  /** Extra fields specific to the form, e.g. { company, city, message } */
  fields?: Record<string, unknown> | null | undefined;
  /** contact | reseller | after-sales */
  form: string;
  fullName: string;
  phone?: string | null | undefined;
};

export type ProductSummaryFragment = { id: string, name: string, slug: string, featuredAsset: { preview: string } | null, customFields: { legacyId: number | null, ean13: string | null, urlCategory: string | null } | null };

export type VariantSummaryFragment = { id: string, priceWithTax: number, product: { id: string, name: string, slug: string, featuredAsset: { preview: string } | null, customFields: { legacyId: number | null, ean13: string | null, urlCategory: string | null } | null } };

export type CollectionWithProductsFragment = { id: string, name: string, slug: string, description: string, customFields: { legacyId: number | null } | null, productVariants: { totalItems: number, items: Array<{ id: string, priceWithTax: number, product: { id: string, name: string, slug: string, featuredAsset: { preview: string } | null, customFields: { legacyId: number | null, ean13: string | null, urlCategory: string | null } | null } }> } };

export type ProductByLegacyIdQueryVariables = Exact<{
  legacyId: number;
}>;


export type ProductByLegacyIdQuery = { products: { items: Array<{ description: string, id: string, name: string, slug: string, assets: Array<{ preview: string }>, collections: Array<{ name: string, slug: string, customFields: { legacyId: number | null } | null }>, variants: Array<{ id: string, sku: string, priceWithTax: number, stockLevel: string }>, featuredAsset: { preview: string } | null, customFields: { legacyId: number | null, ean13: string | null, urlCategory: string | null } | null }> } };

export type CollectionByLegacyIdQueryVariables = Exact<{
  legacyId: number;
  take: number;
}>;


export type CollectionByLegacyIdQuery = { collections: { items: Array<{ id: string, name: string, slug: string, description: string, customFields: { legacyId: number | null } | null, productVariants: { totalItems: number, items: Array<{ id: string, priceWithTax: number, product: { id: string, name: string, slug: string, featuredAsset: { preview: string } | null, customFields: { legacyId: number | null, ean13: string | null, urlCategory: string | null } | null } }> } }> } };

export type CollectionBySlugQueryVariables = Exact<{
  slug: string;
  take: number;
}>;


export type CollectionBySlugQuery = { collection: { id: string, name: string, slug: string, description: string, customFields: { legacyId: number | null } | null, productVariants: { totalItems: number, items: Array<{ id: string, priceWithTax: number, product: { id: string, name: string, slug: string, featuredAsset: { preview: string } | null, customFields: { legacyId: number | null, ean13: string | null, urlCategory: string | null } | null } }> } } | null };

export type LegacyImageQueryVariables = Exact<{
  imageId: number;
}>;


export type LegacyImageQuery = { legacyImage: { preview: string } | null };

export type LegacyRedirectQueryVariables = Exact<{
  path: string;
}>;


export type LegacyRedirectQuery = { legacyRedirect: { toPath: string, statusCode: number } | null };

export type SubmitFormMutationVariables = Exact<{
  input: SubmitFormInput;
}>;


export type SubmitFormMutation = { submitForm: string };

export type SitemapProductsQueryVariables = Exact<{
  skip: number;
  take: number;
}>;


export type SitemapProductsQuery = { products: { totalItems: number, items: Array<{ slug: string, updatedAt: string, customFields: { legacyId: number | null, ean13: string | null, urlCategory: string | null } | null }> } };

export type SitemapCollectionsQueryVariables = Exact<{
  skip: number;
  take: number;
}>;


export type SitemapCollectionsQuery = { collections: { items: Array<{ slug: string, updatedAt: string, customFields: { legacyId: number | null } | null }> } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const ProductSummaryFragmentDoc = new TypedDocumentString(`
    fragment ProductSummary on Product {
  id
  name
  slug
  featuredAsset {
    preview
  }
  customFields {
    legacyId
    ean13
    urlCategory
  }
}
    `, {"fragmentName":"ProductSummary"}) as unknown as TypedDocumentString<ProductSummaryFragment, unknown>;
export const VariantSummaryFragmentDoc = new TypedDocumentString(`
    fragment VariantSummary on ProductVariant {
  id
  priceWithTax
  product {
    ...ProductSummary
  }
}
    fragment ProductSummary on Product {
  id
  name
  slug
  featuredAsset {
    preview
  }
  customFields {
    legacyId
    ean13
    urlCategory
  }
}`, {"fragmentName":"VariantSummary"}) as unknown as TypedDocumentString<VariantSummaryFragment, unknown>;
export const CollectionWithProductsFragmentDoc = new TypedDocumentString(`
    fragment CollectionWithProducts on Collection {
  id
  name
  slug
  description
  customFields {
    legacyId
  }
  productVariants(options: {take: $take}) {
    totalItems
    items {
      ...VariantSummary
    }
  }
}
    fragment ProductSummary on Product {
  id
  name
  slug
  featuredAsset {
    preview
  }
  customFields {
    legacyId
    ean13
    urlCategory
  }
}
fragment VariantSummary on ProductVariant {
  id
  priceWithTax
  product {
    ...ProductSummary
  }
}`, {"fragmentName":"CollectionWithProducts"}) as unknown as TypedDocumentString<CollectionWithProductsFragment, unknown>;
export const ProductByLegacyIdDocument = new TypedDocumentString(`
    query ProductByLegacyId($legacyId: Float!) {
  products(options: {take: 1, filter: {legacyId: {eq: $legacyId}}}) {
    items {
      ...ProductSummary
      description
      assets {
        preview
      }
      collections {
        name
        slug
        customFields {
          legacyId
        }
      }
      variants {
        id
        sku
        priceWithTax
        stockLevel
      }
    }
  }
}
    fragment ProductSummary on Product {
  id
  name
  slug
  featuredAsset {
    preview
  }
  customFields {
    legacyId
    ean13
    urlCategory
  }
}`) as unknown as TypedDocumentString<ProductByLegacyIdQuery, ProductByLegacyIdQueryVariables>;
export const CollectionByLegacyIdDocument = new TypedDocumentString(`
    query CollectionByLegacyId($legacyId: Float!, $take: Int!) {
  collections(options: {take: 1, filter: {legacyId: {eq: $legacyId}}}) {
    items {
      ...CollectionWithProducts
    }
  }
}
    fragment ProductSummary on Product {
  id
  name
  slug
  featuredAsset {
    preview
  }
  customFields {
    legacyId
    ean13
    urlCategory
  }
}
fragment VariantSummary on ProductVariant {
  id
  priceWithTax
  product {
    ...ProductSummary
  }
}
fragment CollectionWithProducts on Collection {
  id
  name
  slug
  description
  customFields {
    legacyId
  }
  productVariants(options: {take: $take}) {
    totalItems
    items {
      ...VariantSummary
    }
  }
}`) as unknown as TypedDocumentString<CollectionByLegacyIdQuery, CollectionByLegacyIdQueryVariables>;
export const CollectionBySlugDocument = new TypedDocumentString(`
    query CollectionBySlug($slug: String!, $take: Int!) {
  collection(slug: $slug) {
    ...CollectionWithProducts
  }
}
    fragment ProductSummary on Product {
  id
  name
  slug
  featuredAsset {
    preview
  }
  customFields {
    legacyId
    ean13
    urlCategory
  }
}
fragment VariantSummary on ProductVariant {
  id
  priceWithTax
  product {
    ...ProductSummary
  }
}
fragment CollectionWithProducts on Collection {
  id
  name
  slug
  description
  customFields {
    legacyId
  }
  productVariants(options: {take: $take}) {
    totalItems
    items {
      ...VariantSummary
    }
  }
}`) as unknown as TypedDocumentString<CollectionBySlugQuery, CollectionBySlugQueryVariables>;
export const LegacyImageDocument = new TypedDocumentString(`
    query LegacyImage($imageId: Int!) {
  legacyImage(imageId: $imageId) {
    preview
  }
}
    `) as unknown as TypedDocumentString<LegacyImageQuery, LegacyImageQueryVariables>;
export const LegacyRedirectDocument = new TypedDocumentString(`
    query LegacyRedirect($path: String!) {
  legacyRedirect(path: $path) {
    toPath
    statusCode
  }
}
    `) as unknown as TypedDocumentString<LegacyRedirectQuery, LegacyRedirectQueryVariables>;
export const SubmitFormDocument = new TypedDocumentString(`
    mutation SubmitForm($input: SubmitFormInput!) {
  submitForm(input: $input)
}
    `) as unknown as TypedDocumentString<SubmitFormMutation, SubmitFormMutationVariables>;
export const SitemapProductsDocument = new TypedDocumentString(`
    query SitemapProducts($skip: Int!, $take: Int!) {
  products(options: {skip: $skip, take: $take}) {
    totalItems
    items {
      slug
      updatedAt
      customFields {
        legacyId
        ean13
        urlCategory
      }
    }
  }
}
    `) as unknown as TypedDocumentString<SitemapProductsQuery, SitemapProductsQueryVariables>;
export const SitemapCollectionsDocument = new TypedDocumentString(`
    query SitemapCollections($skip: Int!, $take: Int!) {
  collections(options: {skip: $skip, take: $take}) {
    items {
      slug
      updatedAt
      customFields {
        legacyId
      }
    }
  }
}
    `) as unknown as TypedDocumentString<SitemapCollectionsQuery, SitemapCollectionsQueryVariables>;