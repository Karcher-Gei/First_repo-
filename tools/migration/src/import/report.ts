/** Counts and warnings collected during an import, printed at the end and written to out/. */
export class Report {
  private readonly counts = new Map<string, number>();
  readonly warnings: string[] = [];

  count(what: string, by = 1): void {
    this.counts.set(what, (this.counts.get(what) ?? 0) + by);
  }

  warn(message: string): void {
    this.warnings.push(message);
    console.warn(`  ! ${message}`);
  }

  summary(): string {
    const lines = [...this.counts].map(([what, n]) => `${String(n).padStart(6)}  ${what}`);
    lines.push(`${String(this.warnings.length).padStart(6)}  warnings`);
    return lines.join('\n');
  }

  toText(): string {
    return `${this.summary()}\n\nWarnings:\n${this.warnings.map((w) => `- ${w}`).join('\n') || '(none)'}\n`;
  }
}
