import Link from 'next/link';

import { getCms } from '@/lib/cms';

export async function Footer() {
  const cms = await getCms();
  const navigation = await cms.findGlobal({ slug: 'navigation' });

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {(navigation.footer ?? []).map(column => (
          <div key={column.id ?? column.title}>
            <h2 className="mb-3 text-sm font-bold uppercase text-brand">{column.title}</h2>
            <ul className="space-y-2 text-sm">
              {(column.links ?? []).map(item => (
                <li key={item.id ?? item.url}>
                  <Link href={item.url} className="hover:text-brand">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Karcher Tunisie, distributeur officiel
      </p>
    </footer>
  );
}
