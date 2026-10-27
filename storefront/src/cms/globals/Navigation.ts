import type { Field, GlobalConfig } from 'payload';

const link: Field[] = [
  { name: 'label', type: 'text', required: true },
  { name: 'url', type: 'text', required: true, admin: { description: 'e.g. /12-home-garden' } },
];

/** Header menu and footer columns. Category links point at the legacy category URLs. */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  access: { read: () => true },
  fields: [
    { name: 'header', type: 'array', fields: link },
    {
      name: 'footer',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'links', type: 'array', fields: link },
      ],
    },
  ],
};
