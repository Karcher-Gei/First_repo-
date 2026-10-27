import type { Metadata } from 'next';

import { AccountNav } from '@/components/AccountNav';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { requireCustomer } from '@/lib/account';

import { changePassword, requestEmailChange, updateProfile } from './actions';

export const metadata: Metadata = { title: 'Mon compte' };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ active?: string }>;
}) {
  const [customer, { active }] = await Promise.all([requireCustomer('/compte'), searchParams]);
  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
          Bonjour {customer.firstName}
        </h1>
        {active ? <p className="text-success">Votre compte est activé. Bienvenue !</p> : null}
      </header>
      <AccountNav current="/compte" />

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-heading text-2xl font-bold uppercase">Mes informations</h2>
          <ActionForm action={updateProfile}>
            <Field
              label="Prénom"
              name="firstName"
              required
              defaultValue={customer.firstName}
              autoComplete="given-name"
            />
            <Field
              label="Nom"
              name="lastName"
              required
              defaultValue={customer.lastName}
              autoComplete="family-name"
            />
            <Field
              label="Téléphone"
              name="phoneNumber"
              type="tel"
              defaultValue={customer.phoneNumber ?? ''}
              autoComplete="tel"
            />
            <SubmitButton>Enregistrer</SubmitButton>
          </ActionForm>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-bold uppercase">Mot de passe</h2>
            <ActionForm action={changePassword}>
              <Field
                label="Mot de passe actuel"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
              <Field
                label="Nouveau mot de passe"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <SubmitButton variant="secondary">Changer le mot de passe</SubmitButton>
            </ActionForm>
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-bold uppercase">Adresse e-mail</h2>
            <p className="text-sm">
              Actuelle : <strong>{customer.emailAddress}</strong>
            </p>
            <ActionForm action={requestEmailChange}>
              <Field
                label="Nouvelle adresse e-mail"
                name="newEmailAddress"
                type="email"
                required
                autoComplete="email"
              />
              <Field
                label="Mot de passe"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
              <SubmitButton variant="secondary">Changer d’adresse</SubmitButton>
            </ActionForm>
          </div>
        </div>
      </div>
    </section>
  );
}
