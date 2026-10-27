import { categoryPath } from '@karcher/seo';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { ProductCard } from '@/components/ProductCard';
import { COLLECTION_BY_LEGACY_ID } from '@/lib/queries';
import { redirectOrNotFound } from '@/lib/redirects';
import { shopQuery } from '@/lib/vendure';

/** Category page. Reached through the proxy from /{id}-{slug} */
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

const PAGE_SIZE = 48;

async function loadCollection(id: string) {
  const legacyId = Number(id);
  if (!Number.isSafeInteger(legacyId)) {
    return null;
  }
  const { collections } = await shopQuery(COLLECTION_BY_LEGACY_ID, { legacyId, take: PAGE_SIZE });
  return collections.items[0] ?? null;
}

function canonicalOf(collection: { slug: string; customFields: { legacyId: number | null } | null }): string | null {
  const legacyId = collection.customFields?.legacyId;
  return legacyId == null ? null : categoryPath({ id: legacyId, slug: collection.slug });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await loadCollection((await params).id);
  if (!collection) {
    return {};
  }
  return { title: collection.name, alternates: { canonical: canonicalOf(collection) ?? undefined } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const collection = await loadCollection(id);
  if (!collection) {
    return redirectOrNotFound(from);
  }
  const canonical = canonicalOf(collection);
  if (canonical && from && from !== canonical) {
    permanentRedirect(canonical);
  }

  const { items, totalItems } = collection.productVariants;
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black uppercase">{collection.name}</h1>
        <p className="text-sm text-ink-muted">{totalItems} produits</p>
      </header>
      {/* TODO(Features phase): facet filters and pagination (?page=) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map(variant => (
          <ProductCard key={variant.id} variant={variant} />
        ))}
      </div>
      {collection.description ? (
        <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: collection.description }} />
      ) : null}
    </section>
  );
}
