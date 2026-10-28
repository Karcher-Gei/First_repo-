import { CustomFieldConfig, LanguageCode } from '@vendure/core';

/**
 * PrestaShop identifiers kept on migrated entities, so every old URL can be resolved by ID
 * exactly as PrestaShop does: /{category}/{id}-{slug}-{ean13}.html, /{id}-{slug}, /{imageId}-{size}/{slug}.jpg,
 * and brands (values of the "marque" facet) at /brand/{id}-{slug}. The URL keeps PrestaShop's slug
 * (urlSlug): Vendure makes slugs unique, and two PrestaShop categories may share one.
 */
declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomProductFields {
        legacyId: number | null;
        ean13: string | null;
        urlCategory: string | null;
        urlSlug: string | null;
        defaultCategoryId: number | null;
    }
    interface CustomProductFieldsTranslation {
        metaTitle: string | null;
        metaDescription: string | null;
    }
    interface CustomCollectionFields {
        legacyId: number | null;
        urlSlug: string | null;
        hideFromMenu: boolean;
    }
    interface CustomCollectionFieldsTranslation {
        metaTitle: string | null;
        metaDescription: string | null;
        menuLabel: string | null;
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

/** The slug of the URL, when it must differ from Vendure's own (unique) slug. */
const urlSlugField: CustomFieldConfig = {
    name: 'urlSlug',
    type: 'string',
    nullable: true,
    public: true,
    label: [
        { languageCode: LanguageCode.fr, value: 'Slug de l’URL' },
        { languageCode: LanguageCode.en, value: 'URL slug' },
    ],
    description: [
        {
            languageCode: LanguageCode.fr,
            value: 'Le slug de l’adresse de la page, repris de PrestaShop. Vide : le slug ci-dessus.',
        },
        {
            languageCode: LanguageCode.en,
            value: 'Slug of the page URL, kept from PrestaShop (two categories may share one). Empty: the slug above.',
        },
    ],
    ui: { tab: 'SEO' },
};

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
    urlSlugField,
    {
        name: 'defaultCategoryId',
        type: 'int',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Catégorie principale (ID PrestaShop)' },
            { languageCode: LanguageCode.en, value: 'Main category (PrestaShop ID)' },
        ],
        description: [
            { languageCode: LanguageCode.en, value: 'The category of the breadcrumb and of the URL.' },
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
    urlSlugField,
    {
        name: 'menuLabel',
        type: 'localeString',
        nullable: true,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Nom dans le menu' },
            { languageCode: LanguageCode.en, value: 'Menu label' },
        ],
        description: [
            {
                languageCode: LanguageCode.fr,
                value: 'Nom court affiché dans le menu et le fil d’Ariane. Vide : le nom de la catégorie.',
            },
        ],
    },
    {
        name: 'hideFromMenu',
        type: 'boolean',
        nullable: false,
        defaultValue: false,
        public: true,
        label: [
            { languageCode: LanguageCode.fr, value: 'Cacher du menu' },
            { languageCode: LanguageCode.en, value: 'Hide from menu' },
        ],
        description: [
            {
                languageCode: LanguageCode.fr,
                value: 'La page de la catégorie reste en ligne, mais n’apparaît ni dans le menu ni dans les tuiles de catégories.',
            },
        ],
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
