export {};

// Typed process.env for the server and worker.
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            APP_ENV: string;
            VENDURE_SERVER_PORT: string;
            PORT: string;
            COOKIE_SECRET: string;
            SUPERADMIN_USERNAME: string;
            SUPERADMIN_PASSWORD: string;
            CORS_ORIGINS?: string;
            DB_HOST: string;
            DB_PORT: string;
            DB_NAME: string;
            DB_USERNAME: string;
            DB_PASSWORD: string;
            DB_SYNCHRONIZE?: string;
            STOREFRONT_URL: string;
            SERVER_PUBLIC_URL: string;
            ASSET_URL_PREFIX?: string;
            KONNECT_API_KEY?: string;
            KONNECT_WALLET_ID?: string;
            KONNECT_SANDBOX?: string;
            META_PIXEL_ID?: string;
            META_CAPI_ACCESS_TOKEN?: string;
        }
    }
}
