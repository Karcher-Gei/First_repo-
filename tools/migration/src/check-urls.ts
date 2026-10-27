/**
 * Requests every URL of the inventory (out/url-inventory.csv) from the new storefront.
 * Active PrestaShop URLs must answer 200, or 301/308 for images and non-canonical forms;
 * inactive ones must answer 404 (or a redirect someone set up). Exits non-zero on any miss.
 *
 *   pnpm --filter @karcher/migration inventory
 *   pnpm --filter @karcher/migration check:urls [https://staging.example]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] ?? process.env.STOREFRONT_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);
const csvFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../out/url-inventory.csv');
const rows = readFileSync(csvFile, 'utf8')
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => {
    const [type, id, urlPath, active] = line.split(',');
    return { type: type!, id: id!, path: urlPath!, active: active === 'true' };
  });

const REDIRECT = new Set([301, 308]);
const failures: string[] = [];
const statuses = new Map<string, number>();
const CONCURRENCY = 8;

async function check(row: (typeof rows)[number]): Promise<void> {
  const response = await fetch(base + row.path, { redirect: 'manual' }).catch(() => null);
  const status = response?.status ?? 0;
  const key = `${row.active ? 'active' : 'inactive'} ${status}`;
  statuses.set(key, (statuses.get(key) ?? 0) + 1);
  const okStatus = row.active
    ? status === 200 || REDIRECT.has(status)
    : status === 404 || REDIRECT.has(status);
  if (!okStatus) {
    failures.push(`${status} ${row.active ? 'active' : 'inactive'} ${row.type} ${row.path}`);
  }
}

for (let i = 0; i < rows.length; i += CONCURRENCY) {
  await Promise.all(rows.slice(i, i + CONCURRENCY).map(check));
}

for (const [key, count] of [...statuses].sort()) {
  console.log(`${String(count).padStart(6)}  ${key}`);
}
if (failures.length) {
  console.error(`\n${failures.length} URL(s) not served as expected by ${base}:`);
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`\nAll ${rows.length} URLs served as expected by ${base}.`);
}
