import Link from 'next/link';

import { CartLink } from '@/components/cart';

import { getCms } from '@/lib/cms';

export async function Header() {
  const cms = await getCms();
  const navigation = await cms.findGlobal({ slug: 'navigation' });

  return (
    <header className="border-b border-line">
      <div className="bg-brand">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-black uppercase tracking-tight">
            Kärcher <span className="font-medium">Center Tunisie</span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/compte" className="font-semibold">
              Mon compte
            </Link>
            <CartLink />
          </div>
        </div>
      </div>
      <nav aria-label="Menu principal" className="bg-ink text-white">
        <ul className="mx-auto flex max-w-7xl flex-wrap gap-6 px-4 py-3 text-sm font-semibold uppercase">
          {(navigation.header ?? []).map(item => (
            <li key={item.id ?? item.url}>
              <Link href={item.url} className="hover:text-brand">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
