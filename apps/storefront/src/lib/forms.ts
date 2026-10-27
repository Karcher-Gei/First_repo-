/** Helpers for reading Server Action form data. */

export function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export function optionalText(formData: FormData, name: string): string | null {
  return text(formData, name) || null;
}

export function missingFields(formData: FormData, names: string[]): boolean {
  return names.some((name) => !text(formData, name));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/** Reads the inputs of <AddressFields> into Vendure's CreateAddressInput for Tunisia. */
export function addressFromForm(formData: FormData, fullName = text(formData, 'fullName')) {
  return {
    fullName,
    streetLine1: text(formData, 'streetLine1'),
    // Vendure's address table stores no NULL here.
    streetLine2: text(formData, 'streetLine2'),
    city: text(formData, 'city'),
    province: text(formData, 'province'),
    postalCode: text(formData, 'postalCode'),
    phoneNumber: text(formData, 'phoneNumber'),
    countryCode: 'TN',
  };
}

export const ADDRESS_REQUIRED = ['streetLine1', 'city', 'province', 'postalCode', 'phoneNumber'];
