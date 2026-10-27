import Link from 'next/link';

export interface Crumb {
  name: string;
  href: string | null;
}

/**
 * Trail from the homepage; the last crumb is the current page. Pair it with breadcrumbJsonLd.
 * `inverted` for a dark background.
 */
export function Breadcrumbs({ items, inverted = false }: { items: Crumb[]; inverted?: boolean }) {
  const current = inverted ? 'text-white' : 'text-ink';
  const hover = inverted ? 'hover:text-white' : 'hover:text-ink';
  return (
    <nav
      aria-label="Fil d’Ariane"
      className={`text-sm ${inverted ? 'text-white/70' : 'text-ink-muted'}`}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${index}-${item.name}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && !last ? (
                <Link href={item.href} className={`${hover} hover:underline`}>
                  {item.name}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={last ? current : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
