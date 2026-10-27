import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { FormSubmission } from './form-submission.entity';
import { FormsAdminResolver, FormsShopResolver } from './forms.resolvers';
import { FormsService } from './forms.service';

const shopSchema = gql`
    input SubmitFormInput {
        "contact | reseller | after-sales"
        form: String!
        fullName: String!
        email: String!
        phone: String
        "Extra fields specific to the form, e.g. { company, city, message }"
        fields: JSON
    }

    extend type Mutation {
        submitForm(input: SubmitFormInput!): ID!
    }
`;

const adminSchema = gql`
    type FormSubmission implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        form: String!
        fullName: String!
        email: String!
        phone: String
        fields: JSON!
        handled: Boolean!
    }

    type FormSubmissionList implements PaginatedList {
        items: [FormSubmission!]!
        totalItems: Int!
    }

    # Filled in by Vendure at runtime
    input FormSubmissionListOptions

    extend type Query {
        formSubmissions(options: FormSubmissionListOptions): FormSubmissionList!
    }

    extend type Mutation {
        markFormSubmissionHandled(id: ID!): FormSubmission!
    }
`;

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [FormSubmission],
    providers: [FormsService],
    shopApiExtensions: { schema: shopSchema, resolvers: [FormsShopResolver] },
    adminApiExtensions: { schema: adminSchema, resolvers: [FormsAdminResolver] },
    compatibility: '^3.0.0',
})
export class FormsPlugin {}
