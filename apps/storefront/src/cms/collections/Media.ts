import type { CollectionConfig } from 'payload';

/** Images for banners, sliders, pages and posts. Product images are Vendure assets. */
export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Texte alternatif (SEO et accessibilité)' },
    },
  ],
  upload: {
    imageSizes: [
      { name: 'card', width: 640 },
      { name: 'hero', width: 1920 },
    ],
  },
};
