import { vendureFetch } from '@karcher/graphql';
import { Button } from '@karcher/ui';
import { redirect } from 'next/navigation';

import { SUBMIT_FORM } from '@/lib/queries';

async function submitContact(formData: FormData) {
  'use server';
  const text = (name: string) => String(formData.get(name) ?? '').trim();
  await vendureFetch(
    SUBMIT_FORM,
    {
      input: {
        form: 'contact',
        fullName: text('fullName'),
        email: text('email'),
        phone: text('phone') || null,
        fields: { message: text('message') },
      },
    },
    { url: process.env.VENDURE_SHOP_API_URL ?? 'http://localhost:3000/shop-api', init: { cache: 'no-store' } },
  );
  redirect('/nous-contacter?envoye=1');
}

/** Contact form; submissions are stored by Vendure's FormsPlugin and listed in the dashboard. */
export function ContactForm({ sent }: { sent: boolean }) {
  if (sent) {
    return <p className="rounded-card bg-surface-muted p-4">Merci, votre message a bien été envoyé.</p>;
  }
  const field = 'w-full rounded-card border border-line px-3 py-2';
  return (
    <form action={submitContact} className="max-w-xl space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Nom complet</span>
        <input name="fullName" required autoComplete="name" className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">E-mail</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Téléphone</span>
        <input name="phone" type="tel" autoComplete="tel" className={field} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Message</span>
        <textarea name="message" required rows={5} className={field} />
      </label>
      <Button type="submit">Envoyer</Button>
    </form>
  );
}
