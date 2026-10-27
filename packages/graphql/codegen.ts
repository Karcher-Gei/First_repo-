import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Generates typed documents for every `graphql(...)` call in the storefront.
 * Needs the Vendure server running: `pnpm --filter @karcher/server dev`, then `pnpm codegen`.
 */
const config: CodegenConfig = {
  schema: process.env.VENDURE_SHOP_API_URL ?? 'http://localhost:3000/shop-api',
  documents: ['../../apps/storefront/src/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    './src/generated/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        scalars: { DateTime: 'string', JSON: 'Record<string, unknown>', Money: 'number' },
      },
    },
  },
};

export default config;
