import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { getActiveCustomer, safeReturnPath } from '@/lib/account';

import { login } from '../actions';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ retour?: string }>;
}) {
  const returnTo = safeReturnPath((await searchParams).retour);
  if (await getActiveCustomer()) {
    redirect(returnTo);
  }
  return (
    <section className="grid gap-10 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-3xl font-black uppercase">Connexion</h1>
        <ActionForm action={login}>
          <input type="hidden" name="retour" value={returnTo} />
          <Field label="E-mail" name="emailAddress" type="email" required autoComplete="email" />
          <Field
            label="Mot de passe"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          <SubmitButton>Se connecter</SubmitButton>
        </ActionForm>
        <Link href="/compte/mot-de-passe-oublie" className="inline-block text-sm underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <div className="h-fit space-y-3 rounded-card bg-surface-muted p-6">
        <h2 className="text-lg font-bold">Nouveau client ?</h2>
        <p className="text-sm">
          Créez un compte pour suivre vos commandes et enregistrer vos adresses.
        </p>
        <Link href="/compte/inscription" className="inline-block font-semibold underline">
          Créer un compte
        </Link>
      </div>
    </section>
  );
}
