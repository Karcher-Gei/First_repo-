import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { CollectionEvent, EventBus, ID, Logger, ProductEvent, TransactionalConnection } from '@vendure/core';

const loggerCtx = 'LegacyUrlsPlugin';

/**
 * Selections shown on fixed pages and the homepage, not categories: they keep no id, so they
 * stay out of the category menu and the sitemap (see setup-channel.mjs and the homepage import).
 */
const UNLISTED_COLLECTIONS = ['promotions', 'coup-de-coeur'];

/**
 * New ids start above any PrestaShop id, so a new item never takes the URL of an old product or
 * category that was deleted or not migrated (its URL must keep answering 404).
 */
const FIRST_NEW_ID = 10001;

/**
 * URLs are built from the PrestaShop id (/{category}/{id}-{slug}.html, /{id}-{slug}). A product
 * or category created in the dashboard after the migration gets the next free one (from 10001), so
 * it has a URL at once without anyone filling the field by hand.
 */
@Injectable()
export class LegacyIdAssigner implements OnApplicationBootstrap {
    constructor(
        private readonly eventBus: EventBus,
        private readonly connection: TransactionalConnection,
    ) {}

    onApplicationBootstrap(): void {
        this.eventBus.ofType(ProductEvent).subscribe(event => {
            if (event.type !== 'deleted' && event.product.customFields?.legacyId == null) {
                void this.assign('product', event.product.id);
            }
        });
        this.eventBus.ofType(CollectionEvent).subscribe(event => {
            const collection = event.entity;
            const slug = collection.translations?.[0]?.slug;
            if (
                event.type !== 'deleted' &&
                !collection.isRoot &&
                collection.customFields?.legacyId == null &&
                !(slug && UNLISTED_COLLECTIONS.includes(slug))
            ) {
                void this.assign('collection', collection.id);
            }
        });
    }

    /** One statement, so two items created together cannot both take the same id. */
    private async assign(table: 'product' | 'collection', id: ID): Promise<void> {
        try {
            const result: unknown = await this.connection.rawConnection.query(
                `UPDATE "${table}" SET "customFieldsLegacyid" =
                   (SELECT GREATEST(MAX("customFieldsLegacyid"), ${FIRST_NEW_ID - 1}) + 1 FROM "${table}")
                 WHERE id = $1 AND "customFieldsLegacyid" IS NULL
                 RETURNING "customFieldsLegacyid" AS "legacyId"`,
                [id],
            );
            // Postgres answers an UPDATE ... RETURNING with [rows, count].
            const rows = (Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result) as Array<{
                legacyId: number;
            }>;
            if (rows[0]) {
                Logger.info(`New ${table} ${String(id)} gets URL id ${rows[0].legacyId}`, loggerCtx);
            }
        } catch (error) {
            Logger.error(`Could not give ${table} ${String(id)} a URL id: ${String(error)}`, loggerCtx);
        }
    }
}
