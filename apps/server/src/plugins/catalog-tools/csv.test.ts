import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatMoney, headerKey, parseCsv, parseDate, parseMoney, parseYesNo, toCsv } from './csv';

describe('parseCsv', () => {
    it('reads what French Excel writes: BOM, ";", quotes, CRLF', () => {
        const text = '﻿Référence;Produit;Prix TTC\r\n1.055-300.0;"Aspirateur ""FC 3""; laveur";1311,125\r\n\r\n';
        assert.deepEqual(parseCsv(text), [
            ['Référence', 'Produit', 'Prix TTC'],
            ['1.055-300.0', 'Aspirateur "FC 3"; laveur', '1311,125'],
        ]);
    });

    it('reads comma-separated files too', () => {
        assert.deepEqual(parseCsv('Référence,Stock\nPS-104,3'), [
            ['Référence', 'Stock'],
            ['PS-104', '3'],
        ]);
    });

    it('round-trips its own export', () => {
        const rows = [
            ['Référence', 'Catégories'],
            ['K4', '12 Maison et jardin | 13 Nettoyeurs; "HP"'],
        ];
        assert.deepEqual(parseCsv(toCsv(rows)), rows);
    });
});

describe('values', () => {
    it('reads prices in DT, with comma or dot, spaces and unit', () => {
        assert.equal(parseMoney('1311,125'), 1311125);
        assert.equal(parseMoney('1 311.125 DT'), 1311125);
        assert.equal(parseMoney('50'), 50000);
        assert.equal(parseMoney('12,5'), 12500);
        assert.equal(parseMoney('abc'), null);
        assert.equal(parseMoney('1,2345'), null);
        assert.equal(formatMoney(1311125), '1311,125');
    });

    it('reads dates as the end of that day in Tunisia', () => {
        assert.equal(parseDate('31/12/2026')?.toISOString(), '2026-12-31T22:59:59.000Z');
        assert.equal(parseDate('2026-12-31')?.toISOString(), '2026-12-31T22:59:59.000Z');
        assert.equal(parseDate('31-12-2026'), null);
    });

    it('reads yes and no', () => {
        assert.equal(parseYesNo('Oui'), true);
        assert.equal(parseYesNo('non'), false);
        assert.equal(parseYesNo(''), null);
        assert.equal(parseYesNo('peut-être'), 'invalid');
    });

    it('matches headers without accents, case or spaces', () => {
        assert.equal(headerKey('Prix barré TTC'), 'prixbarrettc');
        assert.equal(headerKey('Remise %'), 'remise%');
        assert.equal(headerKey('CATÉGORIES'), 'categories');
    });
});
