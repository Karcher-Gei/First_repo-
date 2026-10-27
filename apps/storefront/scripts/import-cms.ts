/**
 * Loads the PrestaShop CMS pages exported by tools/migration (out/cms-pages.json) into Payload,
 * converting their HTML to rich text. Pages are matched on legacyId, so it can run again.
 *
 *   pnpm --filter @karcher/migration import:shop --only=cms
 *   pnpm --filter @karcher/storefront import:cms [path/to/cms-pages.json]
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { JSDOM } from 'jsdom';
import { getPayload } from 'payload';

import config from '../src/payload.config';

interface CmsPageExport {
  legacyId: number;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  html: string;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? path.join(here, '../../../tools/migration/out/cms-pages.json');

const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });
const pages = JSON.parse(await readFile(file, 'utf8')) as CmsPageExport[];

let created = 0;
let updated = 0;
for (const page of pages) {
  const data = {
    title: page.title,
    legacyId: page.legacyId,
    slug: page.slug,
    content: convertHTMLToLexical({ editorConfig, html: page.html, JSDOM }),
    meta: { title: page.metaTitle, description: page.metaDescription },
  };
  const { docs } = await payload.find({
    collection: 'pages',
    where: { legacyId: { equals: page.legacyId } },
    limit: 1,
    depth: 0,
  });
  if (docs[0]) {
    await payload.update({ collection: 'pages', id: docs[0].id, data });
    updated++;
  } else {
    await payload.create({ collection: 'pages', data });
    created++;
  }
}
console.log(
  `CMS pages: ${created} created, ${updated} updated (from ${path.relative(process.cwd(), file)})`,
);
process.exit(0);
