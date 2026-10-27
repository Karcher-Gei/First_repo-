import Image from 'next/image';
import Link from 'next/link';

import { featuredProducts } from '@/lib/catalog';
import { getCategoryMenu } from '@/lib/navigation';

import { ArrowLink, Container, CtaLink, SectionHeading } from '../brand';
import { LockIcon, ShieldIcon, TruckIcon, WrenchIcon } from '../icons';

/**
 * The designed sections of the homepage. Each one is a CMS block (cms/blocks.ts), so staff can
 * arrange them around the slider and carousels imported from PrestaShop.
 */

/** Anthracite stage with Kärcher's slanted yellow shapes and a product on a white disc. */
export async function HomeHero({ heading, text }: { heading?: string | null; text?: string | null }) {
  const [categories, products] = await Promise.all([getCategoryMenu(), featuredProducts(12)]);
  const heroProduct = products.find((p) => p.product.featuredAsset)?.product;
  const first = categories[0];

  return (
    <section className="full-bleed relative overflow-hidden bg-anthracite text-white">
      <div
        aria-hidden="true"
        className="slant absolute -right-24 top-0 hidden h-full w-[46%] bg-brand md:block"
      />
      <div
        aria-hidden="true"
        className="slant absolute right-[38%] top-0 hidden h-full w-16 bg-brand/25 md:block"
      />
      <Container className="relative grid items-center gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div className="space-y-6">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand">
            Distributeur officiel Kärcher en Tunisie
          </p>
          <h1 className="max-w-xl font-heading text-5xl font-extrabold uppercase leading-[0.95] md:text-7xl">
            {heading || 'La puissance du nettoyage'}
          </h1>
          <p className="max-w-lg text-lg text-white/75">
            {text ||
              'Nettoyeurs haute pression, aspirateurs, balayeuses : l’équipement de nettoyage des particuliers et des professionnels.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {first ? <CtaLink href={first.href}>Découvrir les produits</CtaLink> : null}
            <CtaLink href="/devis" variant="outline">
              Devis professionnel
            </CtaLink>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <ShieldIcon width={18} height={18} className="text-brand" /> Produits d’origine
            </li>
            <li className="flex items-center gap-2">
              <WrenchIcon width={18} height={18} className="text-brand" /> Garantie et SAV
            </li>
            <li className="flex items-center gap-2">
              <LockIcon width={18} height={18} className="text-brand" /> Paiement sécurisé
            </li>
          </ul>
        </div>
        {heroProduct?.featuredAsset ? (
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-[10%] rounded-full bg-white shadow-[0_0_0_18px_rgba(255,255,255,0.12)]" />
            <Image
              src={`${heroProduct.featuredAsset.preview}?preset=large`}
              alt={heroProduct.featuredAsset.customFields?.alt || heroProduct.name}
              fill
              priority
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-contain p-16 mix-blend-multiply"
            />
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/** Home and garden / professional: the two big entry points, as on kaercher.com. */
export async function HomeUniverses() {
  const categories = await getCategoryMenu();
  if (categories.length === 0) {
    return null;
  }
  return (
    <section aria-label="Nos univers" className="grid gap-4 md:grid-cols-2">
      {categories.slice(0, 2).map((category, index) => {
        const dark = index === 1;
        return (
          <Link
            key={category.href}
            href={category.href}
            className={`group relative flex min-h-72 overflow-hidden rounded-card p-8 md:min-h-80 ${
              dark ? 'bg-ink text-white' : 'bg-brand text-ink'
            }`}
          >
            <div className="relative z-10 flex max-w-[62%] flex-col justify-between gap-6 sm:max-w-[55%]">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                  {dark ? 'Gamme professionnelle' : 'Pour la maison'}
                </p>
                <h2 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
                  {category.name}
                </h2>
                {category.children.length > 0 ? (
                  <p className="text-sm opacity-80">
                    {category.children
                      .slice(0, 3)
                      .map((c) => c.name)
                      .join(' · ')}
                  </p>
                ) : null}
              </div>
              <span className="inline-flex w-fit items-center gap-2 font-heading text-lg font-bold uppercase">
                Découvrir
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
            {category.image ? (
              // Product photos are on white: blended into the yellow tile, on a light disc on the dark one.
              <span
                className={`absolute -bottom-10 -right-10 flex size-48 items-center justify-center rounded-full sm:size-72 md:size-80 ${
                  dark ? 'bg-white/95' : ''
                }`}
              >
                <Image
                  src={`${category.image}?preset=large`}
                  alt=""
                  width={420}
                  height={420}
                  className="size-36 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 sm:size-56 md:size-64"
                />
              </span>
            ) : null}
          </Link>
        );
      })}
    </section>
  );
}

/** Tiles of the second-level categories. */
export async function HomeCategories({ title }: { title?: string | null }) {
  const subcategories = (await getCategoryMenu()).flatMap((c) => c.children);
  if (subcategories.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="home-categories">
      <SectionHeading
        id="home-categories"
        kicker="Trouvez la bonne machine"
        title={title || 'Nos catégories'}
      />
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {subcategories.map((category) => (
          <li key={category.href}>
            <Link
              href={category.href}
              className="group flex h-full flex-col overflow-hidden rounded-card bg-stage transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/3]">
                {category.image ? (
                  <Image
                    src={`${category.image}?preset=medium`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <span className="flex items-center justify-between gap-2 bg-surface px-4 py-3 font-heading text-lg font-bold uppercase leading-tight">
                {category.name}
                <span
                  aria-hidden="true"
                  className="text-ink-muted transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Full-width yellow quote banner for professionals. */
export function HomeProBanner() {
  return (
    <section className="full-bleed relative overflow-hidden bg-brand">
      <div
        aria-hidden="true"
        className="slant absolute -left-20 top-0 hidden h-full w-1/4 bg-ink md:block"
      />
      <Container className="relative grid items-center gap-6 py-12 md:grid-cols-[1fr_auto] md:py-14 md:pl-[28%]">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">
            Entreprises, collectivités, revendeurs
          </p>
          <h2 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
            Un devis adapté à votre activité
          </h2>
          <p className="max-w-xl">
            Grandes quantités, équipement de plusieurs sites, conseil sur la bonne machine : notre
            équipe commerciale vous répond.
          </p>
        </div>
        <CtaLink href="/devis" variant="dark">
          Demander un devis
        </CtaLink>
      </Container>
    </section>
  );
}

/** Warranty registration and after-sales service. */
export function HomeAfterSales() {
  return (
    <section aria-label="Après-vente" className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col justify-between gap-6 rounded-card bg-stage p-8">
        <div className="space-y-2">
          <WrenchIcon width={32} height={32} />
          <h2 className="font-heading text-3xl font-extrabold uppercase leading-none">
            Enregistrez votre garantie
          </h2>
          <p className="text-ink-muted">
            Référence, numéro de série et date d’achat : enregistrez votre machine Kärcher en deux
            minutes.
          </p>
        </div>
        <ArrowLink href="/garantie">Enregistrer ma machine</ArrowLink>
      </div>
      <div className="flex flex-col justify-between gap-6 rounded-card bg-anthracite p-8 text-white">
        <div className="space-y-2">
          <TruckIcon width={32} height={32} className="text-brand" />
          <h2 className="font-heading text-3xl font-extrabold uppercase leading-none">
            Conseil et service après-vente
          </h2>
          <p className="text-white/70">
            Une question sur un produit, une pièce ou une réparation ? Écrivez-nous ou passez en
            magasin.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          <ArrowLink href="/nous-contacter" inverted>
            Nous contacter
          </ArrowLink>
          <ArrowLink href="/magasins" inverted>
            Nos magasins
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
