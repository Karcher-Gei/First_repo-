import type { Metadata } from 'next';
import Link from 'next/link';

import { ActionForm, Field, SubmitButton } from '@/components/forms';

import { resetPassword } from '../actions';

export const metadata: Metadata = { title: 'Nouveau mot de passe' };

/** Link of the password reset e-mail. */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-3xl font-black uppercase">Nouveau mot de passe</h1>
      {token ? (
        <ActionForm action={resetPassword}>
          <input type="hidden" name="token" value={token} />
          <Field
            label="Nouveau mot de passe"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="8 caractères minimum."
          />
          <SubmitButton>Enregistrer</SubmitButton>
        </ActionForm>
      ) : (
        <p>
          Ce lien est incomplet.{' '}
          <Link href="/compte/mot-de-passe-oublie" className="font-semibold underline">
            Demander un nouveau lien
          </Link>
        </p>
      )}
    </section>
  );
}
