/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment ProductSummary on Product {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n    }\n    customFields {\n      legacyId\n      ean13\n      urlCategory\n    }\n  }\n": typeof types.ProductSummaryFragmentDoc,
    "\n  fragment VariantSummary on ProductVariant {\n    id\n    priceWithTax\n    product {\n      ...ProductSummary\n    }\n  }\n": typeof types.VariantSummaryFragmentDoc,
    "\n  fragment CollectionWithProducts on Collection {\n    id\n    name\n    slug\n    description\n    customFields {\n      legacyId\n    }\n    productVariants(options: { take: $take }) {\n      totalItems\n      items {\n        ...VariantSummary\n      }\n    }\n  }\n": typeof types.CollectionWithProductsFragmentDoc,
    "\n  query ProductByLegacyId($legacyId: Float!) {\n    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...ProductSummary\n        description\n        assets {\n          preview\n        }\n        collections {\n          name\n          slug\n          customFields {\n            legacyId\n          }\n        }\n        variants {\n          id\n          sku\n          priceWithTax\n          stockLevel\n        }\n      }\n    }\n  }\n": typeof types.ProductByLegacyIdDocument,
    "\n  query CollectionByLegacyId($legacyId: Float!, $take: Int!) {\n    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...CollectionWithProducts\n      }\n    }\n  }\n": typeof types.CollectionByLegacyIdDocument,
    "\n  query CollectionBySlug($slug: String!, $take: Int!) {\n    collection(slug: $slug) {\n      ...CollectionWithProducts\n    }\n  }\n": typeof types.CollectionBySlugDocument,
    "\n  query LegacyImage($imageId: Int!) {\n    legacyImage(imageId: $imageId) {\n      preview\n    }\n  }\n": typeof types.LegacyImageDocument,
    "\n  query LegacyRedirect($path: String!) {\n    legacyRedirect(path: $path) {\n      toPath\n      statusCode\n    }\n  }\n": typeof types.LegacyRedirectDocument,
    "\n  mutation SubmitForm($input: SubmitFormInput!) {\n    submitForm(input: $input)\n  }\n": typeof types.SubmitFormDocument,
    "\n  query SitemapProducts($skip: Int!, $take: Int!) {\n    products(options: { skip: $skip, take: $take }) {\n      totalItems\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n          ean13\n          urlCategory\n        }\n      }\n    }\n  }\n": typeof types.SitemapProductsDocument,
    "\n  query SitemapCollections($skip: Int!, $take: Int!) {\n    collections(options: { skip: $skip, take: $take }) {\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n        }\n      }\n    }\n  }\n": typeof types.SitemapCollectionsDocument,
};
const documents: Documents = {
    "\n  fragment ProductSummary on Product {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n    }\n    customFields {\n      legacyId\n      ean13\n      urlCategory\n    }\n  }\n": types.ProductSummaryFragmentDoc,
    "\n  fragment VariantSummary on ProductVariant {\n    id\n    priceWithTax\n    product {\n      ...ProductSummary\n    }\n  }\n": types.VariantSummaryFragmentDoc,
    "\n  fragment CollectionWithProducts on Collection {\n    id\n    name\n    slug\n    description\n    customFields {\n      legacyId\n    }\n    productVariants(options: { take: $take }) {\n      totalItems\n      items {\n        ...VariantSummary\n      }\n    }\n  }\n": types.CollectionWithProductsFragmentDoc,
    "\n  query ProductByLegacyId($legacyId: Float!) {\n    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...ProductSummary\n        description\n        assets {\n          preview\n        }\n        collections {\n          name\n          slug\n          customFields {\n            legacyId\n          }\n        }\n        variants {\n          id\n          sku\n          priceWithTax\n          stockLevel\n        }\n      }\n    }\n  }\n": types.ProductByLegacyIdDocument,
    "\n  query CollectionByLegacyId($legacyId: Float!, $take: Int!) {\n    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...CollectionWithProducts\n      }\n    }\n  }\n": types.CollectionByLegacyIdDocument,
    "\n  query CollectionBySlug($slug: String!, $take: Int!) {\n    collection(slug: $slug) {\n      ...CollectionWithProducts\n    }\n  }\n": types.CollectionBySlugDocument,
    "\n  query LegacyImage($imageId: Int!) {\n    legacyImage(imageId: $imageId) {\n      preview\n    }\n  }\n": types.LegacyImageDocument,
    "\n  query LegacyRedirect($path: String!) {\n    legacyRedirect(path: $path) {\n      toPath\n      statusCode\n    }\n  }\n": types.LegacyRedirectDocument,
    "\n  mutation SubmitForm($input: SubmitFormInput!) {\n    submitForm(input: $input)\n  }\n": types.SubmitFormDocument,
    "\n  query SitemapProducts($skip: Int!, $take: Int!) {\n    products(options: { skip: $skip, take: $take }) {\n      totalItems\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n          ean13\n          urlCategory\n        }\n      }\n    }\n  }\n": types.SitemapProductsDocument,
    "\n  query SitemapCollections($skip: Int!, $take: Int!) {\n    collections(options: { skip: $skip, take: $take }) {\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n        }\n      }\n    }\n  }\n": types.SitemapCollectionsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProductSummary on Product {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n    }\n    customFields {\n      legacyId\n      ean13\n      urlCategory\n    }\n  }\n"): typeof import('./graphql').ProductSummaryFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment VariantSummary on ProductVariant {\n    id\n    priceWithTax\n    product {\n      ...ProductSummary\n    }\n  }\n"): typeof import('./graphql').VariantSummaryFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CollectionWithProducts on Collection {\n    id\n    name\n    slug\n    description\n    customFields {\n      legacyId\n    }\n    productVariants(options: { take: $take }) {\n      totalItems\n      items {\n        ...VariantSummary\n      }\n    }\n  }\n"): typeof import('./graphql').CollectionWithProductsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProductByLegacyId($legacyId: Float!) {\n    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...ProductSummary\n        description\n        assets {\n          preview\n        }\n        collections {\n          name\n          slug\n          customFields {\n            legacyId\n          }\n        }\n        variants {\n          id\n          sku\n          priceWithTax\n          stockLevel\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ProductByLegacyIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CollectionByLegacyId($legacyId: Float!, $take: Int!) {\n    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...CollectionWithProducts\n      }\n    }\n  }\n"): typeof import('./graphql').CollectionByLegacyIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CollectionBySlug($slug: String!, $take: Int!) {\n    collection(slug: $slug) {\n      ...CollectionWithProducts\n    }\n  }\n"): typeof import('./graphql').CollectionBySlugDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LegacyImage($imageId: Int!) {\n    legacyImage(imageId: $imageId) {\n      preview\n    }\n  }\n"): typeof import('./graphql').LegacyImageDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LegacyRedirect($path: String!) {\n    legacyRedirect(path: $path) {\n      toPath\n      statusCode\n    }\n  }\n"): typeof import('./graphql').LegacyRedirectDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitForm($input: SubmitFormInput!) {\n    submitForm(input: $input)\n  }\n"): typeof import('./graphql').SubmitFormDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SitemapProducts($skip: Int!, $take: Int!) {\n    products(options: { skip: $skip, take: $take }) {\n      totalItems\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n          ean13\n          urlCategory\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').SitemapProductsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SitemapCollections($skip: Int!, $take: Int!) {\n    collections(options: { skip: $skip, take: $take }) {\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').SitemapCollectionsDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
