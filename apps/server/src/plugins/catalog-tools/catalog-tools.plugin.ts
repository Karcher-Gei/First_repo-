import { LanguageCode, PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { CatalogCsvService } from './catalog-csv.service';
import { CatalogToolsAdminResolver } from './catalog-tools.resolvers';
import { CategoryAssignmentService } from './category-assignment.service';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomCollectionFields {
        filterFacetIds: string[] | null;
    }
}

const adminSchema = gql`
    type CatalogCsvChange {
        field: String!
        from: String!
        to: String!
    }

    type CatalogCsvRow {
        line: Int!
        sku: String!
        product: String
        changes: [CatalogCsvChange!]!
        errors: [String!]!
    }

    type CatalogCsvReport {
        "Rows with changes or errors; unchanged rows are only counted."
        rows: [CatalogCsvRow!]!
        changed: Int!
        unchanged: Int!
        errors: Int!
        applied: Boolean!
    }

    type ProductCategory {
        id: ID!
        name: String!
        parentId: ID
        legacyId: Int
        depth: Int!
        assigned: Boolean!
    }

    extend type Query {
        "The catalog as CSV (one row per variant), to edit in a spreadsheet and send back."
        catalogCsvExport: String!
        "Checks a CSV and lists what it would change, without changing anything."
        previewCatalogCsv(csv: String!): CatalogCsvReport!
        "The hand-picked categories, with this product's membership."
        productCategories(productId: ID!): [ProductCategory!]!
    }

    extend type Mutation {
        "Applies the rows of a CSV that have no errors."
        applyCatalogCsv(csv: String!): CatalogCsvReport!
        "Puts a product in exactly these categories."
        setProductCategories(productId: ID!, collectionIds: [ID!]!): [ProductCategory!]!
    }
`;

/**
 * Catalog management for non-developers, in the dashboard: bulk updates from a CSV (prices,
 * promotions, stock, categories), a category tree on the product page, and the choice of the
 * filters each category shows.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [CatalogCsvService, CategoryAssignmentService],
    adminApiExtensions: { schema: adminSchema, resolvers: [CatalogToolsAdminResolver] },
    configuration: config => {
        config.customFields.Collection.push({
            name: 'filterFacetIds',
            type: 'string',
            list: true,
            nullable: true,
            public: true,
            label: [
                { languageCode: LanguageCode.fr, value: 'Filtres affichés' },
                { languageCode: LanguageCode.en, value: 'Filters shown' },
            ],
            description: [
                {
                    languageCode: LanguageCode.fr,
                    value: 'Les caractéristiques proposées comme filtres sur la page de la catégorie, dans cet ordre. Aucune cochée : toutes celles de ses produits.',
                },
            ],
            ui: { component: 'facet-filter-picker', tab: 'Filtres' },
        });
        return config;
    },
    dashboard: './dashboard/index.tsx',
    compatibility: '^3.0.0',
})
export class CatalogToolsPlugin {}
