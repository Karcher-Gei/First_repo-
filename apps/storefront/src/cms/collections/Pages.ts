import type { CollectionConfig } from 'payload';

import { seoFields } from '../fields/seo';

/**
 * CMS pages served at /content/{legacyId}-{slug}, the PrestaShop format
 * (e.g. /content/62-devenir-revendeur). New pages get the next free legacyId.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'legacyId', 'slug', 'updatedAt'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'legacyId',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'ID in the URL: /content/{ID}-{slug}. Never change it.' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: { position: 'sidebar', description: 'e.g. devenir-revendeur' },
    },
    { name: 'content', type: 'richText' },
    ...seoFields,
  ],
};
