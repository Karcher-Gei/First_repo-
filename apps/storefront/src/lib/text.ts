/** Text content of catalog HTML, for meta descriptions and short summaries. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The first `max` characters of `text`, cut on a word, with an ellipsis when shortened. */
export function excerpt(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).trimEnd()}…`;
}
