import { Injectable } from '@nestjs/common';
import {
    ID,
    ProductService,
    ProductVariant,
    ProductVariantService,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';
import { IsNull } from 'typeorm';

import { CategoryAssignmentService } from './category-assignment.service';
import { formatDate, formatMoney, headerKey, parseCsv, parseDate, parseMoney, parseYesNo, toCsv } from './csv';

/**
 * Bulk catalog updates from a spreadsheet: the webmaster downloads the catalog as CSV, edits it
 * in Excel and sends it back. Every row is checked and the changes previewed before anything is
 * written. A column left out of the file is not touched.
 */

const COLUMNS = {
    reference: 'Référence',
    produit: 'Produit',
    version: 'Version',
    prixttc: 'Prix TTC',
    prixbarrettc: 'Prix barré TTC',
    'remise%': 'Remise %',
    findepromotion: 'Fin de promotion',
    stock: 'Stock',
    surdevis: 'Sur devis',
    actif: 'Actif',
    categories: 'Catégories',
} as const;
type Column = keyof typeof COLUMNS;

export interface CsvChange {
    field: string;
    from: string;
    to: string;
}

export interface CsvRowReport {
    line: number;
    sku: string;
    product: string | null;
    changes: CsvChange[];
    errors: string[];
}

export interface CsvReport {
    rows: CsvRowReport[];
    changed: number;
    unchanged: number;
    errors: number;
    applied: boolean;
}

interface CatalogVariant {
    id: ID;
    productId: ID;
    sku: string;
    product: string;
    version: string;
    price: number;
    regularPrice: number | null;
    saleEndsAt: Date | null;
    stock: number;
    quoteOnly: boolean;
    enabled: boolean;
}

interface Plan {
    report: CsvReport;
    variants: Array<{ id: ID; price?: number; stockOnHand?: number; customFields?: Record<string, unknown> }>;
    products: Map<string, { enabled?: boolean; quoteOnly?: boolean }>;
    categories: Map<string, string[]>;
}

@Injectable()
export class CatalogCsvService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly productService: ProductService,
        private readonly productVariantService: ProductVariantService,
        private readonly categoryAssignment: CategoryAssignmentService,
    ) {}

    /** The whole catalog, one row per variant, ready to edit and send back. */
    async export(ctx: RequestContext): Promise<string> {
        const [variants, categories] = await Promise.all([this.catalog(ctx), this.categoryAssignment.categories(ctx)]);
        const categoriesOf = (productId: ID) =>
            categories
                .filter(c => c.productIds.has(String(productId)))
                .map(categoryLabel)
                .join(' | ');
        return toCsv([
            Object.values(COLUMNS),
            ...variants.map(v => [
                v.sku,
                v.product,
                v.version,
                formatMoney(v.price),
                v.regularPrice != null ? formatMoney(v.regularPrice) : '',
                '',
                v.saleEndsAt ? formatDate(v.saleEndsAt) : '',
                v.stock,
                v.quoteOnly ? 'oui' : 'non',
                v.enabled ? 'oui' : 'non',
                categoriesOf(v.productId),
            ]),
        ]);
    }

    async preview(ctx: RequestContext, csv: string): Promise<CsvReport> {
        return (await this.plan(ctx, csv)).report;
    }

    /** Applies the rows without errors; the others are reported and left as they are. */
    async apply(ctx: RequestContext, csv: string): Promise<CsvReport> {
        const plan = await this.plan(ctx, csv);
        for (let i = 0; i < plan.variants.length; i += 50) {
            await this.productVariantService.update(ctx, plan.variants.slice(i, i + 50));
        }
        for (const [id, changes] of plan.products) {
            await this.productService.update(ctx, {
                id,
                ...(changes.enabled != null ? { enabled: changes.enabled } : {}),
                ...(changes.quoteOnly != null ? { customFields: { quoteOnly: changes.quoteOnly } } : {}),
            });
        }
        if (plan.categories.size) {
            await this.categoryAssignment.setMemberships(ctx, plan.categories);
        }
        return { ...plan.report, applied: true };
    }

    private async plan(ctx: RequestContext, csv: string): Promise<Plan> {
        const [header, ...lines] = parseCsv(csv);
        const report: CsvReport = { rows: [], changed: 0, unchanged: 0, errors: 0, applied: false };
        const plan: Plan = { report, variants: [], products: new Map(), categories: new Map() };
        if (!header) {
            report.rows.push({ line: 1, sku: '', product: null, changes: [], errors: ['Le fichier est vide.'] });
            report.errors = 1;
            return plan;
        }
        const columns = new Map<Column, number>();
        header.forEach((name, index) => {
            const key = headerKey(name) as Column;
            if (key in COLUMNS) {
                columns.set(key, index);
            }
        });
        if (!columns.has('reference')) {
            report.rows.push({
                line: 1,
                sku: '',
                product: null,
                changes: [],
                errors: ['Colonne « Référence » introuvable : gardez la première ligne du fichier exporté.'],
            });
            report.errors = 1;
            return plan;
        }

        const [variants, categories] = await Promise.all([this.catalog(ctx), this.categoryAssignment.categories(ctx)]);
        const bySku = new Map(variants.map(v => [v.sku.toLowerCase(), v]));
        const productRows = new Map<string, { line: number; enabled?: boolean; quoteOnly?: boolean; categories?: string }>();
        const seen = new Set<string>();

        lines.forEach((cells, index) => {
            const line = index + 2;
            const cell = (column: Column) => {
                const i = columns.get(column);
                return i === undefined ? undefined : (cells[i] ?? '').trim();
            };
            const sku = cell('reference') ?? '';
            const row: CsvRowReport = { line, sku, product: null, changes: [], errors: [] };
            const variant = bySku.get(sku.toLowerCase());
            if (!sku) {
                row.errors.push('Référence vide.');
            } else if (!variant) {
                row.errors.push(`Référence « ${sku} » introuvable dans le catalogue.`);
            } else if (seen.has(variant.sku)) {
                row.errors.push(`Référence « ${sku} » déjà présente plus haut dans le fichier.`);
            }
            if (!variant || row.errors.length) {
                report.rows.push(row);
                report.errors++;
                return;
            }
            seen.add(variant.sku);
            row.product = variant.version ? `${variant.product} (${variant.version})` : variant.product;

            // Product-level values (sur devis, actif, catégories) first: they decide what the prices may be.
            const product = productRows.get(String(variant.productId));
            const quoteOnlyCell = cell('surdevis');
            const quoteOnly = quoteOnlyCell === undefined ? null : parseYesNo(quoteOnlyCell);
            const enabledCell = cell('actif');
            const enabled = enabledCell === undefined ? null : parseYesNo(enabledCell);
            if (quoteOnly === 'invalid') {
                row.errors.push('« Sur devis » : écrivez oui ou non.');
            }
            if (enabled === 'invalid') {
                row.errors.push('« Actif » : écrivez oui ou non.');
            }
            const categoriesCell = cell('categories');
            let categoryIds: string[] | null = null;
            if (categoriesCell) {
                categoryIds = [];
                for (const part of categoriesCell.split(/[|\n]/).map(p => p.trim()).filter(Boolean)) {
                    const legacyId = /^(\d+)/.exec(part)?.[1];
                    const found = categories.find(c =>
                        legacyId ? c.legacyId === Number(legacyId) : c.name.toLowerCase() === part.toLowerCase(),
                    );
                    if (found) {
                        categoryIds.push(String(found.id));
                    } else {
                        row.errors.push(`Catégorie « ${part} » introuvable.`);
                    }
                }
            }
            if (product) {
                // Several versions of one product: their product-level cells must agree.
                const differs =
                    (typeof quoteOnly === 'boolean' && product.quoteOnly != null && quoteOnly !== product.quoteOnly) ||
                    (typeof enabled === 'boolean' && product.enabled != null && enabled !== product.enabled) ||
                    (categoriesCell && product.categories != null && categoriesCell !== product.categories);
                if (differs) {
                    row.errors.push(
                        `« Sur devis », « Actif » et « Catégories » valent pour tout le produit : mettez les mêmes valeurs qu’à la ligne ${product.line}.`,
                    );
                }
            }
            const isQuoteOnly = typeof quoteOnly === 'boolean' ? quoteOnly : variant.quoteOnly;

            // Prices: the regular price (struck through) and the discount decide the price when given.
            const priceCell = cell('prixttc');
            const regularCell = cell('prixbarrettc');
            const discountCell = cell('remise%');
            const endCell = cell('findepromotion');
            let price = variant.price;
            if (priceCell) {
                const parsed = parseMoney(priceCell);
                if (parsed == null || parsed <= 0) {
                    row.errors.push(`« Prix TTC » : « ${priceCell} » n’est pas un prix (exemple : 1311,125).`);
                } else {
                    price = parsed;
                }
            }
            let regularPrice = variant.regularPrice;
            if (regularCell !== undefined) {
                if (!regularCell || regularCell === '0') {
                    regularPrice = null;
                } else {
                    const parsed = parseMoney(regularCell);
                    if (parsed == null) {
                        row.errors.push(`« Prix barré TTC » : « ${regularCell} » n’est pas un prix.`);
                    } else {
                        regularPrice = parsed;
                    }
                }
            }
            if (discountCell) {
                const percent = Number(discountCell.replace(',', '.').replace('%', ''));
                if (!(percent > 0 && percent < 100)) {
                    row.errors.push(`« Remise % » : « ${discountCell} » doit être un nombre entre 1 et 99.`);
                } else {
                    regularPrice ??= variant.price;
                    price = Math.round(regularPrice * (1 - percent / 100));
                }
            }
            let saleEndsAt = variant.saleEndsAt;
            if (endCell !== undefined) {
                if (!endCell) {
                    saleEndsAt = null;
                } else {
                    const parsed = parseDate(endCell);
                    if (!parsed) {
                        row.errors.push(`« Fin de promotion » : « ${endCell} » n’est pas une date (exemple : 31/12/2026).`);
                    } else if (parsed < new Date()) {
                        row.errors.push(`« Fin de promotion » : le ${endCell} est déjà passé.`);
                    } else {
                        saleEndsAt = parsed;
                    }
                }
            }
            if (regularPrice == null) {
                saleEndsAt = null;
            } else if (regularPrice <= price) {
                row.errors.push('Le prix barré doit être supérieur au prix TTC (ou vide s’il n’y a pas de promotion).');
            } else if (isQuoteOnly) {
                row.errors.push('Produit sur devis : pas de promotion (videz « Prix barré TTC »).');
            }

            const stockCell = cell('stock');
            let stock = variant.stock;
            if (stockCell) {
                if (!/^\d+$/.test(stockCell)) {
                    row.errors.push(`« Stock » : « ${stockCell} » doit être un nombre entier.`);
                } else {
                    stock = Number(stockCell);
                }
            }

            if (row.errors.length) {
                report.rows.push(row);
                report.errors++;
                return;
            }

            // What changes, for the preview and for the update.
            const change = (field: string, from: string, to: string) => {
                if (from !== to) {
                    row.changes.push({ field, from, to });
                }
            };
            const money = (value: number | null) => (value == null ? '—' : `${formatMoney(value)} DT`);
            change('Prix TTC', money(variant.price), money(price));
            change('Prix barré TTC', money(variant.regularPrice), money(regularPrice));
            change(
                'Fin de promotion',
                variant.saleEndsAt ? formatDate(variant.saleEndsAt) : '—',
                saleEndsAt ? formatDate(saleEndsAt) : '—',
            );
            change('Stock', String(variant.stock), String(stock));
            const variantUpdate: Plan['variants'][number] = { id: variant.id };
            if (price !== variant.price) {
                variantUpdate.price = price;
            }
            if (stock !== variant.stock) {
                variantUpdate.stockOnHand = stock;
            }
            if (
                regularPrice !== variant.regularPrice ||
                (saleEndsAt?.getTime() ?? null) !== (variant.saleEndsAt?.getTime() ?? null)
            ) {
                variantUpdate.customFields = { regularPrice, saleEndsAt };
            }
            if (Object.keys(variantUpdate).length > 1) {
                plan.variants.push(variantUpdate);
            }

            if (!product) {
                const productChanges: { enabled?: boolean; quoteOnly?: boolean } = {};
                if (typeof quoteOnly === 'boolean' && quoteOnly !== variant.quoteOnly) {
                    change('Sur devis', variant.quoteOnly ? 'oui' : 'non', quoteOnly ? 'oui' : 'non');
                    productChanges.quoteOnly = quoteOnly;
                }
                if (typeof enabled === 'boolean' && enabled !== variant.enabled) {
                    change('Actif', variant.enabled ? 'oui' : 'non', enabled ? 'oui' : 'non');
                    productChanges.enabled = enabled;
                }
                if (Object.keys(productChanges).length) {
                    plan.products.set(String(variant.productId), productChanges);
                }
                if (categoryIds) {
                    const current = categories.filter(c => c.productIds.has(String(variant.productId)));
                    const next = categories.filter(c => categoryIds.includes(String(c.id)));
                    const label = (list: typeof categories) => list.map(categoryLabel).join(' | ') || '—';
                    if (label(current) !== label(next)) {
                        change('Catégories', label(current), label(next));
                        plan.categories.set(String(variant.productId), categoryIds);
                    }
                }
                productRows.set(String(variant.productId), {
                    line,
                    quoteOnly: typeof quoteOnly === 'boolean' ? quoteOnly : undefined,
                    enabled: typeof enabled === 'boolean' ? enabled : undefined,
                    categories: categoriesCell || undefined,
                });
            }

            if (row.changes.length) {
                report.rows.push(row);
                report.changed++;
            } else {
                report.unchanged++;
            }
        });
        return plan;
    }

    /** Every variant with what the CSV shows of it; prices as the dashboard sees them. */
    private async catalog(ctx: RequestContext): Promise<CatalogVariant[]> {
        const variants = await this.connection.getRepository(ctx, ProductVariant).find({
            where: { deletedAt: IsNull(), product: { deletedAt: IsNull() } },
            relations: {
                translations: true,
                product: { translations: true },
                productVariantPrices: true,
                stockLevels: true,
                options: { translations: true },
            },
            order: { productId: 'ASC', id: 'ASC' },
        });
        const translated = <T extends { languageCode: string }>(list: T[]) =>
            list.find(t => t.languageCode === ctx.languageCode) ?? list[0];
        return variants.map(v => {
            const price =
                v.productVariantPrices.find(p => String(p.channelId) === String(ctx.channelId))?.price ??
                v.productVariantPrices[0]?.price ??
                0;
            const custom = v.customFields as { regularPrice?: number | null; saleEndsAt?: Date | null };
            return {
                id: v.id,
                productId: v.productId,
                sku: v.sku,
                product: translated(v.product.translations)?.name ?? '',
                version: v.options.map(o => translated(o.translations)?.name ?? o.code).join(' / '),
                price,
                regularPrice: custom.regularPrice ?? null,
                saleEndsAt: custom.saleEndsAt ? new Date(custom.saleEndsAt) : null,
                stock: v.stockLevels.reduce((sum, level) => sum + level.stockOnHand, 0),
                quoteOnly: Boolean((v.product.customFields as { quoteOnly?: boolean }).quoteOnly),
                enabled: v.product.enabled,
            };
        });
    }
}

/** "13 Nettoyeurs haute pression": the id the CSV reads back, and the name to recognise it. */
function categoryLabel(category: { legacyId: number | null; name: string }): string {
    return category.legacyId != null ? `${category.legacyId} ${category.name}` : category.name;
}
