import type { Metadata } from 'next';

import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { getActiveCustomer } from '@/lib/account';

import { registerWarranty } from './actions';

export const metadata: Metadata = {
  title: 'Enregistrer ma garantie',
  description:
    'Enregistrez votre machine Kärcher pour la garantie : référence, numéro de série et date d’achat.',
};

export default async function WarrantyPage() {
  const customer = await getActiveCustomer();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className="max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black uppercase">Enregistrer ma garantie</h1>
        <p>
          La référence (par exemple 1.673-535.0) et le numéro de série se trouvent sur la plaque
          signalétique de la machine.
        </p>
      </header>
      <ActionForm action={registerWarranty}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nom complet"
            name="fullName"
            required
            autoComplete="name"
            defaultValue={customer ? `${customer.firstName} ${customer.lastName}` : ''}
          />
          <Field
            label="E-mail"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={customer?.emailAddress ?? ''}
          />
          <Field
            label="Téléphone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={customer?.phoneNumber ?? ''}
          />
          <Field
            label="Référence de la machine"
            name="productSku"
            required
            placeholder="1.673-535.0"
          />
          <Field label="Numéro de série" name="serialNumber" required />
          <Field label="Date d’achat" name="purchaseDate" type="date" required max={today} />
          <div className="sm:col-span-2">
            <Field label="Acheté chez" name="purchasedFrom" placeholder="Magasin ou revendeur" />
          </div>
        </div>
        <SubmitButton>Enregistrer</SubmitButton>
      </ActionForm>
    </section>
  );
}
