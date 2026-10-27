'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import type { MenuCategory, MenuLink } from '@/lib/navigation';

import { ChevronDownIcon, CloseIcon, MenuIcon } from './icons';

/** Category menu for small screens, in a modal <dialog> (focus trap and Escape come with it). */
export function MobileMenu({
  categories,
  links,
}: {
  categories: MenuCategory[];
  links: MenuLink[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  // Close after navigating.
  useEffect(() => dialogRef.current?.close(), [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="-ml-1 p-1"
        aria-label="Ouvrir le menu"
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-[85vw] max-w-sm bg-surface p-0 text-ink backdrop:bg-ink/50"
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
      >
        <div className="flex items-center justify-between bg-brand px-4 py-3">
          <span className="font-black uppercase">Menu</span>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fermer le menu"
            className="p-1"
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Catégories">
          <ul className="divide-y divide-line">
            {categories.map((category) =>
              category.children.length > 0 ? (
                <li key={category.href}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold">
                      {category.name}
                      <ChevronDownIcon
                        width={18}
                        height={18}
                        className="transition group-open:rotate-180"
                      />
                    </summary>
                    <ul className="bg-surface-muted pb-2">
                      <li>
                        <Link href={category.href} className="block px-6 py-2 font-semibold">
                          Tout voir
                        </Link>
                      </li>
                      {category.children.map((child) => (
                        <li key={child.href}>
                          <Link href={child.href} className="block px-6 py-2">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ) : (
                <li key={category.href}>
                  <Link href={category.href} className="block px-4 py-3 font-semibold">
                    {category.name}
                  </Link>
                </li>
              ),
            )}
            {links.map((link) => (
              <li key={link.url}>
                <Link href={link.url} className="block px-4 py-3">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/compte" className="block px-4 py-3">
                Mon compte
              </Link>
            </li>
          </ul>
        </nav>
      </dialog>
    </div>
  );
}
