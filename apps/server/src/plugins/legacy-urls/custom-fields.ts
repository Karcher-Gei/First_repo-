import { CustomFieldConfig, LanguageCode } from '@vendure/core';

/**
 * PrestaShop identifiers kept on migrated entities, so every old URL can be resolved by ID
 * exactly as PrestaShop does: /{category}/{id}-{slug}-{ean13}.html, /{id}-{slug}, /{imageId}-{size}/{slug}.jpg,
 * and brands (values of the "marque" facet) at /{id}_{slug}
 */
declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomProductFields {
        legacyId: number | null;
        ean13: string | null;
        urlCategory: string | null;
    }
    interface CustomProductFieldsTranslation {
        metaTitle: string | null;
        metaDescription: string | null;
    }
    interface CustomCollectionFields {
        legacyId: number | null;
    }
    interface CustomCollectionFieldsTranslation {
        metaTitle: string | null;
        metaDescription: string | null;
    }
    interface CustomAssetFields {
        legacyImageId: number | null;
        alt: string | null;
    }
    interface CustomFacetValueFields {
        legacyManufacturerId: number | null;
    }
    interface CustomFacetValueFieldsTranslation {
        description: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
    }
}

/** Meta title and description, migrated word for word from PrestaShop; the page falls back to the name and description. */
const seoCustomFields: CustomFieldConfig[] = [
    {
        name: 'metaTitle',
        type: 'localeString',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Balise titre' },
            { languageCode: LanguageCode.en, value: 'Meta title' },
        ],
        description: [{ languageCode: LanguageCode.en, value: 'Max ~60 characters.' }],
        ui: { tab: 'SEO' },
    },
    {
        name: 'metaDescription',
        type: 'localeText',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Méta description' },
            { languageCode: LanguageCode.en, value: 'Meta description' },
        ],
        description: [{ languageCode: LanguageCode.en, value: 'Max ~155 characters.' }],
        ui: { tab: 'SEO' },
    },
];

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
    ...seoCustomFields,
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
    ...seoCustomFields,
];

export const assetCustomFields: CustomFieldConfig[] = [
    {
        name: 'legacyImageId',
        type: 'int',
        nullable: true,
        public: true,
        label: [{ languageCode: LanguageCode.en, value: 'PrestaShop image ID' }],
    },
    {
        name: 'alt',
        type: 'string',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Texte alternatif' },
            { languageCode: LanguageCode.en, value: 'Alt text' },
        ],
        description: [
            {
                languageCode: LanguageCode.en,
                value: 'Describes the image for search engines and screen readers (PrestaShop legend). Empty: the product name.',
            },
        ],
    },
];

/** Brands are values of the "marque" facet; PrestaShop manufacturers keep their ID for /{id}_{slug}. */
export const facetValueCustomFields: CustomFieldConfig[] = [
    {
        name: 'legacyManufacturerId',
        type: 'int',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'ID marque PrestaShop' },
            { languageCode: LanguageCode.en, value: 'PrestaShop manufacturer ID' },
        ],
        description: [{ languageCode: LanguageCode.en, value: 'Used in the brand URL; never change it.' }],
        ui: { tab: 'SEO' },
    },
    {
        name: 'description',
        type: 'localeText',
        nullable: true,
        public: true,
        label: [{ languageCode: LanguageCode.en, value: 'Description' }],
        ui: { tab: 'SEO' },
    },
    ...seoCustomFields,
];
