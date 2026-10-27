// Copies the default Vendure email templates into static/email/templates once,
// so they can be customised (Karcher branding, French copy) and committed later.
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(here, '../static/email/templates');

if (existsSync(target)) {
    process.exit(0);
}

// Walk up from the package entry point to the package root, which holds templates/.
let dir = path.dirname(require.resolve('@vendure/email-plugin'));
while (dir !== path.dirname(dir)) {
    const pkgFile = path.join(dir, 'package.json');
    if (existsSync(pkgFile) && JSON.parse(readFileSync(pkgFile, 'utf-8')).name === '@vendure/email-plugin') {
        break;
    }
    dir = path.dirname(dir);
}

mkdirSync(target, { recursive: true });
cpSync(path.join(dir, 'templates'), target, { recursive: true });
console.log(`Copied Vendure email templates to ${path.relative(process.cwd(), target)}`);
