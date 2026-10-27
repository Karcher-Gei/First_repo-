import { Inject, OnApplicationBootstrap, OnApplicationShutdown, Type } from '@nestjs/common';
import {
    AssetEvent,
    CollectionEvent,
    CollectionModificationEvent,
    EventBus,
    FacetEvent,
    FacetValueEvent,
    Logger,
    PluginCommonModule,
    ProductChannelEvent,
    ProductEvent,
    ProductOptionEvent,
    ProductOptionGroupEvent,
    ProductVariantChannelEvent,
    ProductVariantEvent,
    ProductVariantPriceEvent,
    StockMovementEvent,
    TaxRateEvent,
    VendureEvent,
    VendurePlugin,
} from '@vendure/core';

const STOREFRONT_CACHE_OPTIONS = Symbol('STOREFRONT_CACHE_OPTIONS');
const loggerCtx = 'StorefrontCachePlugin';

export interface StorefrontCacheOptions {
    /** e.g. https://karcher-gei.tn */
    storefrontUrl: string;
    /** Same value as the storefront's REVALIDATE_SECRET. */
    secret: string;
}

/** Changes that alter what catalog pages show: products, prices, stock, categories, filters, images, VAT. */
const CATALOG_EVENTS: Array<Type<VendureEvent>> = [
    ProductEvent,
    ProductChannelEvent,
    ProductVariantEvent,
    ProductVariantChannelEvent,
    ProductVariantPriceEvent,
    ProductOptionEvent,
    ProductOptionGroupEvent,
    StockMovementEvent,
    CollectionEvent,
    CollectionModificationEvent,
    FacetEvent,
    FacetValueEvent,
    AssetEvent,
    TaxRateEvent,
];

/** Wait for a burst of changes (an import, a bulk edit) to end before refreshing. */
const DEBOUNCE_MS = 2_000;
/**
 * Search results and collection contents are rebuilt by background jobs after a change; a
 * second refresh picks them up.
 */
const FOLLOW_UP_MS = 30_000;

/**
 * Tells the storefront to drop its cached catalog pages when the catalog changes in Vendure, so
 * a price or stock change shows at once instead of after the 5-minute cache.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [{ provide: STOREFRONT_CACHE_OPTIONS, useFactory: () => StorefrontCachePlugin.options }],
    compatibility: '^3.0.0',
})
export class StorefrontCachePlugin implements OnApplicationBootstrap, OnApplicationShutdown {
    static options: StorefrontCacheOptions;

    private debounce: NodeJS.Timeout | undefined;
    private followUp: NodeJS.Timeout | undefined;

    static init(options: StorefrontCacheOptions): typeof StorefrontCachePlugin {
        this.options = options;
        return StorefrontCachePlugin;
    }

    constructor(
        private readonly eventBus: EventBus,
        @Inject(STOREFRONT_CACHE_OPTIONS) private readonly options: StorefrontCacheOptions,
    ) {}

    onApplicationBootstrap(): void {
        if (!this.options.secret) {
            Logger.info('REVALIDATE_SECRET not set; the storefront cache expires on its own', loggerCtx);
            return;
        }
        for (const type of CATALOG_EVENTS) {
            this.eventBus.ofType<VendureEvent>(type).subscribe(() => this.schedule());
        }
    }

    onApplicationShutdown(): void {
        clearTimeout(this.debounce);
        clearTimeout(this.followUp);
    }

    private schedule(): void {
        clearTimeout(this.debounce);
        clearTimeout(this.followUp);
        this.debounce = setTimeout(() => {
            void this.revalidate();
            this.followUp = setTimeout(() => void this.revalidate(), FOLLOW_UP_MS);
        }, DEBOUNCE_MS);
    }

    private async revalidate(): Promise<void> {
        try {
            const response = await fetch(new URL('/api/revalidate', this.options.storefrontUrl), {
                method: 'POST',
                headers: { 'x-revalidate-secret': this.options.secret },
            });
            if (!response.ok) {
                throw new Error(`${response.status} ${await response.text()}`);
            }
            Logger.verbose('Storefront catalog cache refreshed', loggerCtx);
        } catch (err: unknown) {
            Logger.warn(`Could not refresh the storefront cache: ${String(err)}`, loggerCtx);
        }
    }
}
