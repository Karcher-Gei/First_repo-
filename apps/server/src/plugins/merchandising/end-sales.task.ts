import {
    Logger,
    ProductVariant,
    ProductVariantService,
    RequestContextService,
    ScheduledTask,
    TransactionalConnection,
} from '@vendure/core';
import { LessThanOrEqual } from 'typeorm';

const loggerCtx = 'MerchandisingPlugin';

/** Restores the regular price of the variants whose sale has ended. */
export const endSalesTask = new ScheduledTask({
    id: 'end-sales',
    description: 'Restores the regular price of variants whose sale has ended',
    schedule: cron => cron.every(15).minutes(),
    async execute({ injector }) {
        const ctx = await injector.get(RequestContextService).create({ apiType: 'admin' });
        const ended = await injector
            .get(TransactionalConnection)
            .getRepository(ctx, ProductVariant)
            .find({ where: { customFields: { saleEndsAt: LessThanOrEqual(new Date()) } } });
        const variantService = injector.get(ProductVariantService);
        for (const variant of ended) {
            const { regularPrice } = variant.customFields;
            // Through the service, so search, collections (Promotions) and the storefront follow.
            await variantService.update(ctx, [
                {
                    id: variant.id,
                    ...(regularPrice != null ? { price: regularPrice } : {}),
                    customFields: { regularPrice: null, saleEndsAt: null },
                },
            ]);
        }
        if (ended.length) {
            Logger.info(`Ended the sale of ${ended.length} variant(s)`, loggerCtx);
        }
        return { ended: ended.length };
    },
});
