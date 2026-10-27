import { CustomFieldConfig, LanguageCode } from '@vendure/core';

/**
 * PrestaShop identifiers kept on migrated entities, so every old URL can be resolved by ID
 * exactly as PrestaShop does: /{category}/{id}-{slug}-{ean13}.html, /{id}-{slug}, /{imageId}-{size}/{slug}.jpg
 */
declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomProductFields {
        legacyId: number | null;
        ean13: string | null;
        urlCategory: string | null;
    }
    interface CustomCollectionFields {
        legacyId: number | null;
    }
    interface CustomAssetFields {
        legacyImageId: number | null;
    }
}

export const productCustomFields: CustomFieldConfig[] = [
    {
        name: 'legacyId',
        type: 'int',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'ID PrestaShop' },
            { languageCode: LanguageCode.en, value: 'PrestaShop ID' },
        ],
        description: [{ languageCode: LanguageCode.en, value: 'Used in the product URL; never change it.' }],
        ui: { tab: 'SEO' },
    },
    {
        name: 'ean13',
        type: 'string',
        nullable: true,
        public: true,
        label: [{ languageCode: LanguageCode.en, value: 'EAN-13' }],
        description: [{ languageCode: LanguageCode.en, value: 'Appended to the product URL when set.' }],
        ui: { tab: 'SEO' },
    },
    {
        name: 'urlCategory',
        type: 'string',
        nullable: true,
        public: true,
        label: [{ languageCode: LanguageCode.en, value: 'URL category' }],
        description: [
            {
                languageCode: LanguageCode.en,
                value: 'First segment of the product URL (PrestaShop default category slug), e.g. home-garden.',
            },
        ],
        ui: { tab: 'SEO' },
    },
];

export const collectionCustomFields: CustomFieldConfig[] = [
    {
        name: 'legacyId',
        type: 'int',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'ID PrestaShop' },
            { languageCode: LanguageCode.en, value: 'PrestaShop ID' },
        ],
        ui: { tab: 'SEO' },
    },
];

export const assetCustomFields: CustomFieldConfig[] = [
    {
        name: 'legacyImageId',
        type: 'int',
        nullable: true,
        public: true,
        label: [{ languageCode: LanguageCode.en, value: 'PrestaShop image ID' }],
    },
];
