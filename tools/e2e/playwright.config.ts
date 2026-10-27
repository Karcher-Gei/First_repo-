import { defineConfig } from '@playwright/test';

/**
 * Runs against a running stack (`pnpm dev`) loaded with the PrestaShop test fixture: see the
 * "Browser tests" section of the README. The Konnect mock is started here; the Vendure server
 * must point at it (KONNECT_API_URL=http://localhost:4010/api/v2 in apps/server/.env).
 */
export default defineConfig({
  testDir: './specs',
  globalSetup: './support/global-setup.ts',
  // The specs share one Vendure database (stock, mailbox); one at a time keeps them independent.
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node support/konnect-mock.cjs',
    port: 4010,
    reuseExistingServer: true,
  },
});
