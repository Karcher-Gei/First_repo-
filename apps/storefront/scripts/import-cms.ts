/**
 * Loads what tools/migration exported for Payload: the PrestaShop CMS pages (out/cms-pages.json),
 * their HTML converted to rich text; the meta tags of the homepage and the fixed pages
 * (out/page-meta.json); and the homepage (out/homepage.json): its slider and product carousels,
 * placed among the designed Kärcher sections. Pages are matched on legacyId, so it can run again;
 * the homepage is only written while it has no blocks, unless --replace-homepage is given.
 *
 *   pnpm --filter @karcher/migration import:shop --only=cms
 *   pnpm --filter @karcher/storefront import:cms [path/to/cms-pages.json] [--replace-homepage]
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { JSDOM } from 'jsdom';
import { getPayload } from 'payload';

import type { FixedPage, Homepage } from '../src/payload-types';
import config from '../src/payload.config';

interface CmsPageExport {
  legacyId: number;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  html: string;
}

interface PageMetaExport {
  homepage: { title: string | null; description: string | null };
  pages: { page: string; title: string | null; description: string | null }[];
}

type HomepageSection =
  | {
      kind: 'slider';
      slides: { image: string; alt: string; heading: string | null; link: string | null }[];
    }
  | {
      kind: 'carousel';
      title: string;
      source: 'collection' | 'best-sellers' | 'newest';
      collectionSlug?: string;
      link?: string;
      limit: number;
    };

type Block = NonNullable<Homepage['layout']>[number];

const args = process.argv.slice(2);
const replaceHomepage = args.includes('--replace-homepage');
const here = path.dirname(fileURLToPath(import.meta.url));
const file =
  args.find((arg) => !arg.startsWith('--')) ??
  path.join(here, '../../../tools/migration/out/cms-pages.json');
const metaFile = path.join(path.dirname(file), 'page-meta.json');
const homepageFile = path.join(path.dirname(file), 'homepage.json');

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

const metas = JSON.parse(await readFile(metaFile, 'utf8')) as PageMetaExport;
await payload.updateGlobal({ slug: 'homepage', data: { meta: metas.homepage } });
await payload.updateGlobal({
  slug: 'fixed-pages',
  data: { pages: metas.pages as NonNullable<FixedPage['pages']> },
});
console.log(`Meta tags: homepage and ${metas.pages.length} fixed pages`);

const { sections } = JSON.parse(await readFile(homepageFile, 'utf8')) as {
  sections: HomepageSection[];
};
const home = await payload.findGlobal({ slug: 'homepage', depth: 0 });
if (home.layout?.length && !replaceHomepage) {
  console.log('Homepage: already has blocks, left as is (--replace-homepage to rebuild it)');
} else {
  const imported: Block[] = [];
  for (const section of sections) {
    if (section.kind === 'slider') {
      const slides = [];
      for (const slide of section.slides) {
        const image = await uploadOnce(slide.image, slide.alt || slide.heading || 'Kärcher');
        if (image) {
          slides.push({ image, heading: slide.heading, link: slide.link });
        }
      }
      if (slides.length) {
        imported.push({ blockType: 'heroSlider', slides });
      }
    } else {
      const { kind: _kind, ...carousel } = section;
      imported.push({ blockType: 'productCarousel', ...carousel });
    }
  }
  // The designed Kärcher sections frame what PrestaShop's homepage showed, in its order.
  const layout: Block[] = [
    { blockType: 'homeHero' },
    { blockType: 'universes' },
    ...imported,
    { blockType: 'categoryGrid' },
    { blockType: 'proBanner' },
    { blockType: 'services' },
    { blockType: 'afterSales' },
  ];
  await payload.updateGlobal({ slug: 'homepage', data: { layout } });
  console.log(`Homepage: ${imported.length} imported sections among the Kärcher sections`);
}

/** Uploads a slider image to the media library once (matched on its file name); its id. */
async function uploadOnce(source: string, alt: string): Promise<number | null> {
  const name = path.basename(new URL(source, 'file:///').pathname);
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: name } },
    limit: 1,
    depth: 0,
  });
  if (docs[0]) {
    return docs[0].id;
  }
  let data: Buffer;
  try {
    data = /^https?:/.test(source) ? await download(source) : await readFile(source);
  } catch {
    console.warn(`  ! Slider image ${source} not found, slide left out`);
    return null;
  }
  const mimetype = name.endsWith('.png')
    ? 'image/png'
    : name.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';
  const media = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data, mimetype, name, size: data.length },
  });
  return media.id;
}
process.exit(0);

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
