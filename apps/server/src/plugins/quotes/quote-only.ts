import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GlobalFlag } from '@vendure/common/lib/generated-types';
import {
    CustomFieldConfig,
    DefaultStockDisplayStrategy,
    EventBus,
    ID,
    Injector,
    LanguageCode,
    Order,
    OrderInterceptor,
    PriceCalculationResult,
    Product,
    ProductEvent,
    ProductVariant,
    ProductVariantService,
    ProductVariantPriceCalculationArgs,
    RequestContext,
    RequestContextService,
    StockDisplayStrategy,
    TransactionalConnection,
    WillAddItemToOrderInput,
} from '@vendure/core';
// Not exported from the package root.
import { DefaultProductVariantPriceCalculationStrategy } from '@vendure/core/dist/config/catalog/default-product-variant-price-calculation-strategy';
import { IsNull } from 'typeorm';

/**
 * The professional range is sold on quote only: neither its prices nor its stock may reach the
 * public (the Shop API, so the storefront and anything crawling it). The dashboard keeps them.
 */

declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomProductFields {
        quoteOnly: boolean;
    }
}

export const quoteOnlyCustomFields: CustomFieldConfig[] = [
    {
        name: 'quoteOnly',
        type: 'boolean',
        nullable: false,
        defaultValue: false,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Prix sur devis (gamme professionnelle)' },
            { languageCode: LanguageCode.en, value: 'Price on quote (professional range)' },
        ],
        description: [
            {
                languageCode: LanguageCode.en,
                value: 'Price and stock are never shown on the site and the product cannot be added to the cart: shoppers request a quote.',
            },
        ],
    },
];

/** Placeholder for prices and stock the Shop API must not reveal. */
export const QUOTE_ONLY_STOCK_LEVEL = 'ON_REQUEST';

/**
 * Ids of the quote-only products, kept in memory and refreshed when products change. A product
 * flagged quote-only stops tracking inventory, so its stock cannot show through the search's
 * in-stock filter either.
 */
@Injectable()
export class QuoteOnlyService implements OnApplicationBootstrap {
    private ids = new Set<string>();
    private loadedAt = 0;
    private loading: Promise<void> | undefined;

    constructor(
        private readonly connection: TransactionalConnection,
        private readonly requestContextService: RequestContextService,
        private readonly eventBus: EventBus,
        private readonly productVariantService: ProductVariantService,
    ) {}

    onApplicationBootstrap(): void {
        this.eventBus.ofType(ProductEvent).subscribe(event => {
            this.loadedAt = 0;
            if (event.type !== 'deleted' && event.product.customFields?.quoteOnly) {
                void this.stopTrackingInventory(event.ctx, event.product.id);
            }
        });
    }

    private async stopTrackingInventory(ctx: RequestContext, productId: ID): Promise<void> {
        const variants = await this.connection
            .getRepository(ctx, ProductVariant)
            .find({ where: { productId, deletedAt: IsNull() } });
        const tracked = variants.filter(v => v.trackInventory !== GlobalFlag.FALSE);
        if (tracked.length) {
            await this.productVariantService.update(
                ctx,
                tracked.map(v => ({ id: v.id, trackInventory: GlobalFlag.FALSE })),
            );
        }
    }

    async isQuoteOnly(productId: ID | undefined | null): Promise<boolean> {
        if (productId == null) {
            return false;
        }
        // Reloaded after a product change, and every 5 minutes in case a change came from elsewhere.
        if (Date.now() - this.loadedAt > 5 * 60_000) {
            this.loading ??= this.load().finally(() => (this.loading = undefined));
            await this.loading;
        }
        return this.ids.has(String(productId));
    }

    private async load(): Promise<void> {
        const ctx = await this.requestContextService.create({ apiType: 'admin' });
        const rows = await this.connection
            .getRepository(ctx, Product)
            .find({ select: ['id'], where: { customFields: { quoteOnly: true } } });
        this.ids = new Set(rows.map(row => String(row.id)));
        this.loadedAt = Date.now();
    }
}

/**
 * A quote-only variant's price is 0 everywhere but in the dashboard (an Admin API request): in
 * the Shop API, and in background jobs, so the search index never holds it either (no sorting by
 * a hidden price).
 */
export class QuoteOnlyPriceCalculationStrategy extends DefaultProductVariantPriceCalculationStrategy {
    private quoteOnly: QuoteOnlyService;

    init(injector: Injector): void {
        super.init(injector);
        this.quoteOnly = injector.get(QuoteOnlyService);
    }

    async calculate(args: ProductVariantPriceCalculationArgs): Promise<PriceCalculationResult> {
        const result = await super.calculate(args);
        const dashboard = args.ctx.apiType === 'admin' && !!args.ctx.req;
        if (!dashboard && (await this.quoteOnly.isQuoteOnly(args.productVariant?.productId))) {
            return { ...result, price: 0 };
        }
        return result;
    }
}

/** A quote-only variant's stock level is never shown. */
export class QuoteOnlyStockDisplayStrategy implements StockDisplayStrategy {
    private readonly fallback = new DefaultStockDisplayStrategy();
    private quoteOnly: QuoteOnlyService;

    init(injector: Injector): void {
        this.quoteOnly = injector.get(QuoteOnlyService);
    }

    async getStockLevel(ctx: RequestContext, variant: ProductVariant, saleableStockLevel: number): Promise<string> {
        if (ctx.apiType === 'shop' && (await this.quoteOnly.isQuoteOnly(variant.productId))) {
            return QUOTE_ONLY_STOCK_LEVEL;
        }
        return this.fallback.getStockLevel(ctx, variant, saleableStockLevel);
    }
}

/** Quote-only products cannot be bought online. */
export class QuoteOnlyOrderInterceptor implements OrderInterceptor {
    private quoteOnly: QuoteOnlyService;

    init(injector: Injector): void {
        this.quoteOnly = injector.get(QuoteOnlyService);
    }

    async willAddItemToOrder(
        ctx: RequestContext,
        order: Order,
        { productVariant }: WillAddItemToOrderInput,
    ): Promise<string | void> {
        if (await this.quoteOnly.isQuoteOnly(productVariant.productId)) {
            return 'Ce produit de la gamme professionnelle est vendu sur devis : demandez un devis.';
        }
    }
}

type SearchResultPrice = { value: number } | { min: number; max: number };

/**
 * The search index keeps real prices and stock (it is built in the admin context): Shop API
 * search results hide them for quote-only products.
 */
@Resolver('SearchResult')
export class QuoteOnlySearchResultResolver {
    constructor(private readonly quoteOnly: QuoteOnlyService) {}

    @ResolveField()
    async price(@Parent() result: { productId: ID; price: SearchResultPrice }): Promise<SearchResultPrice> {
        return (await this.quoteOnly.isQuoteOnly(result.productId)) ? { value: 0 } : result.price;
    }

    @ResolveField()
    async priceWithTax(
        @Parent() result: { productId: ID; priceWithTax: SearchResultPrice },
    ): Promise<SearchResultPrice> {
        return (await this.quoteOnly.isQuoteOnly(result.productId)) ? { value: 0 } : result.priceWithTax;
    }

    /** Always available on request; the variants do not track inventory either (see QuoteOnlyService). */
    @ResolveField()
    async inStock(@Parent() result: { productId: ID; inStock: boolean }): Promise<boolean> {
        return (await this.quoteOnly.isQuoteOnly(result.productId)) ? true : result.inStock;
    }
}
