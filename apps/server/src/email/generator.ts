import { HandlebarsMjmlGenerator } from '@vendure/email-plugin';
import Handlebars from 'handlebars';

const TIME_ZONE = 'Africa/Tunis';

/** 1311125 millimes -> "1 311,125 DT", as on the storefront. */
export function formatTnd(millimes: number): string {
    return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(millimes / 1000)} DT`;
}

/**
 * Vendure's generator with French helpers: amounts are in millimes (TND has 3 decimals, see
 * TndMoneyStrategy) where the default formatMoney divides by 100, and dates are in Tunisia time.
 */
export class KarcherEmailGenerator extends HandlebarsMjmlGenerator {
    async onInit(...args: Parameters<HandlebarsMjmlGenerator['onInit']>): Promise<void> {
        await super.onInit(...args);
        Handlebars.registerHelper('formatMoney', (amount: unknown) =>
            typeof amount === 'number' ? formatTnd(amount) : amount,
        );
        Handlebars.registerHelper('formatDate', (date: unknown) =>
            date instanceof Date || typeof date === 'string'
                ? new Date(date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: TIME_ZONE,
                  })
                : date,
        );
    }
}
