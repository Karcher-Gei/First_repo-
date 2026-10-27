import Link from 'next/link';

import { getCategoryMenu, getCmsNavigation } from '@/lib/navigation';

import { Logo } from './brand';
import { LockIcon, ShieldIcon, WrenchIcon } from './icons';

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
    <footer className="mt-20 bg-anthracite text-white">
      <div className="h-1.5 bg-brand" />
      <div className="mx-auto max-w-7xl px-4">
        <ul className="grid gap-6 border-b border-white/10 py-8 text-sm sm:grid-cols-3">
          <li className="flex items-center gap-3">
            <ShieldIcon className="text-brand" /> Distributeur officiel Kärcher en Tunisie
          </li>
          <li className="flex items-center gap-3">
            <WrenchIcon className="text-brand" /> Garantie constructeur et service après-vente
          </li>
          <li className="flex items-center gap-3">
            <LockIcon className="text-brand" /> Paiement sécurisé par carte, e-DINAR ou wallet
          </li>
        </ul>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo inverted />
            <p className="max-w-xs text-sm text-white/65">
              Nettoyeurs haute pression, aspirateurs et équipements de nettoyage Kärcher pour les
              particuliers et les professionnels.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="mb-4 font-heading text-lg font-bold uppercase tracking-wide text-brand">
                {column.title}
              </h2>
              <ul className="space-y-2.5 text-sm">
                {column.links.map((item) => (
                  <li key={item.url}>
                    <Link href={item.url} className="text-white/80 hover:text-brand">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Karcher Tunisie, distributeur officiel Kärcher
      </p>
    </footer>
  );
}
