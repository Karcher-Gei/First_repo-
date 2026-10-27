import { graphql, type ProductSummaryFragment } from '@karcher/graphql';

/*
 * Shop API documents. Their result and variable types are generated from the Vendure schema:
 * after editing a document here, run `pnpm codegen` with the server running.
 */

export type ProductSummary = ProductSummaryFragment;

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
        seo: customFields {
          metaTitle
          metaDescription
        }
        assets {
          preview
        }
        facetValues {
          id
          name
          facet {
            id
            name
          }
        }
        collections {
          id
          name
          slug
          breadcrumbs {
            id
          }
          customFields {
            legacyId
          }
          parent {
            name
            slug
            customFields {
              legacyId
            }
          }
        }
        variants {
          id
          name
          sku
          priceWithTax
          stockLevel
          options {
            name
          }
        }
      }
    }
  }
`);

graphql(`
  fragment CategoryLink on Collection {
    id
    name
    slug
    customFields {
      legacyId
    }
  }
`);

export const COLLECTION_BY_LEGACY_ID = graphql(`
  query CollectionByLegacyId($legacyId: Float!) {
    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {
      items {
        id
        name
        slug
        description
        customFields {
          legacyId
          metaTitle
          metaDescription
        }
        parent {
          ...CategoryLink
          parent {
            ...CategoryLink
          }
        }
        children {
          ...CategoryLink
          position
        }
      }
    }
  }
`);

/** Every facet value in a category with its count, to list the filters. */
export const CATEGORY_FACETS = graphql(`
  query CategoryFacets($collectionId: ID!) {
    search(input: { collectionId: $collectionId, groupByProduct: true, take: 0 }) {
      totalItems
      facetValues {
        count
        facetValue {
          id
          name
          facet {
            id
            name
          }
        }
      }
    }
  }
`);

/** One page of a category with the shopper's filters and sort applied. */
export const CATEGORY_PAGE = graphql(`
  query CategoryPage($input: SearchInput!) {
    search(input: $input) {
      totalItems
      items {
        productId
        priceWithTax {
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
      }
    }
  }
`);

// Search results carry no custom fields, which product URLs are built from.
export const PRODUCTS_BY_IDS = graphql(`
  query ProductsByIds($ids: [String!]!, $take: Int!) {
    products(options: { take: $take, filter: { id: { in: $ids } } }) {
      items {
        ...ProductSummary
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

/** Top-level categories and their children, for the menu, footer and homepage tiles. */
export const CATEGORY_TREE = graphql(`
  query CategoryTree {
    collections(options: { topLevelOnly: true, take: 50, sort: { position: ASC } }) {
      items {
        id
        name
        slug
        featuredAsset {
          preview
        }
        customFields {
          legacyId
        }
        children {
          id
          name
          slug
          position
          customFields {
            legacyId
          }
        }
      }
    }
  }
`);

export const PRODUCT_SEARCH = graphql(`
  query ProductSearch($term: String!, $skip: Int!, $take: Int!) {
    search(input: { term: $term, groupByProduct: true, skip: $skip, take: $take }) {
      totalItems
      items {
        productId
        priceWithTax {
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
      }
    }
  }
`);
