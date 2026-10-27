import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
} from '@vendure/core';
import { EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';

import { TndMoneyStrategy } from './config/tnd-money-strategy';
import { KarcherEmailGenerator } from './email/generator';
import { karcherEmailHandlers } from './email/handlers';
import { CatalogToolsPlugin } from './plugins/catalog-tools/catalog-tools.plugin';
import { FormsPlugin } from './plugins/forms/forms.plugin';
import { KonnectPaymentPlugin } from './plugins/konnect-payment/konnect-payment.plugin';
import { LegacyUrlsPlugin } from './plugins/legacy-urls/legacy-urls.plugin';
import { MerchandisingPlugin } from './plugins/merchandising/merchandising.plugin';
import { MetaCapiPlugin } from './plugins/meta-capi/meta-capi.plugin';
import { QuotesPlugin } from './plugins/quotes/quotes.plugin';
import { StorefrontCachePlugin } from './plugins/storefront-cache/storefront-cache.plugin';
import { WarrantyPlugin } from './plugins/warranty/warranty.plugin';

const IS_DEV = process.env.APP_ENV === 'dev';
// PORT wins because hosting platforms inject it at runtime.
const serverPort = +process.env.PORT || +process.env.VENDURE_SERVER_PORT || 3000;
const storefrontUrl = process.env.STOREFRONT_URL || 'http://localhost:3001';
const serverPublicUrl = process.env.SERVER_PUBLIC_URL || `http://localhost:${serverPort}`;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        // In dev any origin is reflected; in production only CORS_ORIGINS may call the APIs.
        cors: {
            origin: IS_DEV
                ? true
                : (process.env.CORS_ORIGINS?.split(',')
                      .map(o => o.trim())
                      .filter(Boolean) ?? []),
            credentials: true,
        },
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        // Use migrations outside a fresh local database: `npx vendure migrate`.
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    entityOptions: {
        moneyStrategy: new TndMoneyStrategy(),
    },
    paymentOptions: {
        // Konnect registers its own handler; the dummy handler is for local checkout tests only.
        paymentMethodHandlers: IS_DEV ? [dummyPaymentHandler] : [],
    },
    // Custom fields are declared by the plugins that own them (see LegacyUrlsPlugin).
    customFields: {},
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            assetUrlPrefix: IS_DEV ? undefined : process.env.ASSET_URL_PREFIX || `${serverPublicUrl}/assets/`,
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            // In dev, emails are written to disk and listed at /mailbox.
            ...(IS_DEV
                ? {
                      devMode: true as const,
                      outputPath: path.join(__dirname, '../static/email/test-emails'),
                      route: 'mailbox',
                  }
                : {
                      // TODO before launch: replace with the SMTP transport of the email provider.
                      transport: {
                          type: 'file' as const,
                          outputPath: path.join(__dirname, '../static/email/test-emails'),
                      },
                  }),
            // French templates; alerts to the sales team when SALES_ALERT_EMAIL is set.
            handlers: karcherEmailHandlers(process.env.SALES_ALERT_EMAIL ?? ''),
            emailGenerator: new KarcherEmailGenerator(),
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../email-templates')),
            globalTemplateVars: {
                fromAddress: '"Karcher Tunisie" <noreply@karcher-gei.tn>',
                verifyEmailAddressUrl: `${storefrontUrl}/compte/verification`,
                passwordResetUrl: `${storefrontUrl}/compte/mot-de-passe`,
                changeEmailAddressUrl: `${storefrontUrl}/compte/verification-email`,
                adminPasswordResetUrl: `${serverPublicUrl}/dashboard/reset-password`,
                storefrontUrl,
                dashboardUrl: `${serverPublicUrl}/dashboard`,
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV ? path.join(__dirname, '../dist/dashboard') : path.join(__dirname, 'dashboard'),
        }),
        // Karcher GEI plugins: each one is self-contained and can be removed on its own.
        KonnectPaymentPlugin.init({
            apiKey: process.env.KONNECT_API_KEY ?? '',
            receiverWalletId: process.env.KONNECT_WALLET_ID ?? '',
            sandbox: process.env.KONNECT_SANDBOX !== 'false',
            apiUrl: process.env.KONNECT_API_URL || undefined,
            serverPublicUrl,
            storefrontUrl,
        }),
        QuotesPlugin,
        WarrantyPlugin,
        FormsPlugin,
        LegacyUrlsPlugin,
        MerchandisingPlugin,
        CatalogToolsPlugin,
        StorefrontCachePlugin.init({ storefrontUrl, secret: process.env.REVALIDATE_SECRET ?? '' }),
        MetaCapiPlugin.init({
            pixelId: process.env.META_PIXEL_ID ?? '',
            accessToken: process.env.META_CAPI_ACCESS_TOKEN ?? '',
        }),
    ],
};
