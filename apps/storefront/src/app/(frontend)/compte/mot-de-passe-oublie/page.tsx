import type { Metadata } from 'next';

import { ActionForm, Field, SubmitButton } from '@/components/forms';

import { requestPasswordReset } from '../actions';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function ForgotPasswordPage() {
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-3xl font-black uppercase">Mot de passe oublié</h1>
      <p>
        Saisissez l’adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un
        nouveau mot de passe.
      </p>
      <ActionForm action={requestPasswordReset}>
        <Field label="E-mail" name="emailAddress" type="email" required autoComplete="email" />
        <SubmitButton>Envoyer le lien</SubmitButton>
      </ActionForm>
    </section>
  );
}
