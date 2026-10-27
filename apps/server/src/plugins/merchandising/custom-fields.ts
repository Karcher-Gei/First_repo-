import { CustomFieldConfig, LanguageCode } from '@vendure/core';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomProductVariantFields {
        regularPrice: number | null;
        saleEndsAt: Date | null;
    }
    interface CustomProductFields {
        addedAt: Date | null;
        unitsSold: number;
    }
}

/**
 * A sale: the variant's price is the sale price, `regularPrice` the price it had before (shown
 * struck through), and `saleEndsAt` when the regular price comes back (see endSalesTask).
 */
export const variantCustomFields: CustomFieldConfig[] = [
    {
        name: 'regularPrice',
        type: 'int',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Prix barré (TTC, millimes)' },
            { languageCode: LanguageCode.en, value: 'Regular price (with tax, millimes)' },
        ],
        description: [
            {
                languageCode: LanguageCode.en,
                value: 'Set to put the variant on sale: the price above is the sale price, this one is shown struck through. Empty: no sale.',
            },
        ],
        ui: { tab: 'Promotion' },
    },
    {
        name: 'saleEndsAt',
        type: 'datetime',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Fin de la promotion' },
            { languageCode: LanguageCode.en, value: 'Sale ends at' },
        ],
        description: [
            {
                languageCode: LanguageCode.en,
                value: 'The regular price is restored automatically at this date. Empty: the sale runs until removed.',
            },
        ],
        ui: { tab: 'Promotion' },
    },
];

/** For /nouveaux-produits and /meilleures-ventes, as PrestaShop builds them. */
export const productCustomFields: CustomFieldConfig[] = [
    {
        name: 'addedAt',
        type: 'datetime',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Date d’ajout' },
            { languageCode: LanguageCode.en, value: 'Added at' },
        ],
        description: [
            { languageCode: LanguageCode.en, value: 'Newest first on /nouveaux-produits (PrestaShop date_add).' },
        ],
        ui: { tab: 'Promotion' },
    },
    {
        name: 'unitsSold',
        type: 'int',
        nullable: false,
        defaultValue: 0,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Quantité vendue' },
            { languageCode: LanguageCode.en, value: 'Units sold' },
        ],
        description: [
            { languageCode: LanguageCode.en, value: 'Best sellers first on /meilleures-ventes (PrestaShop sales).' },
        ],
        ui: { tab: 'Promotion' },
    },
];
