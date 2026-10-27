import Link from 'next/link';

import { logout } from '@/app/(frontend)/compte/actions';

const LINKS = [
  { href: '/compte', label: 'Mes informations' },
  { href: '/compte/commandes', label: 'Mes commandes' },
  { href: '/compte/adresses', label: 'Mes adresses' },
];

export function AccountNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Mon compte"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-3 text-sm"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === current ? 'page' : undefined}
          className={
            link.href === current
              ? 'font-bold underline decoration-brand decoration-4'
              : 'hover:underline'
          }
        >
          {link.label}
        </Link>
      ))}
      <form action={logout} className="ml-auto">
        <button type="submit" className="text-ink-muted hover:underline">
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
