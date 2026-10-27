import type { GlobalConfig } from 'payload';

import { homepageBlocks } from '../blocks';
import { seoFields } from '../fields/seo';

/** The homepage, built from blocks. Its April 2026 layout: slider + PROMOTIONS, COUP DE CŒUR, BESTSELLERS carousels. */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  access: { read: () => true },
  fields: [{ name: 'layout', type: 'blocks', blocks: homepageBlocks }, ...seoFields],
};
