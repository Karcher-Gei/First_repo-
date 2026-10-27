import { Inject, Injectable } from '@nestjs/common';
import {
    ActiveOrderService,
    isGraphQlErrorResult,
    Logger,
    OrderService,
    RequestContext,
    RequestContextService,
    TransactionalConnection,
    UserInputError,
} from '@vendure/core';

import { KONNECT_METHOD_CODE, KONNECT_PLUGIN_OPTIONS, loggerCtx } from './constants';
import { KonnectClient } from './konnect.client';
import type { KonnectPluginOptions } from './types';

@Injectable()
export class KonnectService {
    private readonly client: KonnectClient;

    constructor(
        @Inject(KONNECT_PLUGIN_OPTIONS) private readonly options: KonnectPluginOptions,
        private readonly activeOrderService: ActiveOrderService,
        private readonly orderService: OrderService,
        private readonly requestContextService: RequestContextService,
        private readonly connection: TransactionalConnection,
    ) {
        this.client = new KonnectClient(options);
    }

    /** Starts a Konnect payment for the active order and returns the URL to redirect the shopper to. */
    async createPaymentIntent(ctx: RequestContext): Promise<string> {
        const order = await this.activeOrderService.getActiveOrder(ctx, undefined);
        if (!order) {
            throw new UserInputError('No active order');
        }
        if (order.state !== 'ArrangingPayment') {
            const transition = await this.orderService.transitionToState(ctx, order.id, 'ArrangingPayment');
            if (isGraphQlErrorResult(transition)) {
                throw new UserInputError(transition.message);
            }
        }
        const customer = order.customer;
        const { payUrl } = await this.client.initPayment({
            amount: order.totalWithTax,
            orderId: order.code,
            description: `Commande ${order.code}`,
            firstName: customer?.firstName,
            lastName: customer?.lastName,
            phoneNumber: customer?.phoneNumber,
            email: customer?.emailAddress,
            webhook: `${this.options.serverPublicUrl}/konnect/webhook`,
            successUrl: `${this.options.storefrontUrl}/commande/confirmation/${order.code}`,
            failUrl: `${this.options.storefrontUrl}/commande/paiement?echec=1`,
        });
        return payUrl;
    }

    /** Called by Konnect after a payment attempt. Safe to call more than once for the same payment. */
    async handleWebhook(paymentRef: string): Promise<void> {
        const payment = await this.client.getPayment(paymentRef);
        const ctx = await this.requestContextService.create({ apiType: 'admin' });
        // A controller has no @Transaction(); OrderService.addPaymentToOrder requires one.
        await this.connection.withTransaction(ctx, async txCtx => {
            const order = await this.orderService.findOneByCode(txCtx, payment.orderId);
            if (!order) {
                Logger.warn(`Webhook for unknown order ${payment.orderId} (ref ${paymentRef})`, loggerCtx);
                return;
            }
            if (order.state !== 'ArrangingPayment') {
                Logger.info(`Order ${order.code} is already ${order.state}; webhook ignored`, loggerCtx);
                return;
            }
            const result = await this.orderService.addPaymentToOrder(txCtx, order.id, {
                method: KONNECT_METHOD_CODE,
                metadata: { paymentRef },
            });
            if (isGraphQlErrorResult(result)) {
                Logger.error(`Could not add Konnect payment to ${order.code}: ${result.message}`, loggerCtx);
            }
        });
    }
}
