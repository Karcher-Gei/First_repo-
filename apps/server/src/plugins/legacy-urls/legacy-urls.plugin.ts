import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { assetCustomFields, collectionCustomFields, productCustomFields } from './custom-fields';
import { LegacyRedirect } from './legacy-redirect.entity';
import { LegacyUrlsAdminResolver, LegacyUrlsShopResolver } from './legacy-urls.resolvers';
import { LegacyUrlsService } from './legacy-urls.service';

const shopSchema = gql`
    type LegacyRedirect {
        fromPath: String!
        toPath: String!
        statusCode: Int!
    }

    extend type Query {
        "Manual redirect for an old URL path, if one exists."
        legacyRedirect(path: String!): LegacyRedirect
        "The migrated asset behind an old PrestaShop image URL /{imageId}-{size}/{slug}.jpg"
        legacyImage(imageId: Int!): Asset
    }
`;

const adminSchema = gql`
    type LegacyRedirect implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        fromPath: String!
        toPath: String!
        statusCode: Int!
    }

    type LegacyRedirectList implements PaginatedList {
        items: [LegacyRedirect!]!
        totalItems: Int!
    }

    # Filled in by Vendure at runtime
    input LegacyRedirectListOptions

    input LegacyRedirectInput {
        fromPath: String!
        toPath: String!
        "301 (default) or 410"
        statusCode: Int
    }

    extend type Query {
        legacyRedirects(options: LegacyRedirectListOptions): LegacyRedirectList!
    }

    extend type Mutation {
        upsertLegacyRedirect(input: LegacyRedirectInput!): LegacyRedirect!
        deleteLegacyRedirect(id: ID!): Boolean!
    }
`;

/**
 * Keeps karcher-gei.tn's PrestaShop URLs working: legacy IDs on products, collections and
 * assets, plus a redirects table for URLs that must point somewhere new.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [LegacyRedirect],
    providers: [LegacyUrlsService],
    shopApiExtensions: { schema: shopSchema, resolvers: [LegacyUrlsShopResolver] },
    adminApiExtensions: { schema: adminSchema, resolvers: [LegacyUrlsAdminResolver] },
    configuration: config => {
        config.customFields.Product.push(...productCustomFields);
        config.customFields.Collection.push(...collectionCustomFields);
        config.customFields.Asset.push(...assetCustomFields);
        return config;
    },
    compatibility: '^3.0.0',
})
export class LegacyUrlsPlugin {}
