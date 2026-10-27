import { redirectOrNotFound } from '@/lib/redirects';

/** Any path no other route matched: a manual redirect from Vendure, else 404. */
export default async function UnmatchedPath({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  return redirectOrNotFound(`/${rest.join('/')}`);
}
