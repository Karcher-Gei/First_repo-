import type { Block } from 'payload';

/** Homepage building blocks, replacing Visual Composer, Revolution Slider and the image slider. */

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
      name: 'collectionSlug',
      type: 'text',
      required: true,
      admin: { description: 'Slug of the Vendure collection to show, e.g. promotions' },
    },
    { name: 'limit', type: 'number', defaultValue: 6, min: 1, max: 24 },
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

export const homepageBlocks: Block[] = [HeroSliderBlock, ProductCarouselBlock, BannerBlock, RichTextBlock];
