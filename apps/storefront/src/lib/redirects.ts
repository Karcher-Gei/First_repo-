import 'server-only';

import { notFound, permanentRedirect } from 'next/navigation';

import { LEGACY_REDIRECT } from './queries';
import { shopQuery } from './vendure';

/**
 * Last stop for a URL with no page: follow a redirect from Vendure's legacy redirects table
 * (managed in the dashboard), else 404. Entries marked 410 also answer 404 for now.
 */
export async function redirectOrNotFound(path: string | undefined): Promise<never> {
  if (path) {
    const { legacyRedirect } = await shopQuery(LEGACY_REDIRECT, { path }, 60);
    if (legacyRedirect && legacyRedirect.statusCode === 301) {
      permanentRedirect(legacyRedirect.toPath);
    }
  }
  notFound();
}
