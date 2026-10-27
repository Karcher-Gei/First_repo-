import { Inject, OnApplicationBootstrap } from '@nestjs/common';
import { EventBus, Logger, OrderPlacedEvent, PluginCommonModule, VendurePlugin } from '@vendure/core';
import { createHash } from 'crypto';

const META_CAPI_OPTIONS = Symbol('META_CAPI_OPTIONS');
const loggerCtx = 'MetaCapiPlugin';

export interface MetaCapiOptions {
    pixelId: string;
    accessToken: string;
    /** Graph API version, e.g. "v21.0". */
    apiVersion?: string;
    /** Minor units per currency unit: 1000 for TND (millimes). */
    minorUnitsPerMajor?: number;
}

/**
 * Sends a server-side "Purchase" event to Meta for every placed order (replaces ps_facebook).
 * event_id is the order code: the storefront pixel must send the same eventID so Meta deduplicates.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [{ provide: META_CAPI_OPTIONS, useFactory: () => MetaCapiPlugin.options }],
    compatibility: '^3.0.0',
})
export class MetaCapiPlugin implements OnApplicationBootstrap {
    static options: MetaCapiOptions;

    static init(options: MetaCapiOptions): typeof MetaCapiPlugin {
        this.options = options;
        return MetaCapiPlugin;
    }

    constructor(
        private readonly eventBus: EventBus,
        @Inject(META_CAPI_OPTIONS) private readonly options: MetaCapiOptions,
    ) {}

    onApplicationBootstrap(): void {
        if (!this.options.pixelId || !this.options.accessToken) {
            Logger.info('META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set; Conversions API disabled', loggerCtx);
            return;
        }
        this.eventBus.ofType(OrderPlacedEvent).subscribe(event => {
            this.sendPurchase(event).catch((err: unknown) =>
                Logger.error(`Purchase event for ${event.order.code} failed: ${String(err)}`, loggerCtx),
            );
        });
    }

    private async sendPurchase({ order }: OrderPlacedEvent): Promise<void> {
        const { pixelId, accessToken, apiVersion = 'v21.0', minorUnitsPerMajor = 1000 } = this.options;
        const email = order.customer?.emailAddress?.trim().toLowerCase();
        const body = {
            data: [
                {
                    event_name: 'Purchase',
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: order.code,
                    action_source: 'website',
                    user_data: { em: email ? [sha256(email)] : [] },
                    custom_data: {
                        currency: order.currencyCode,
                        value: order.totalWithTax / minorUnitsPerMajor,
                        order_id: order.code,
                        num_items: order.totalQuantity,
                    },
                },
            ],
        };
        const response = await fetch(
            `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        );
        if (!response.ok) {
            throw new Error(`${response.status} ${await response.text()}`);
        }
    }
}

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}
