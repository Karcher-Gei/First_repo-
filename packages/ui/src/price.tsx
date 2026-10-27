const formatter = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 3,
});

/** Formats a Vendure amount in millimes (minor units): 1542000 -> "1 542,000 DT". */
export function formatPrice(millimes: number): string {
  return formatter.format(millimes / 1000);
}

export function Price({ value, previous }: { value: number; previous?: number | null }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-bold">{formatPrice(value)}</span>
      {previous && previous > value ? (
        <del className="text-sm font-normal text-ink-muted">
          <span className="sr-only">au lieu de </span>
          {formatPrice(previous)}
        </del>
      ) : null}
    </span>
  );
}
