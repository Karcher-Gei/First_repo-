import { Field } from './forms';

/** The 24 governorates, stored in Vendure's `province` address field. */
export const GOVERNORATES = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Le Kef',
  'Mahdia',
  'La Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
] as const;

export interface AddressValues {
  fullName?: string | null;
  streetLine1?: string | null;
  streetLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
}

/** Address inputs named after Vendure's CreateAddressInput fields; read them back with `addressFromForm`. */
export function AddressFields({
  values = {},
  withName = true,
}: {
  values?: AddressValues;
  withName?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {withName ? (
        <div className="sm:col-span-2">
          <Field
            label="Nom complet"
            name="fullName"
            required
            autoComplete="name"
            defaultValue={values.fullName ?? ''}
          />
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Field
          label="Adresse"
          name="streetLine1"
          required
          autoComplete="address-line1"
          defaultValue={values.streetLine1 ?? ''}
        />
      </div>
      <div className="sm:col-span-2">
        <Field
          label="Complément d’adresse"
          name="streetLine2"
          autoComplete="address-line2"
          defaultValue={values.streetLine2 ?? ''}
        />
      </div>
      <Field
        label="Ville"
        name="city"
        required
        autoComplete="address-level2"
        defaultValue={values.city ?? ''}
      />
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Gouvernorat</span>
        <select
          name="province"
          required
          defaultValue={values.province ?? ''}
          className="w-full rounded-card border border-line bg-surface px-3 py-2"
        >
          <option value="" disabled>
            Choisir…
          </option>
          {GOVERNORATES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Code postal"
        name="postalCode"
        required
        inputMode="numeric"
        pattern="[0-9]{4}"
        title="4 chiffres"
        autoComplete="postal-code"
        defaultValue={values.postalCode ?? ''}
      />
      <Field
        label="Téléphone"
        name="phoneNumber"
        type="tel"
        required
        autoComplete="tel"
        defaultValue={values.phoneNumber ?? ''}
      />
    </div>
  );
}
