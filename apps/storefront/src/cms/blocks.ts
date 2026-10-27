import type { Block } from 'payload';

/**
 * Homepage building blocks, replacing Visual Composer, Revolution Slider and the image slider.
 * Without any block, the homepage shows DEFAULT_HOMEPAGE (components/blocks/RenderBlocks.tsx).
 */

export const HeroSliderBlock: Block = {
  slug: 'heroSlider',
  interfaceName: 'HeroSliderBlock',
  labels: { singular: 'Slider', plural: 'Sliders' },
  fields: [
    {
      name: 'slides',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'heading', type: 'text' },
        { name: 'link', type: 'text', admin: { description: 'e.g. /promotions' } },
      ],
    },
  ],
};

export const ProductCarouselBlock: Block = {
  slug: 'productCarousel',
  interfaceName: 'ProductCarouselBlock',
  labels: { singular: 'Product carousel', plural: 'Product carousels' },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'e.g. PROMOTIONS, COUP DE CŒUR' } },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'collection',
      options: [
        { value: 'collection', label: 'A Vendure collection' },
        { value: 'best-sellers', label: 'Best sellers' },
        { value: 'newest', label: 'New products' },
        { value: 'catalog', label: 'A selection from the whole catalog' },
      ],
    },
    {
      name: 'collectionSlug',
      type: 'text',
      admin: {
        description: 'Slug of the Vendure collection, e.g. promotions or coup-de-coeur',
        condition: (_, siblingData) => siblingData?.source === 'collection',
      },
      validate: (value: unknown, { siblingData }: { siblingData: { source?: string } }) =>
        siblingData.source !== 'collection' || Boolean(value) || 'Required for a collection',
    },
    { name: 'link', type: 'text', admin: { description: '"Tout voir" link, e.g. /promotions' } },
    { name: 'limit', type: 'number', defaultValue: 8, min: 1, max: 24 },
  ],
};

export const BannerBlock: Block = {
  slug: 'banner',
  interfaceName: 'BannerBlock',
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'link', type: 'text' },
  ],
};

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  fields: [{ name: 'content', type: 'richText', required: true }],
};

// The designed sections of the default homepage (components/home/sections.tsx).

export const HomeHeroBlock: Block = {
  slug: 'homeHero',
  interfaceName: 'HomeHeroBlock',
  labels: { singular: 'Kärcher hero', plural: 'Kärcher heroes' },
  fields: [
    { name: 'heading', type: 'text', admin: { description: 'Empty: "La puissance du nettoyage"' } },
    { name: 'text', type: 'textarea' },
  ],
};

export const UniversesBlock: Block = {
  slug: 'universes',
  interfaceName: 'UniversesBlock',
  labels: { singular: 'Home / professional tiles', plural: 'Home / professional tiles' },
  fields: [],
};

export const CategoryGridBlock: Block = {
  slug: 'categoryGrid',
  interfaceName: 'CategoryGridBlock',
  labels: { singular: 'Category tiles', plural: 'Category tiles' },
  fields: [{ name: 'title', type: 'text', admin: { description: 'Empty: "Nos catégories"' } }],
};

export const ProBannerBlock: Block = {
  slug: 'proBanner',
  interfaceName: 'ProBannerBlock',
  labels: { singular: 'Professional quote banner', plural: 'Professional quote banners' },
  fields: [],
};

export const ServicesBlock: Block = {
  slug: 'services',
  interfaceName: 'ServicesBlock',
  labels: { singular: 'Service highlights', plural: 'Service highlights' },
  fields: [],
};

export const AfterSalesBlock: Block = {
  slug: 'afterSales',
  interfaceName: 'AfterSalesBlock',
  labels: { singular: 'Warranty and after-sales', plural: 'Warranty and after-sales' },
  fields: [],
};

export const homepageBlocks: Block[] = [
  HomeHeroBlock,
  HeroSliderBlock,
  UniversesBlock,
  ProductCarouselBlock,
  CategoryGridBlock,
  ProBannerBlock,
  ServicesBlock,
  AfterSalesBlock,
  BannerBlock,
  RichTextBlock,
];
