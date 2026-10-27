/** Placeholder while a page loads: a heading and a grid of product-card shapes. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div className="h-4 w-48 rounded bg-surface-muted" />
      <div className="h-9 w-72 rounded bg-surface-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-card border border-line p-4">
            <div className="aspect-square rounded-card bg-surface-muted" />
            <div className="h-4 w-3/4 rounded bg-surface-muted" />
            <div className="h-4 w-1/3 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
