import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export const ADMIN_API = process.env.E2E_ADMIN_API ?? 'http://localhost:3000/admin-api';
export const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'superadmin';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'change-me';
/** Where Vendure's dev mailbox writes e-mails (EmailPlugin devMode). */
export const MAILBOX = path.join(root, 'apps/server/static/email/test-emails');

/** From the PrestaShop fixture (tools/migration/test/fixture.sql). */
export const FC3 = {
  path: '/home-garden/867-aspirateur-laveur-fc-3-4054278634537.html',
  sku: '1.055-300.0',
};
export const K4 = {
  path: '/nettoyeurs-haute-pression/101-nettoyeur-haute-pression-k-4-power-control-4054278800001.html',
};
