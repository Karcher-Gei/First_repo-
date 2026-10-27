/** CSV as Excel writes and reads it in French: ";" separators, decimal commas, UTF-8 with BOM. */

export function parseCsv(text: string): string[][] {
    const source = text.replace(/^﻿/, '');
    const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
    const separator = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < source.length; i++) {
        const char = source[i]!;
        if (quoted) {
            if (char === '"' && source[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (char === '"') {
                quoted = false;
            } else {
                cell += char;
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === separator) {
            row.push(cell);
            cell = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && source[i + 1] === '\n') {
                i++;
            }
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += char;
        }
    }
    if (cell || row.length) {
        row.push(cell);
        rows.push(row);
    }
    return rows.filter(r => r.some(c => c.trim() !== ''));
}

export function toCsv(rows: Array<Array<string | number | null>>): string {
    const escape = (value: string | number | null) => {
        const text = value == null ? '' : String(value);
        return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return `﻿${rows.map(r => r.map(escape).join(';')).join('\r\n')}\r\n`;
}

/** "1 311,125" or "1311.125" (DT) -> 1311125 millimes; null when not a number. */
export function parseMoney(text: string): number | null {
    const normalized = text.replace(/[\s  ]|DT|TND/gi, '').replace(',', '.');
    if (!/^\d+(\.\d{1,3})?$/.test(normalized)) {
        return null;
    }
    return Math.round(Number(normalized) * 1000);
}

/** 1311125 -> "1311,125": no thousands separator, so Excel reads it back as a number. */
export function formatMoney(millimes: number): string {
    return (millimes / 1000).toFixed(3).replace('.', ',');
}

/** "31/12/2026" or "2026-12-31" -> end of that day in Tunisia; null when not a date. */
export function parseDate(text: string): Date | null {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text) ?? null;
    const iso = match
        ? `${match[3]}-${match[2]!.padStart(2, '0')}-${match[1]!.padStart(2, '0')}`
        : /^\d{4}-\d{2}-\d{2}$/.test(text)
          ? text
          : null;
    if (!iso) {
        return null;
    }
    const date = new Date(`${iso}T23:59:59+01:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** A date as "31/12/2026", in Tunisia time. */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', { timeZone: 'Africa/Tunis' });
}

/** "oui", "non", "1", "0", "x", "" (empty: unchanged). */
export function parseYesNo(text: string): boolean | null | 'invalid' {
    const value = text.trim().toLowerCase();
    if (!value) {
        return null;
    }
    if (['oui', 'o', 'yes', '1', 'x', 'vrai'].includes(value)) {
        return true;
    }
    if (['non', 'n', 'no', '0', 'faux'].includes(value)) {
        return false;
    }
    return 'invalid';
}

/** Header names without accents, case or spaces: "Prix barré TTC" -> "prixbarrettc". */
export function headerKey(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9%]/g, '');
}
