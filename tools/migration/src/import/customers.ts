import { randomBytes } from 'node:crypto';

import pg from 'pg';

import type { PrestaShopReader, PsAddress, PsCustomer } from '../prestashop';
import { orNull } from '../util';
import type { VendureAdmin } from '../vendure-admin';
import type { Report } from './report';

/** A customer whose password could not be carried over: they sign in after "Mot de passe oublié". */
export interface PasswordResetRow {
  email: string;
  firstName: string;
  lastName: string;
  reason: string;
}

/**
 * PrestaShop 1.7+ hashes passwords with PHP's password_hash (bcrypt, "$2y$"). Vendure checks
 * bcrypt hashes with the node bcrypt package, which only accepts the "$2b$" spelling of the same
 * algorithm. PrestaShop 1.6 used MD5 with the shop's cookie key, which cannot be carried over.
 */
export function vendurePasswordHash(prestashopHash: string): string | null {
  return /^\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}$/.test(prestashopHash)
    ? prestashopHash.replace(/^\$2[ay]\$/, '$2b$')
    : null;
}

/**
 * Creates registered PrestaShop customers in Vendure with their password hash and addresses.
 * Customers already in Vendure (same e-mail) are left untouched, so the import can run again.
 */
export async function importCustomers(
  ps: PrestaShopReader,
  admin: VendureAdmin,
  vendureDatabaseUrl: string,
  report: Report,
): Promise<PasswordResetRow[]> {
  const db = new pg.Client({ connectionString: vendureDatabaseUrl });
  await db.connect();
  try {
    const existing = new Set(
      (
        await admin.all<{ emailAddress: string }>(
          `query ($skip: Int, $take: Int) { customers(options: { skip: $skip, take: $take }) { totalItems items { emailAddress } } }`,
          (data: { customers: { items: { emailAddress: string }[]; totalItems: number } }) =>
            data.customers,
        )
      ).map((c) => c.emailAddress.toLowerCase()),
    );
    const addresses = new Map<number, PsAddress[]>();
    for (const address of await ps.addresses()) {
      addresses.set(address.id_customer, [...(addresses.get(address.id_customer) ?? []), address]);
    }

    const resets: PasswordResetRow[] = [];
    for (const customer of await ps.customers()) {
      const email = customer.email.trim().toLowerCase();
      if (existing.has(email)) {
        report.count('customers already in Vendure');
        continue;
      }
      existing.add(email);
      try {
        const customerId = await createCustomer(admin, customer, email);
        const hash = customer.active === 1 ? vendurePasswordHash(customer.passwd) : null;
        if (hash) {
          await setPasswordHash(db, customerId, hash);
          report.count('customers created with their password');
        } else {
          resets.push({
            email,
            firstName: customer.firstname,
            lastName: customer.lastname,
            reason: customer.active === 1 ? 'old MD5 password' : 'account inactive in PrestaShop',
          });
          report.count('customers created, password to reset');
        }
        await importAddresses(admin, customerId, addresses.get(customer.id_customer) ?? [], report);
      } catch (error) {
        report.warn(`Customer ${customer.id_customer} (${email}): ${(error as Error).message}`);
      }
    }
    return resets;
  } finally {
    await db.end();
  }
}

async function createCustomer(
  admin: VendureAdmin,
  customer: PsCustomer,
  email: string,
): Promise<string> {
  // A random password makes Vendure create a verified User with a native login; the real hash replaces it next.
  const { createCustomer } = await admin.gql<{
    createCustomer: { __typename: string; id?: string; message?: string };
  }>(
    `mutation ($input: CreateCustomerInput!, $password: String) {
      createCustomer(input: $input, password: $password) {
        __typename ... on Customer { id } ... on ErrorResult { message }
      }
    }`,
    {
      input: { firstName: customer.firstname, lastName: customer.lastname, emailAddress: email },
      password: randomBytes(24).toString('hex'),
    },
  );
  if (!createCustomer.id) {
    throw new Error(createCustomer.message ?? createCustomer.__typename);
  }
  return createCustomer.id;
}

async function setPasswordHash(db: pg.Client, customerId: string, hash: string): Promise<void> {
  const { rowCount } = await db.query(
    `UPDATE authentication_method SET "passwordHash" = $1
     WHERE type = 'NativeAuthenticationMethod'
       AND "userId" = (SELECT "userId" FROM customer WHERE id = $2)`,
    [hash, Number(customerId)],
  );
  if (rowCount !== 1) {
    throw new Error(`password hash not stored (${rowCount} login rows matched)`);
  }
}

/** Addresses in Tunisia; the first becomes the default. PrestaShop states are the governorates. */
async function importAddresses(
  admin: VendureAdmin,
  customerId: string,
  addresses: PsAddress[],
  report: Report,
): Promise<void> {
  const tunisian = addresses.filter((a) => a.country_iso === 'TN');
  if (tunisian.length < addresses.length) {
    report.count('addresses outside Tunisia skipped', addresses.length - tunisian.length);
  }
  for (const [index, address] of tunisian.entries()) {
    await admin.gql(
      `mutation ($customerId: ID!, $input: CreateAddressInput!) {
        createCustomerAddress(customerId: $customerId, input: $input) { id }
      }`,
      {
        customerId,
        input: {
          fullName: `${address.firstname} ${address.lastname}`.trim(),
          streetLine1: address.address1,
          // Vendure's address table stores no NULL here.
          streetLine2: address.address2 ?? '',
          city: address.city,
          province: orNull(address.state_name),
          postalCode: orNull(address.postcode),
          phoneNumber: orNull(address.phone_mobile) ?? orNull(address.phone),
          countryCode: 'TN',
          defaultShippingAddress: index === 0,
          defaultBillingAddress: index === 0,
        },
      },
    );
    report.count('addresses imported');
  }
}
