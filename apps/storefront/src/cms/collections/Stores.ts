import type { CollectionConfig } from 'payload';

/** Shops and after-sales centres listed on /magasins (Ben Arous, Menzah 8, ...). */
export const Stores: CollectionConfig = {
  slug: 'stores',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'phone', 'order'] },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'address', type: 'textarea', required: true },
    { name: 'phone', type: 'text' },
    { name: 'openingHours', type: 'textarea', admin: { description: 'e.g. Lundi / Vendredi : 8H00 à 17H30' } },
    { name: 'mapUrl', type: 'text' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
};
