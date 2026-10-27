import { graphql } from '@karcher/graphql';

/* Quote requests (QuotesPlugin) and warranty registrations (WarrantyPlugin). */

export const QUOTE_PRODUCT = graphql(`
  query QuoteProduct($id: ID!) {
    product(id: $id) {
      id
      name
      variants {
        id
        name
        sku
      }
    }
  }
`);

export const REQUEST_QUOTE = graphql(`
  mutation RequestQuote($input: RequestQuoteInput!) {
    requestQuote(input: $input)
  }
`);

export const REGISTER_WARRANTY = graphql(`
  mutation RegisterWarranty($input: RegisterWarrantyInput!) {
    registerWarranty(input: $input)
  }
`);
