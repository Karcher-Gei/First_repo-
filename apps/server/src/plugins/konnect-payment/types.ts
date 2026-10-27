export interface KonnectPluginOptions {
    apiKey: string;
    receiverWalletId: string;
    /** Use api.sandbox.konnect.network instead of the live API. */
    sandbox: boolean;
    /** Overrides the API base URL, e.g. a local mock for end-to-end tests. */
    apiUrl?: string;
    /** Public URL of this Vendure server; Konnect calls `${serverPublicUrl}/konnect/webhook`. */
    serverPublicUrl: string;
    /** Public URL of the storefront, for the success and failure redirects. */
    storefrontUrl: string;
}

/**
 * Request and response shapes of Konnect's payment API (v2).
 * Check them against https://docs.konnect.network before going live.
 */
export interface KonnectInitPaymentInput {
    /** Amount in millimes (1 TND = 1000 millimes), the same integer Vendure stores. */
    amount: number;
    orderId: string;
    description: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    webhook: string;
    successUrl: string;
    failUrl: string;
}

export interface KonnectInitPaymentResponse {
    payUrl: string;
    paymentRef: string;
}

export type KonnectPaymentStatus = 'completed' | 'pending' | 'failed' | 'expired' | (string & {});

export interface KonnectPaymentDetails {
    id: string;
    status: KonnectPaymentStatus;
    amount: number;
    orderId: string;
}
