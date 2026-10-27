import { STATIC_PAGES, type StaticPageKey } from '@karcher/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactForm } from '@/components/ContactForm';
import { ProductCard } from '@/components/ProductCard';
import { getCms } from '@/lib/cms';
import { COLLECTION_BY_SLUG } from '@/lib/queries';
import { shopQuery } from '@/lib/vendure';

/** Fixed pages kept from PrestaShop (/promotions, /nous-contacter, ...). Reached through the proxy. */
type Props = {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ envoye?: string }>;
};

const PAGES: Record<StaticPageKey, { title: string; collectionSlug?: string }> = {
  'prices-drop': { title: 'Promotions', collectionSlug: 'promotions' },
  'best-sales': { title: 'Meilleures ventes', collectionSlug: 'meilleures-ventes' },
  'new-products': { title: 'Nouveaux produits', collectionSlug: 'nouveaux-produits' },
  discount: { title: 'Réductions', collectionSlug: 'promotions' },
  brands: { title: 'Marques' },
  contact: { title: 'Nous contacter' },
  stores: { title: 'Nos magasins' },
};

const PATH_OF = Object.fromEntries(
  Object.entries(STATIC_PAGES).map(([path, key]) => [key, path]),
) as Record<StaticPageKey, string>;

function isPageKey(value: string): value is StaticPageKey {
  return value in PAGES;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  if (!isPageKey(page)) {
    return {};
  }
  return { title: PAGES[page].title, alternates: { canonical: PATH_OF[page] } };
}

export default async function StaticPage({ params, searchParams }: Props) {
  const [{ page }, { envoye }] = await Promise.all([params, searchParams]);
  if (!isPageKey(page)) {
    notFound();
  }
  const { title, collectionSlug } = PAGES[page];

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
        {title}
      </h1>
      {collectionSlug ? <CollectionGrid slug={collectionSlug} /> : null}
      {page === 'stores' || page === 'contact' ? <StoreList /> : null}
      {page === 'contact' ? <ContactForm sent={envoye === '1'} /> : null}
    </section>
  );
}

async function CollectionGrid({ slug }: { slug: string }) {
  const { collection } = await shopQuery(COLLECTION_BY_SLUG, { slug, take: 48 });
  const items = collection?.productVariants.items ?? [];
  if (items.length === 0) {
    return <p className="text-ink-muted">Aucun produit pour le moment.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((variant) => (
        <ProductCard
          key={variant.id}
          product={variant.product}
          priceWithTax={variant.priceWithTax}
        />
      ))}
    </div>
  );
}

async function StoreList() {
  const cms = await getCms();
  const { docs } = await cms.find({ collection: 'stores', limit: 20, sort: 'order' });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {docs.map((store) => (
        <address key={store.id} className="rounded-card border border-line p-5 not-italic">
          <h2 className="mb-2 font-bold">{store.name}</h2>
          <p className="whitespace-pre-line text-sm">{store.address}</p>
          {store.openingHours ? (
            <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{store.openingHours}</p>
          ) : null}
          {store.phone ? <p className="mt-2 text-sm font-semibold">Tél. {store.phone}</p> : null}
        </address>
      ))}
    </div>
  );
}
