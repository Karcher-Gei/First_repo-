import 'server-only';

import { redirect } from 'next/navigation';

import { ACTIVE_CUSTOMER } from './account-queries';
import { shopSessionQuery } from './session';

export async function getActiveCustomer() {
  const { activeCustomer } = await shopSessionQuery(ACTIVE_CUSTOMER, {});
  return activeCustomer;
}

/** The signed-in customer, or a redirect to the login page that comes back to `returnTo`. */
export async function requireCustomer(returnTo: string) {
  const customer = await getActiveCustomer();
  if (!customer) {
    redirect(`/compte/connexion?retour=${encodeURIComponent(returnTo)}`);
  }
  return customer;
}

/** A path on this site to go to after signing in; anything else falls back to the account page. */
export function safeReturnPath(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/compte';
}
