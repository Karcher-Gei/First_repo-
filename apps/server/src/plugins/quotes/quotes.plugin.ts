import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { QuoteRequest } from './quote-request.entity';
import { QuoteAdminResolver, QuoteShopResolver } from './quote.resolvers';
import { QuoteService } from './quote.service';

const shopSchema = gql`
    input QuoteLineInput {
        productVariantId: ID!
        quantity: Int!
    }

    input RequestQuoteInput {
        fullName: String!
        email: String!
        phone: String
        company: String
        message: String!
        lines: [QuoteLineInput!]!
    }

    extend type Mutation {
        "Sends a quote request to the sales team. Returns the request id."
        requestQuote(input: RequestQuoteInput!): ID!
    }
`;

const adminSchema = gql`
    type QuoteLine {
        productVariantId: ID!
        quantity: Int!
    }

    type QuoteRequest implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        fullName: String!
        email: String!
        phone: String
        company: String
        message: String!
        lines: [QuoteLine!]!
        status: String!
        userId: ID
    }

    type QuoteRequestList implements PaginatedList {
        items: [QuoteRequest!]!
        totalItems: Int!
    }

    # Filled in by Vendure at runtime
    input QuoteRequestListOptions

    extend type Query {
        quoteRequests(options: QuoteRequestListOptions): QuoteRequestList!
        quoteRequest(id: ID!): QuoteRequest
    }

    extend type Mutation {
        setQuoteRequestStatus(id: ID!, status: String!): QuoteRequest!
    }
`;

/** Quote requests from shoppers, listed for the sales team in the admin API. */
@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [QuoteRequest],
    providers: [QuoteService],
    shopApiExtensions: { schema: shopSchema, resolvers: [QuoteShopResolver] },
    adminApiExtensions: { schema: adminSchema, resolvers: [QuoteAdminResolver] },
    dashboard: './dashboard/index.tsx',
    compatibility: '^3.0.0',
})
export class QuotesPlugin {}
