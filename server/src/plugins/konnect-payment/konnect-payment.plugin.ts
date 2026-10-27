import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import gql from 'graphql-tag';

import { KONNECT_PLUGIN_OPTIONS } from './constants';
import { konnectPaymentHandler } from './konnect-payment-handler';
import { KonnectController } from './konnect.controller';
import { KonnectShopResolver } from './konnect.resolver';
import { KonnectService } from './konnect.service';
import type { KonnectPluginOptions } from './types';

/**
 * Konnect payments (Tunisia): the storefront calls `createKonnectPaymentIntent`, redirects to
 * the returned URL, and Konnect's webhook adds the settled payment to the order.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        KonnectService,
        { provide: KONNECT_PLUGIN_OPTIONS, useFactory: () => KonnectPaymentPlugin.options },
    ],
    controllers: [KonnectController],
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                "Starts a Konnect payment for the active order and returns the payment page URL."
                createKonnectPaymentIntent: String!
            }
        `,
        resolvers: [KonnectShopResolver],
    },
    configuration: config => {
        config.paymentOptions.paymentMethodHandlers.push(konnectPaymentHandler);
        return config;
    },
    compatibility: '^3.0.0',
})
export class KonnectPaymentPlugin {
    static options: KonnectPluginOptions;

    static init(options: KonnectPluginOptions): typeof KonnectPaymentPlugin {
        this.options = options;
        return KonnectPaymentPlugin;
    }
}
