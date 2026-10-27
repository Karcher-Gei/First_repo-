import { cn } from '@karcher/ui';
import Link from 'next/link';

/** Page links; `hrefFor` builds the URL of a page, keeping filters and sort. */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) {
    return null;
  }
  // First, last, and two pages around the current one.
  const pages = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pageCount])]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const item =
    'inline-flex min-w-10 items-center justify-center rounded-card border border-line px-3 py-2';
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2 text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={item}>
          ← Précédent
        </Link>
      ) : null}
      {pages.map((p, index) => (
        <span key={p} className="contents">
          {index > 0 && p - pages[index - 1]! > 1 ? (
            <span className="px-1 text-ink-muted">…</span>
          ) : null}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(item, p === page && 'border-ink bg-ink text-white')}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={item}>
          Suivant →
        </Link>
      ) : null}
    </nav>
  );
}
