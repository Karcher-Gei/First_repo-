import { cn } from '@karcher/ui';
import Link from 'next/link';

import { LockIcon, ShieldIcon, TruckIcon, WrenchIcon } from './icons';

const ITEMS = [
  {
    Icon: ShieldIcon,
    title: 'Distributeur officiel',
    text: 'Produits Kärcher d’origine',
    href: null,
  },
  {
    Icon: LockIcon,
    title: 'Paiement sécurisé',
    text: 'Carte bancaire, e-DINAR ou wallet',
    href: null,
  },
  {
    Icon: WrenchIcon,
    title: 'Garantie constructeur',
    text: 'Enregistrez votre machine',
    href: '/garantie',
  },
  {
    Icon: TruckIcon,
    title: 'Professionnels',
    text: 'Devis pour les grandes quantités',
    href: '/devis',
  },
] as const;

/** What the shop offers, with links to the matching services. */
export function ServiceHighlights({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={cn(
        'grid gap-4',
        compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4',
      )}
    >
      {ITEMS.map(({ Icon, title, text, href }) => {
        const body = (
          <>
            <Icon className="shrink-0" />
            <span>
              <span className="block text-sm font-bold">{title}</span>
              <span className="block text-xs text-ink-muted">{text}</span>
            </span>
          </>
        );
        return (
          <li key={title}>
            {href ? (
              <Link
                href={href}
                className="flex h-full items-start gap-3 rounded-card bg-surface-muted p-4 hover:bg-line/60"
              >
                {body}
              </Link>
            ) : (
              <div className="flex h-full items-start gap-3 rounded-card bg-surface-muted p-4">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
