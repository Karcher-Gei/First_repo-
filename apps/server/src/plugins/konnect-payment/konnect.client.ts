import type {
    KonnectInitPaymentInput,
    KonnectInitPaymentResponse,
    KonnectPaymentDetails,
    KonnectPluginOptions,
} from './types';

const LIVE_API = 'https://api.konnect.network/api/v2';
const SANDBOX_API = 'https://api.sandbox.konnect.network/api/v2';

/** Thin wrapper around Konnect's REST API. */
export class KonnectClient {
    private readonly baseUrl: string;

    constructor(private readonly options: KonnectPluginOptions) {
        this.baseUrl = options.apiUrl || (options.sandbox ? SANDBOX_API : LIVE_API);
    }

    async initPayment(input: KonnectInitPaymentInput): Promise<KonnectInitPaymentResponse> {
        return this.request<KonnectInitPaymentResponse>('/payments/init-payment', {
            method: 'POST',
            body: JSON.stringify({
                receiverWalletId: this.options.receiverWalletId,
                token: 'TND',
                type: 'immediate',
                acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
                lifespan: 15,
                checkoutForm: false,
                addPaymentFeesToAmount: false,
                silentWebhook: true,
                theme: 'light',
                ...input,
            }),
        });
    }

    async getPayment(paymentRef: string): Promise<KonnectPaymentDetails> {
        const { payment } = await this.request<{ payment: KonnectPaymentDetails }>(
            `/payments/${encodeURIComponent(paymentRef)}`,
            { method: 'GET' },
        );
        return payment;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.options.apiKey,
            },
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Konnect ${init.method ?? 'GET'} ${path} failed: ${response.status} ${body}`);
        }
        return (await response.json()) as T;
    }
}
