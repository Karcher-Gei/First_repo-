import { LanguageCode } from '@vendure/common/lib/generated-types';
import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/dashboard',
    build: {
        outDir: join(__dirname, 'dist/dashboard'),
    },
    plugins: [
        vendureDashboardPlugin({
            // Scans the Vendure config for plugins with dashboard extensions and
            // introspects the Admin API schema (custom fields, plugin extensions).
            vendureConfigPath: pathToFileURL('./src/vendure-config.ts'),
            // In production the dashboard derives the API URL from the server that serves it.
            api:
                process.env.NODE_ENV === 'production'
                    ? { host: 'auto', port: 'auto' }
                    : { host: 'http://localhost', port: 3000 },
            gqlOutputPath: './src/gql',
            // The team works in French; each user can still switch to English in the dashboard.
            i18n: {
                defaultLanguage: LanguageCode.fr,
                defaultLocale: 'fr-TN',
                availableLanguages: [LanguageCode.fr, LanguageCode.en],
                availableLocales: ['fr-TN', 'en-GB'],
            },
        }),
    ],
    resolve: {
        alias: {
            '@/gql': resolve(__dirname, './src/gql/graphql.ts'),
        },
    },
});
