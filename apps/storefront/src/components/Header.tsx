import Link from 'next/link';

import { CartLink } from '@/components/cart';
import { getCategoryMenu, getCmsNavigation } from '@/lib/navigation';

import { ChevronDownIcon, SearchIcon, UserIcon } from './icons';
import { MobileMenu } from './MobileMenu';

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/recherche" role="search" className={className}>
      <label htmlFor="header-search" className="sr-only">
        Rechercher un produit
      </label>
      <div className="flex overflow-hidden rounded-card border border-ink/20 bg-surface focus-within:border-ink">
        <input
          id="header-search"
          name="s"
          type="search"
          placeholder="Rechercher un produit, une référence…"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="px-3 text-ink hover:bg-surface-muted"
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
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-brand">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6">
          <MobileMenu categories={categories} links={cms.header} />
          <Link
            href="/"
            className="shrink-0 text-lg font-black uppercase leading-none tracking-tight md:text-xl"
          >
            Kärcher <span className="font-medium">Center Tunisie</span>
          </Link>
          <SearchForm className="hidden max-w-xl flex-1 md:block" />
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link
              href="/compte"
              className="inline-flex items-center gap-2 font-semibold"
              aria-label="Mon compte"
            >
              <UserIcon />
              <span className="hidden lg:inline">Mon compte</span>
            </Link>
            <CartLink />
          </div>
        </div>
        <SearchForm className="px-4 pb-3 md:hidden" />
      </div>
      <nav aria-label="Catégories" className="hidden bg-ink text-white md:block">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 px-2 text-sm font-semibold uppercase">
          {categories.map((category) => (
            <li key={category.href} className="group relative">
              <Link
                href={category.href}
                className="inline-flex items-center gap-1 px-3 py-3 hover:text-brand group-focus-within:text-brand"
              >
                {category.name}
                {category.children.length > 0 ? <ChevronDownIcon width={16} height={16} /> : null}
              </Link>
              {category.children.length > 0 ? (
                <ul className="invisible absolute left-0 top-full z-50 min-w-64 rounded-b-card bg-surface py-2 text-sm font-normal normal-case text-ink opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {category.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className="block px-4 py-2 hover:bg-surface-muted focus:bg-surface-muted"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-line">
                    <Link
                      href={category.href}
                      className="block px-4 py-2 font-semibold hover:bg-surface-muted"
                    >
                      Tout voir
                    </Link>
                  </li>
                </ul>
              ) : null}
            </li>
          ))}
          {cms.header.map((link) => (
            <li key={link.url}>
              <Link href={link.url} className="inline-block px-3 py-3 hover:text-brand">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
