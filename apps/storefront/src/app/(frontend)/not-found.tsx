import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl space-y-6 py-16 text-center">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none">
        Page introuvable
      </h1>
      <p className="text-ink-muted">Cette page n’existe pas ou a été déplacée.</p>
      <form action="/recherche" role="search" className="mx-auto flex max-w-md gap-2">
        <label htmlFor="not-found-search" className="sr-only">
          Rechercher un produit
        </label>
        <input
          id="not-found-search"
          name="s"
          type="search"
          placeholder="Rechercher un produit…"
          className="min-w-0 flex-1 rounded-card border border-line px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-card bg-brand px-4 py-2 text-sm font-semibold uppercase hover:bg-brand-dark"
        >
          Rechercher
        </button>
      </form>
      <Link href="/" className="inline-block font-semibold underline">
        Retour à l’accueil
      </Link>
    </section>
  );
}
