import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-3xl font-black">Page introuvable</h1>
      <p className="text-ink-muted">Cette page n’existe pas ou a été déplacée.</p>
      <Link href="/" className="inline-block font-semibold underline">
        Retour à l’accueil
      </Link>
    </section>
  );
}
