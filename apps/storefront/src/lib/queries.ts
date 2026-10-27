import {
  graphql,
  type ProductSummaryFragment,
  type VariantSummaryFragment,
} from '@karcher/graphql';

/*
 * Shop API documents. Their result and variable types are generated from the Vendure schema:
 * after editing a document here, run `pnpm codegen` with the server running.
 */

export type ProductSummary = ProductSummaryFragment;
export type VariantSummary = VariantSummaryFragment;

graphql(`
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
`);

graphql(`
  fragment VariantSummary on ProductVariant {
    id
    priceWithTax
    product {
      ...ProductSummary
    }
  }
`);

// Uses the $take variable of the operations that spread it.
graphql(`
  fragment CollectionWithProducts on Collection {
    id
    name
    slug
    description
    customFields {
      legacyId
    }
    productVariants(options: { take: $take }) {
      totalItems
      items {
        ...VariantSummary
      }
    }
  }
`);

// Vendure list filters type every number as Float.
export const PRODUCT_BY_LEGACY_ID = graphql(`
  query ProductByLegacyId($legacyId: Float!) {
    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {
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
`);

export const COLLECTION_BY_LEGACY_ID = graphql(`
  query CollectionByLegacyId($legacyId: Float!, $take: Int!) {
    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {
      items {
        ...CollectionWithProducts
      }
    }
  }
`);

export const COLLECTION_BY_SLUG = graphql(`
  query CollectionBySlug($slug: String!, $take: Int!) {
    collection(slug: $slug) {
      ...CollectionWithProducts
    }
  }
`);

export const LEGACY_IMAGE = graphql(`
  query LegacyImage($imageId: Int!) {
    legacyImage(imageId: $imageId) {
      preview
    }
  }
`);

export const LEGACY_REDIRECT = graphql(`
  query LegacyRedirect($path: String!) {
    legacyRedirect(path: $path) {
      toPath
      statusCode
    }
  }
`);

export const SUBMIT_FORM = graphql(`
  mutation SubmitForm($input: SubmitFormInput!) {
    submitForm(input: $input)
  }
`);

export const SITEMAP_PRODUCTS = graphql(`
  query SitemapProducts($skip: Int!, $take: Int!) {
    products(options: { skip: $skip, take: $take }) {
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
`);

export const SITEMAP_COLLECTIONS = graphql(`
  query SitemapCollections($skip: Int!, $take: Int!) {
    collections(options: { skip: $skip, take: $take }) {
      items {
        slug
        updatedAt
        customFields {
          legacyId
        }
      }
    }
  }
`);
