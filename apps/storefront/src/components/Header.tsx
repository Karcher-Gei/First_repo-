import Image from 'next/image';
import Link from 'next/link';

import { CartLink } from '@/components/cart';
import { getCategoryMenu, getCmsNavigation } from '@/lib/navigation';

import { ArrowLink, Logo } from './brand';
import { ChevronDownIcon, SearchIcon, UserIcon } from './icons';
import { MobileMenu } from './MobileMenu';

const SERVICE_LINKS = [
  { href: '/devis', label: 'Devis professionnel' },
  { href: '/garantie', label: 'Enregistrer ma garantie' },
  { href: '/magasins', label: 'Nos magasins' },
  { href: '/nous-contacter', label: 'Contact' },
];

function SearchForm({ id, className }: { id: string; className?: string }) {
  return (
    <form action="/recherche" role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Rechercher un produit
      </label>
      <div className="flex h-11 overflow-hidden rounded-card bg-surface-muted ring-1 ring-line focus-within:ring-2 focus-within:ring-ink">
        <input
          id={id}
          name="s"
          type="search"
          placeholder="Rechercher un produit, une référence…"
          className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-ink-muted"
        />
        <button
          type="submit"
          className="flex w-12 items-center justify-center bg-brand text-ink hover:bg-brand-dark"
          aria-label="Rechercher"
        >
          <SearchIcon width={20} height={20} />
        </button>
      </div>
    </form>
  );
}

export async function Header() {
  const [categories, cms] = await Promise.all([getCategoryMenu(), getCmsNavigation()]);

  return (
    <header className="sticky top-0 z-40 bg-surface shadow-[0_1px_0_var(--color-line)]">
      <div className="hidden bg-anthracite text-xs text-white/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <p>
            <span className="font-bold text-brand">Distributeur officiel Kärcher</span> en Tunisie
          </p>
          <ul className="flex gap-5">
            {SERVICE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-8 md:py-4">
        <MobileMenu categories={categories} links={cms.header} />
        <Logo />
        <SearchForm id="header-search" className="hidden max-w-2xl flex-1 md:block" />
        <div className="ml-auto flex items-center gap-5 text-sm">
          <Link
            href="/compte"
            className="inline-flex items-center gap-2 hover:text-ink-muted"
            aria-label="Mon compte"
          >
            <UserIcon />
            <span className="hidden leading-tight lg:block">
              <span className="block text-xs text-ink-muted">Bienvenue</span>
              <span className="font-bold">Mon compte</span>
            </span>
          </Link>
          <CartLink />
        </div>
      </div>
      <SearchForm id="header-search-mobile" className="px-4 pb-3 md:hidden" />

      <nav aria-label="Catégories" className="hidden border-t border-line md:block">
        <ul className="mx-auto flex max-w-7xl items-stretch gap-1 px-2 font-heading text-lg font-bold uppercase tracking-wide">
          {categories.map((category) => (
            <li key={category.href} className="group">
              <Link
                href={category.href}
                className="relative inline-flex h-full items-center gap-1 px-3 py-3 after:absolute after:inset-x-3 after:bottom-0 after:h-1 after:scale-x-0 after:bg-brand after:transition-transform group-focus-within:after:scale-x-100 group-hover:after:scale-x-100"
              >
                {category.name}
                {category.children.length > 0 ? (
                  <ChevronDownIcon
                    width={16}
                    height={16}
                    className="transition group-hover:rotate-180"
                  />
                ) : null}
              </Link>
              {category.children.length > 0 ? (
                <div className="invisible absolute inset-x-0 top-full border-t border-line bg-surface opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="mx-auto grid max-w-7xl grid-cols-[1fr_18rem] gap-8 px-4 py-8">
                    <div>
                      <p className="mb-4 font-heading text-2xl font-extrabold">{category.name}</p>
                      <ul className="grid grid-cols-2 gap-x-8 gap-y-1 font-sans text-sm font-normal normal-case tracking-normal lg:grid-cols-3">
                        {category.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block rounded-card px-3 py-2 hover:bg-surface-muted focus:bg-surface-muted"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-between gap-4 rounded-card bg-stage p-5 font-sans normal-case tracking-normal">
                      {category.image ? (
                        <Image
                          src={`${category.image}?preset=medium`}
                          alt=""
                          width={240}
                          height={160}
                          className="mx-auto h-32 w-auto object-contain"
                        />
                      ) : null}
                      <ArrowLink href={category.href}>Tout voir</ArrowLink>
                    </div>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
          {cms.header.map((link) => (
            <li key={link.url}>
              <Link
                href={link.url}
                className="inline-flex h-full items-center px-3 py-3 hover:text-ink-muted"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
