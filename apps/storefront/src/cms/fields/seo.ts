import type { Field } from 'payload';

/** Meta title and description, migrated word for word from PrestaShop at launch. */
export const seoFields: Field[] = [
  {
    name: 'meta',
    type: 'group',
    admin: { position: 'sidebar' },
    fields: [
      { name: 'title', type: 'text', admin: { description: 'Max ~60 characters' } },
      { name: 'description', type: 'textarea', admin: { description: 'Max ~155 characters' } },
    ],
  },
];
