import type { Metadata } from 'next';

import { ActionForm, SubmitButton } from '@/components/forms';

import { verifyAccount } from '../actions';

export const metadata: Metadata = { title: 'Activer mon compte' };

/** Link of the account activation e-mail. A button, so link scanners in mailboxes cannot use the token. */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-3xl font-black uppercase">Activer mon compte</h1>
      {token ? (
        <ActionForm action={verifyAccount}>
          <input type="hidden" name="token" value={token} />
          <SubmitButton>Activer mon compte</SubmitButton>
        </ActionForm>
      ) : (
        <p>Ce lien d’activation est incomplet : ouvrez-le de nouveau depuis l’e-mail reçu.</p>
      )}
    </section>
  );
}
