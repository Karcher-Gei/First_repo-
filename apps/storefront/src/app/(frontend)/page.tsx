import type { Metadata } from 'next';

import { RenderBlocks } from '@/components/blocks/RenderBlocks';
import { DefaultHomepage } from '@/components/DefaultHomepage';
import { getCms } from '@/lib/cms';
import { getCategoryMenu } from '@/lib/navigation';

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
  const blocks = home.layout ?? [];
  if (blocks.length === 0) {
    return <DefaultHomepage categories={await getCategoryMenu()} />;
  }
  return <RenderBlocks blocks={blocks} />;
}
