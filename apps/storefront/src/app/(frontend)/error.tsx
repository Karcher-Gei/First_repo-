'use client';

import { Button } from '@karcher/ui';
import Link from 'next/link';
import { useEffect } from 'react';

/** Shown when a page fails to render, typically when Vendure or the CMS cannot be reached. */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none">
        Un problème est survenu
      </h1>
      <p className="text-ink-muted">
        La page n’a pas pu s’afficher. Réessayez dans un instant ; si le problème continue,
        contactez-nous.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>Réessayer</Button>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 text-sm font-semibold underline"
        >
          Retour à l’accueil
        </Link>
      </div>
    </section>
  );
}
