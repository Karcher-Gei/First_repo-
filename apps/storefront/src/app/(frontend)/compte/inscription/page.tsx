import type { Metadata } from 'next';
import Link from 'next/link';

import { ActionForm, Field, SubmitButton } from '@/components/forms';

import { register } from '../actions';

export const metadata: Metadata = { title: 'Créer un compte' };

export default function RegisterPage() {
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-3xl font-black uppercase">Créer un compte</h1>
      <ActionForm action={register}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" required autoComplete="given-name" />
          <Field label="Nom" name="lastName" required autoComplete="family-name" />
        </div>
        <Field label="E-mail" name="emailAddress" type="email" required autoComplete="email" />
        <Field label="Téléphone" name="phoneNumber" type="tel" autoComplete="tel" />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          hint="8 caractères minimum."
        />
        <SubmitButton>Créer mon compte</SubmitButton>
      </ActionForm>
      <p className="text-sm">
        Déjà inscrit ?{' '}
        <Link href="/compte/connexion" className="font-semibold underline">
          Connectez-vous
        </Link>
      </p>
    </section>
  );
}
