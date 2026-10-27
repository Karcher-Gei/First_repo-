import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { WarrantyRegistration } from './warranty-registration.entity';
import { WarrantyAdminResolver, WarrantyShopResolver } from './warranty.resolvers';
import { WarrantyService } from './warranty.service';

const shopSchema = gql`
    input RegisterWarrantyInput {
        fullName: String!
        email: String!
        phone: String
        productSku: String!
        serialNumber: String!
        "YYYY-MM-DD"
        purchaseDate: String!
        purchasedFrom: String
    }

    extend type Mutation {
        "Registers a machine for the warranty. Returns the registration id."
        registerWarranty(input: RegisterWarrantyInput!): ID!
    }
`;

const adminSchema = gql`
    type WarrantyRegistration implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        fullName: String!
        email: String!
        phone: String
        productSku: String!
        serialNumber: String!
        purchaseDate: String!
        purchasedFrom: String
        userId: ID
    }

    type WarrantyRegistrationList implements PaginatedList {
        items: [WarrantyRegistration!]!
        totalItems: Int!
    }

    # Filled in by Vendure at runtime
    input WarrantyRegistrationListOptions

    extend type Query {
        warrantyRegistrations(options: WarrantyRegistrationListOptions): WarrantyRegistrationList!
    }
`;

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [WarrantyRegistration],
    providers: [WarrantyService],
    shopApiExtensions: { schema: shopSchema, resolvers: [WarrantyShopResolver] },
    adminApiExtensions: { schema: adminSchema, resolvers: [WarrantyAdminResolver] },
    compatibility: '^3.0.0',
})
export class WarrantyPlugin {}
