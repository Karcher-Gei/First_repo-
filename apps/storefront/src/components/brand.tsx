import { cn } from '@karcher/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** Wordmark: KÄRCHER on the slanted yellow shape, then the shop's name. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('inline-flex shrink-0 items-center gap-2', className)}
      aria-label="Kärcher Center Tunisie, accueil"
    >
      <span className="slant bg-brand px-4 py-1 font-heading text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
        Kärcher
      </span>
      <span
        className={cn(
          'font-heading text-sm font-semibold uppercase leading-[1.05] tracking-wide',
          inverted ? 'text-white' : 'text-ink',
        )}
      >
        Center
        <br />
        Tunisie
      </span>
    </Link>
  );
}

/** Centred page-width wrapper, for content inside full-bleed sections. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4', className)}>{children}</div>;
}

/** Section title with Kärcher's slanted yellow mark, an optional kicker line and a "see all" link. */
export function SectionHeading({
  title,
  kicker,
  action,
  id,
  inverted = false,
}: {
  title: ReactNode;
  kicker?: ReactNode;
  action?: { href: string; label: string };
  id?: string;
  inverted?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        {kicker ? (
          <p
            className={cn(
              'text-xs font-bold uppercase tracking-[0.2em]',
              inverted ? 'text-brand' : 'text-ink-muted',
            )}
          >
            {kicker}
          </p>
        ) : null}
        <h2
          id={id}
          className={cn(
            'flex items-center gap-3 font-heading text-3xl font-extrabold uppercase leading-none md:text-4xl',
            inverted && 'text-white',
          )}
        >
          <span aria-hidden="true" className="slant inline-block h-6 w-5 bg-brand md:h-7" />
          {title}
        </h2>
      </div>
      {action ? (
        <ArrowLink href={action.href} inverted={inverted}>
          {action.label}
        </ArrowLink>
      ) : null}
    </div>
  );
}

export function ArrowLink({
  href,
  children,
  inverted = false,
}: {
  href: string;
  children: ReactNode;
  inverted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide',
        inverted ? 'text-white hover:text-brand' : 'text-ink hover:underline',
      )}
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

const CTA_STYLES = {
  primary: 'bg-brand text-ink hover:bg-brand-dark',
  dark: 'bg-ink text-white hover:bg-anthracite',
  outline: 'border-2 border-current bg-transparent hover:bg-white/10',
} as const;

/** Link styled as Kärcher's square, bold call-to-action button. */
export function CtaLink({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof CTA_STYLES;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card px-6 py-3 font-heading text-lg font-bold uppercase tracking-wide transition-colors',
        CTA_STYLES[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
