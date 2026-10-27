import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

import { Media } from './cms/collections/Media';
import { Pages } from './cms/collections/Pages';
import { Posts } from './cms/collections/Posts';
import { Stores } from './cms/collections/Stores';
import { Users } from './cms/collections/Users';
import { FixedPages } from './cms/globals/FixedPages';
import { Homepage } from './cms/globals/Homepage';
import { Navigation } from './cms/globals/Navigation';
import { migrations } from './migrations';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Content the Karcher GEI team edits: homepage blocks, CMS pages, blog, stores, menus.
 * Products, prices, stock and orders live in Vendure, never here.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, 'app/(payload)/admin-cms/importMap.js'),
    },
    meta: { titleSuffix: ' - Karcher GEI' },
  },
  routes: {
    // /admin is left free; Vendure's own dashboard is served by the Vendure server.
    admin: '/admin-cms',
  },
  collections: [Users, Media, Pages, Posts, Stores],
  globals: [Homepage, Navigation, FixedPages],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Schema changes go through migrations everywhere, as for Vendure: after editing a collection
    // or global, `pnpm migrate:create <name>`, then `pnpm migrate`. Production runs them on start.
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  sharp,
});
