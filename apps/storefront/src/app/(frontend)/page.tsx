import type { Metadata } from 'next';

import { DEFAULT_HOMEPAGE, RenderBlocks } from '@/components/blocks/RenderBlocks';
import { getCms } from '@/lib/cms';

async function loadHomepage() {
  const cms = await getCms();
  return cms.findGlobal({ slug: 'homepage', depth: 1 });
}

export async function generateMetadata(): Promise<Metadata> {
  const home = await loadHomepage();
  return {
    ...(home.meta?.title ? { title: { absolute: home.meta.title } } : {}),
    ...(home.meta?.description ? { description: home.meta.description } : {}),
    alternates: { canonical: '/' },
  };
}

export default async function HomePage() {
  const home = await loadHomepage();
  const blocks = home.layout?.length ? home.layout : DEFAULT_HOMEPAGE;
  return <RenderBlocks blocks={blocks} />;
}
