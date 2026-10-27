import type { Metadata } from 'next';

import { AccountNav } from '@/components/AccountNav';
import { AddressFields } from '@/components/AddressFields';
import { ActionForm, SubmitButton } from '@/components/forms';
import { requireCustomer } from '@/lib/account';
import { CUSTOMER_ADDRESSES } from '@/lib/account-queries';
import { shopSessionQuery } from '@/lib/session';

import { addAddress, deleteAddress, setDefaultAddress } from '../actions';

export const metadata: Metadata = { title: 'Mes adresses' };

export default async function AddressesPage() {
  const customer = await requireCustomer('/compte/adresses');
  const { activeCustomer } = await shopSessionQuery(CUSTOMER_ADDRESSES, {});
  const addresses = activeCustomer?.addresses ?? [];

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-4xl font-extrabold uppercase leading-none md:text-5xl">
        Mes adresses
      </h1>
      <AccountNav current="/compte/adresses" />
      {addresses.length === 0 ? <p>Aucune adresse enregistrée.</p> : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <li key={address.id} className="space-y-3 rounded-card border border-line p-4 text-sm">
            <address className="not-italic">
              <strong>{address.fullName}</strong>
              {address.defaultShippingAddress ? (
                <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold">
                  Par défaut
                </span>
              ) : null}
              <br />
              {address.streetLine1}
              {address.streetLine2 ? (
                <>
                  <br />
                  {address.streetLine2}
                </>
              ) : null}
              <br />
              {address.postalCode} {address.city}, {address.province}
              <br />
              {address.phoneNumber}
            </address>
            <div className="flex gap-4">
              {address.defaultShippingAddress ? null : (
                <ActionForm action={setDefaultAddress} className="space-y-1">
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" className="underline">
                    Utiliser par défaut
                  </button>
                </ActionForm>
              )}
              <ActionForm action={deleteAddress} className="space-y-1">
                <input type="hidden" name="id" value={address.id} />
                <button type="submit" className="text-ink-muted underline hover:text-danger">
                  Supprimer
                </button>
              </ActionForm>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <h2 className="font-heading text-2xl font-bold uppercase">Ajouter une adresse</h2>
        <ActionForm action={addAddress}>
          <AddressFields
            values={{
              fullName: `${customer.firstName} ${customer.lastName}`,
              phoneNumber: customer.phoneNumber,
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="default" defaultChecked={addresses.length === 0} />
            Adresse par défaut
          </label>
          <SubmitButton>Ajouter</SubmitButton>
        </ActionForm>
      </div>
    </section>
  );
}
