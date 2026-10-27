import Image from 'next/image';
import Link from 'next/link';

import { featuredProducts } from '@/lib/catalog';
import type { MenuCategory } from '@/lib/navigation';

import { ProductCard } from './ProductCard';
import { ServiceHighlights } from './ServiceHighlights';

/** Homepage shown until staff build one from blocks in the CMS (Homepage global). */
export async function DefaultHomepage({ categories }: { categories: MenuCategory[] }) {
  const products = await featuredProducts(8);
  const first = categories[0];

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-card bg-ink text-white">
        <div className="space-y-4 border-l-8 border-brand p-8 md:p-12">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">
            Distributeur officiel Kärcher
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight md:text-5xl">
            Le nettoyage, version Kärcher
          </h1>
          <p className="max-w-xl text-white/80">
            Nettoyeurs haute pression, aspirateurs, balayeuses : l’équipement de nettoyage des
            particuliers et des professionnels.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {first ? (
              <Link
                href={first.href}
                className="rounded-card bg-brand px-5 py-3 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-brand-dark"
              >
                Voir les produits
              </Link>
            ) : null}
            <Link
              href="/devis"
              className="rounded-card border border-white/40 px-5 py-3 text-sm font-semibold uppercase tracking-wide hover:border-brand hover:text-brand"
            >
              Devis professionnel
            </Link>
          </div>
        </div>
      </section>

      <ServiceHighlights />

      {categories.length > 0 ? (
        <section className="space-y-4" aria-labelledby="home-categories">
          <h2 id="home-categories" className="text-2xl font-black uppercase">
            Nos catégories
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.href} className="rounded-card border border-line p-5">
                <Link href={category.href} className="group flex items-center gap-4">
                  {category.image ? (
                    <Image
                      src={`${category.image}?preset=thumb`}
                      alt=""
                      width={64}
                      height={64}
                      className="size-16 object-contain"
                    />
                  ) : (
                    <span aria-hidden="true" className="size-3 rounded-full bg-brand" />
                  )}
                  <span className="text-lg font-bold group-hover:underline">{category.name}</span>
                </Link>
                {category.children.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {category.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="inline-block rounded-full bg-surface-muted px-3 py-1 text-xs hover:bg-brand"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section className="space-y-4" aria-labelledby="home-products">
          <h2 id="home-products" className="text-2xl font-black uppercase">
            Notre sélection
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map(({ product, priceWithTax, from }) => (
              <ProductCard
                key={product.id}
                product={product}
                priceWithTax={priceWithTax}
                priceFrom={from}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
