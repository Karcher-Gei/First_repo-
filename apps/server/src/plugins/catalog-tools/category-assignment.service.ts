import { Injectable } from '@nestjs/common';
import { Collection, CollectionService, ID, RequestContext, TransactionalConnection } from '@vendure/core';

/** A category as the product page's "Catégories" block and the CSV show it. */
export interface ProductCategory {
    id: ID;
    name: string;
    parentId: ID | null;
    /** PrestaShop id, in the category URL (/13-nettoyeurs-haute-pression). */
    legacyId: number | null;
    depth: number;
    assigned: boolean;
}

const PRODUCT_ID_FILTER = 'product-id-filter';

/**
 * Categories are collections listing hand-picked products (the "product-id-filter", as the
 * import creates them). This puts a product in or out of them, the way PrestaShop's category
 * tree does on its product page. Automatic collections (Promotions, filters on facets) are left
 * out: their content follows their rules.
 */
@Injectable()
export class CategoryAssignmentService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly collectionService: CollectionService,
    ) {}

    /** Every hand-picked category in tree order, with the given products' membership. */
    async categories(ctx: RequestContext): Promise<Array<Omit<ProductCategory, 'assigned'> & { productIds: Set<string> }>> {
        const collections = await this.connection.getRepository(ctx, Collection).find({
            where: { isRoot: false },
            relations: { translations: true },
            order: { position: 'ASC' },
        });
        const byId = new Map(collections.map(c => [String(c.id), c]));
        const depthOf = (c: Collection): number => {
            const parent = c.parentId != null ? byId.get(String(c.parentId)) : undefined;
            return parent ? depthOf(parent) + 1 : 0;
        };
        const manageable = collections.filter(c =>
            c.filters.every(f => f.code === PRODUCT_ID_FILTER),
        );
        const rows = manageable.map(c => ({
            id: c.id,
            name: (c.translations.find(t => t.languageCode === ctx.languageCode) ?? c.translations[0])?.name ?? '',
            parentId: c.parentId != null && byId.has(String(c.parentId)) ? c.parentId : null,
            legacyId: (c.customFields as { legacyId?: number | null }).legacyId ?? null,
            depth: depthOf(c),
            productIds: new Set(productIdsOf(c)),
        }));
        // Parents before children, siblings in their order.
        const ordered: typeof rows = [];
        const visit = (parentId: ID | null) => {
            for (const row of rows.filter(r => String(r.parentId) === String(parentId))) {
                ordered.push(row);
                visit(row.id);
            }
        };
        visit(null);
        return ordered;
    }

    async productCategories(ctx: RequestContext, productId: ID): Promise<ProductCategory[]> {
        return (await this.categories(ctx)).map(({ productIds, ...category }) => ({
            ...category,
            assigned: productIds.has(String(productId)),
        }));
    }

    /** Puts the product in exactly these categories (among the hand-picked ones). */
    async setProductCategories(ctx: RequestContext, productId: ID, collectionIds: ID[]): Promise<ProductCategory[]> {
        await this.setMemberships(ctx, new Map([[String(productId), collectionIds.map(String)]]));
        return this.productCategories(ctx, productId);
    }

    /**
     * Puts each product in exactly the given categories, writing each changed category once (a
     * CSV can move many products). Returns the number of categories changed.
     */
    async setMemberships(ctx: RequestContext, wanted: Map<string, string[]>): Promise<number> {
        let changed = 0;
        for (const category of await this.categories(ctx)) {
            const ids = new Set(category.productIds);
            for (const [productId, collectionIds] of wanted) {
                if (collectionIds.includes(String(category.id))) {
                    ids.add(productId);
                } else {
                    ids.delete(productId);
                }
            }
            if (ids.size === category.productIds.size && [...ids].every(id => category.productIds.has(id))) {
                continue;
            }
            await this.collectionService.update(ctx, {
                id: category.id,
                filters: ids.size
                    ? [
                          {
                              code: PRODUCT_ID_FILTER,
                              arguments: [
                                  { name: 'productIds', value: JSON.stringify([...ids]) },
                                  { name: 'combineWithAnd', value: 'true' },
                              ],
                          },
                      ]
                    : [],
            });
            changed++;
        }
        return changed;
    }
}

function productIdsOf(collection: Collection): string[] {
    const filter = collection.filters.find(f => f.code === PRODUCT_ID_FILTER);
    const value = filter?.args.find(a => a.name === 'productIds')?.value;
    try {
        return value ? (JSON.parse(value) as Array<string | number>).map(String) : [];
    } catch {
        return [];
    }
}
