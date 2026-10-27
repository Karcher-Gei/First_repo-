import {
    CreatePaymentResult,
    Injector,
    LanguageCode,
    PaymentMethodHandler,
    SettlePaymentResult,
} from '@vendure/core';

import { KONNECT_METHOD_CODE, KONNECT_PLUGIN_OPTIONS } from './constants';
import { KonnectClient } from './konnect.client';
import type { KonnectPluginOptions } from './types';

let client: KonnectClient | undefined;

/**
 * The payment is only added to the order once Konnect's webhook reports it (see KonnectService),
 * so createPayment re-checks the status with Konnect and settles straight away.
 */
export const konnectPaymentHandler = new PaymentMethodHandler({
    code: KONNECT_METHOD_CODE,
    description: [
        { languageCode: LanguageCode.fr, value: 'Konnect (carte bancaire, e-DINAR, wallet)' },
        { languageCode: LanguageCode.en, value: 'Konnect (bank card, e-DINAR, wallet)' },
    ],
    args: {},
    init(injector: Injector) {
        client = new KonnectClient(injector.get<KonnectPluginOptions>(KONNECT_PLUGIN_OPTIONS));
    },
    createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult> => {
        const paymentRef: unknown = metadata.paymentRef;
        if (!client || typeof paymentRef !== 'string') {
            return { amount, state: 'Declined', errorMessage: 'Missing Konnect payment reference' };
        }
        const payment = await client.getPayment(paymentRef);
        if (payment.status !== 'completed') {
            return {
                amount,
                state: 'Declined',
                transactionId: paymentRef,
                errorMessage: `Konnect payment status is "${payment.status}"`,
            };
        }
        if (payment.amount !== amount) {
            return {
                amount,
                state: 'Declined',
                transactionId: paymentRef,
                errorMessage: `Konnect amount ${payment.amount} does not match order amount ${amount}`,
            };
        }
        return { amount, state: 'Settled', transactionId: paymentRef, metadata: { konnectStatus: payment.status } };
    },
    settlePayment: async (): Promise<SettlePaymentResult> => ({ success: true }),
});
