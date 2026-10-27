import type { CollectionConfig } from 'payload';

/** Staff accounts for the CMS admin. Shop customers live in Vendure. */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email' },
  auth: true,
  fields: [{ name: 'name', type: 'text' }],
};
