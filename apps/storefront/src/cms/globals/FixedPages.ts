import type { GlobalConfig } from 'payload';

/** Fixed pages kept from PrestaShop, by the storefront's key for each (see /s/[page]). */
export const FIXED_PAGES = [
  { value: 'prices-drop', label: 'Promotions (/promotions)' },
  { value: 'best-sales', label: 'Meilleures ventes (/meilleures-ventes)' },
  { value: 'new-products', label: 'Nouveaux produits (/nouveaux-produits)' },
  { value: 'contact', label: 'Nous contacter (/nous-contacter)' },
  { value: 'stores', label: 'Nos magasins (/magasins)' },
  { value: 'brands', label: 'Marques (/brands)' },
  { value: 'discount', label: 'Réductions (/reduction)' },
];

/** Meta tags of the fixed pages, migrated from PrestaShop (Préférences > Trafic & SEO). */
export const FixedPages: GlobalConfig = {
  slug: 'fixed-pages',
  label: 'Pages fixes (SEO)',
  access: { read: () => true },
  fields: [
    {
      name: 'pages',
      type: 'array',
      admin: { description: 'A page without an entry here uses its default title.' },
      fields: [
        { name: 'page', type: 'select', required: true, options: FIXED_PAGES },
        { name: 'title', type: 'text', admin: { description: 'Max ~60 characters' } },
        { name: 'description', type: 'textarea', admin: { description: 'Max ~155 characters' } },
      ],
    },
  ],
};
