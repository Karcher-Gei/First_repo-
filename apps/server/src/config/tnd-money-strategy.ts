import { DefaultMoneyStrategy } from '@vendure/core';

/**
 * The Tunisian dinar has 3 decimal places (1 TND = 1000 millimes).
 * Vendure stores prices as integers in minor units, so 1 542,000 TND is stored as 1542000.
 * The shop sells in TND only, so the precision applies globally.
 */
export class TndMoneyStrategy extends DefaultMoneyStrategy {
    override readonly precision: number = 3;
}
