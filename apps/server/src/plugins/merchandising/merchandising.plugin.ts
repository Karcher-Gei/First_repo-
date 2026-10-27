import { PluginCommonModule, VendurePlugin } from '@vendure/core';

import { productCustomFields, variantCustomFields } from './custom-fields';
import { endSalesTask } from './end-sales.task';
import { onSaleCollectionFilter } from './on-sale-filter';

/**
 * Sales with a struck-through price and an end date, the "Promotions" collection that lists
 * them, and the data behind PrestaShop's new products and best sellers pages.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    configuration: config => {
        config.customFields.ProductVariant.push(...variantCustomFields);
        config.customFields.Product.push(...productCustomFields);
        config.catalogOptions.collectionFilters.push(onSaleCollectionFilter);
        config.schedulerOptions.tasks = [...(config.schedulerOptions.tasks ?? []), endSalesTask];
        return config;
    },
    compatibility: '^3.0.0',
})
export class MerchandisingPlugin {}
