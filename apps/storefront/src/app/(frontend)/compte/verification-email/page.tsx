import type { Metadata } from 'next';

import { ActionForm, SubmitButton } from '@/components/forms';

import { confirmEmailChange } from '../actions';

export const metadata: Metadata = { title: 'Confirmer mon adresse e-mail' };

/** Link of the e-mail sent to a new address after a change of e-mail. */
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
        Confirmer mon adresse e-mail
      </h1>
      {token ? (
        <ActionForm action={confirmEmailChange}>
          <input type="hidden" name="token" value={token} />
          <SubmitButton>Confirmer la nouvelle adresse</SubmitButton>
        </ActionForm>
      ) : (
        <p>Ce lien est incomplet : ouvrez-le de nouveau depuis l’e-mail reçu.</p>
      )}
    </section>
  );
}
