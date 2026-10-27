import Link from 'next/link';

import { getCategoryMenu, getCmsNavigation } from '@/lib/navigation';

interface FooterColumn {
  title: string;
  links: { label: string; url: string }[];
}

const SERVICES: FooterColumn = {
  title: 'Services',
  links: [
    { label: 'Demande de devis', url: '/devis' },
    { label: 'Enregistrer ma garantie', url: '/garantie' },
    { label: 'Nos magasins', url: '/magasins' },
    { label: 'Nous contacter', url: '/nous-contacter' },
  ],
};

const ACCOUNT: FooterColumn = {
  title: 'Mon compte',
  links: [
    { label: 'Mon compte', url: '/compte' },
    { label: 'Mes commandes', url: '/compte/commandes' },
    { label: 'Mon panier', url: '/panier' },
  ],
};

/** Footer columns from the CMS; until staff set them, the categories, services and account links. */
export async function Footer() {
  const [cms, categories] = await Promise.all([getCmsNavigation(), getCategoryMenu()]);
  const columns: FooterColumn[] =
    cms.footer.length > 0
      ? cms.footer
      : [
          {
            title: 'Nos produits',
            links: categories.slice(0, 6).map((c) => ({ label: c.name, url: c.href })),
          },
          SERVICES,
          ACCOUNT,
        ];

  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="text-lg font-black uppercase leading-none">
            Kärcher <span className="font-medium">Center Tunisie</span>
          </p>
          <p className="text-sm text-white/70">
            Distributeur officiel Kärcher en Tunisie : nettoyeurs haute pression, aspirateurs et
            équipements de nettoyage pour particuliers et professionnels.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3 text-sm font-bold uppercase text-brand">{column.title}</h2>
            <ul className="space-y-2 text-sm">
              {column.links.map((item) => (
                <li key={item.url}>
                  <Link href={item.url} className="text-white/85 hover:text-brand">
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
