import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { test as base, expect, type Page } from '@playwright/test';

import { FC3, MAILBOX } from './env';

/** Every spec fails on a JavaScript error in the page or a 5xx response. */
export const test = base.extend<{ failOnErrors: void }>({
  failOnErrors: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      page.on('response', (response) => {
        if (response.status() >= 500) {
          problems.push(`${response.status()} ${response.url()}`);
        }
      });
      await use();
      expect(problems).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** "1 311,125 DT" -> 1311125 millimes. */
export function millimes(text: string): number {
  const match = /(\d[\d\s  ]*),(\d{3})/.exec(text);
  if (!match) {
    throw new Error(`No price in "${text}"`);
  }
  return Number(match[1]!.replace(/\D/g, '')) * 1000 + Number(match[2]);
}

/** Text without React's markers and with spaces collapsed, for comparing totals. */
export function digits(text: string | null): string {
  return (text ?? '').replace(/\s/g, '');
}

export function formatted(value: number): string {
  return `${Math.floor(value / 1000)},${String(value % 1000).padStart(3, '0')}`;
}

export async function addToCart(page: Page, productPath = FC3.path, quantity = 1): Promise<void> {
  await page.goto(productPath);
  if (quantity !== 1) {
    await page.locator('main input[name=quantity]').first().fill(String(quantity));
  }
  await page.getByRole('button', { name: 'Ajouter au panier' }).first().click();
  await expect(page.getByText('Produit ajouté au panier.').first()).toBeVisible();
}

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

export async function fillCheckout(page: Page, a: CheckoutAddress): Promise<void> {
  await page.goto('/commande');
  await page.fill('input[name=firstName]', a.firstName);
  await page.fill('input[name=lastName]', a.lastName);
  await page.fill('input[name=emailAddress]', a.email);
  await page.fill('input[name=streetLine1]', a.street);
  await page.fill('input[name=city]', a.city);
  await page.selectOption('select[name=province]', a.province);
  await page.fill('input[name=postalCode]', a.postalCode);
  await page.fill('input[name=phoneNumber]', a.phone);
}

export function uniqueEmail(name: string): string {
  return `${name}.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.tn`;
}

/** The token of the last e-mail sent to `email` with a link to `linkPath`, from Vendure's dev mailbox. */
export async function tokenFromMail(email: string, linkPath: string): Promise<string> {
  const pattern = new RegExp(`${linkPath}\\?token=([^"&\\s]+)`);
  for (let attempt = 0; attempt < 40; attempt++) {
    const files = (await readdir(MAILBOX)).sort().reverse();
    for (const file of files) {
      const mail = JSON.parse(await readFile(path.join(MAILBOX, file), 'utf8')) as {
        recipient: string;
        body: string;
      };
      const match = pattern.exec(mail.body);
      if (mail.recipient === email && match) {
        return match[1]!;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No e-mail to ${email} with a ${linkPath} link`);
}
