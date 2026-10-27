import { cmsPath, parseLegacyPath } from '@karcher/seo';
import { RichText } from '@payloadcms/richtext-lexical/react';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { getCms } from '@/lib/cms';
import { redirectOrNotFound } from '@/lib/redirects';

/** CMS page at /content/{legacyId}-{slug}, e.g. /content/62-devenir-revendeur */
type Props = { params: Promise<{ slug: string }> };

async function loadPage(segment: string) {
  const route = parseLegacyPath(`/content/${segment}`);
  if (route?.kind !== 'cms') {
    return null;
  }
  const cms = await getCms();
  const { docs } = await cms.find({
    collection: 'pages',
    where: { legacyId: { equals: route.cmsId } },
    limit: 1,
  });
  return docs[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await loadPage((await params).slug);
  if (!page) {
    return {};
  }
  return {
    title: page.meta?.title || page.title,
    description: page.meta?.description ?? undefined,
    alternates: { canonical: cmsPath({ id: page.legacyId, slug: page.slug }) },
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) {
    return redirectOrNotFound(`/content/${slug}`);
  }
  const canonical = cmsPath({ id: page.legacyId, slug: page.slug });
  if (`/content/${slug.toLowerCase()}` !== canonical) {
    permanentRedirect(canonical);
  }
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-black">{page.title}</h1>
      {page.content ? (
        <div className="space-y-4 leading-relaxed">
          <RichText data={page.content} />
        </div>
      ) : null}
    </article>
  );
}
