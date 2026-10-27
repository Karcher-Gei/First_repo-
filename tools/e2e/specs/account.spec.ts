import { addToCart, expect, test, tokenFromMail, uniqueEmail } from '../support/test';

test('account lifecycle: register, addresses, sign in, order, password reset, e-mail change', async ({
  page,
  browser,
}) => {
  const email = uniqueEmail('nour');

  await test.step('register and activate from the e-mail', async () => {
    await page.goto('/compte/inscription');
    await page.fill('input[name=firstName]', 'Nour');
    await page.fill('input[name=lastName]', 'Gharbi');
    await page.fill('input[name=emailAddress]', email);
    await page.fill('input[name=password]', 'motdepasse1');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();
    await expect(page.locator('form [role=status]')).toBeVisible();
    const token = await tokenFromMail(email, '/compte/verification');
    await page.goto(`/compte/verification?token=${token}`);
    await page.getByRole('button', { name: 'Activer mon compte' }).click();
    await expect(page).toHaveURL(/\/compte\?active=1/);
  });

  await test.step('profile and addresses', async () => {
    await page.fill('input[name=phoneNumber]', '+216 22 111 222');
    await page.locator('main').getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Vos informations sont enregistrées.')).toBeVisible();

    await page.goto('/compte/adresses');
    for (const [street, city, postalCode] of [
      ['3 rue Ibn Khaldoun', 'Sfax', '3000'],
      ['9 avenue de la Liberté', 'Tunis', '1002'],
    ] as const) {
      await page.fill('input[name=streetLine1]', street);
      await page.fill('input[name=city]', city);
      await page.selectOption('select[name=province]', city);
      await page.fill('input[name=postalCode]', postalCode);
      await page.getByRole('button', { name: 'Ajouter' }).click();
      await expect(page.getByText(street)).toBeVisible();
    }
    await page.getByRole('button', { name: 'Utiliser par défaut' }).first().click();
    await expect(
      page.locator('li').filter({ hasText: 'Liberté' }).filter({ hasText: 'Par défaut' }),
    ).toBeVisible();
  });

  await test.step('sign out, wrong password, sign in back to the requested page', async () => {
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL('/');
    await page.goto('/compte/commandes');
    await expect(page).toHaveURL(/\/compte\/connexion\?retour=/);
    await page.fill('input[name=emailAddress]', email);
    await page.fill('input[name=password]', 'mauvais');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.locator('form [role=alert]')).toContainText('mot de passe incorrect');
    // The e-mail address survives the failed attempt.
    await expect(page.locator('input[name=emailAddress]')).toHaveValue(email);
    await page.fill('input[name=password]', 'motdepasse1');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/compte\/commandes$/);
  });

  await test.step('checkout prefilled from the default address, order in the history', async () => {
    await addToCart(page);
    await page.goto('/commande');
    await expect(page.locator('input[name=streetLine1]')).toHaveValue('9 avenue de la Liberté');
    await page.check('input[name=paymentMethod][value=test]');
    await page.getByRole('button', { name: 'Commander et payer' }).click();
    await expect(page).toHaveURL(/\/commande\/confirmation\//);
    const code = page.url().split('/').pop()!;
    await page.goto('/compte/commandes');
    await expect(page.locator('table')).toContainText(code);
    await page.getByRole('link', { name: code }).click();
    await expect(page).toHaveURL(new RegExp(code));
  });

  await test.step('a guest cannot check out with a registered e-mail address', async () => {
    const guest = await (await browser.newContext()).newPage();
    await addToCart(guest);
    await guest.goto('/commande');
    await guest.fill('input[name=firstName]', 'X');
    await guest.fill('input[name=lastName]', 'Y');
    await guest.fill('input[name=emailAddress]', email);
    await guest.fill('input[name=streetLine1]', '1 rue');
    await guest.fill('input[name=city]', 'Tunis');
    await guest.selectOption('select[name=province]', 'Tunis');
    await guest.fill('input[name=postalCode]', '1000');
    await guest.fill('input[name=phoneNumber]', '20000000');
    await guest.check('input[name=paymentMethod][value=test]');
    await guest.getByRole('button', { name: 'Commander et payer' }).click();
    await expect(guest.locator('form [role=alert]')).toBeVisible();
    await guest.context().close();
  });

  await test.step('forgotten password', async () => {
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await page.goto('/compte/mot-de-passe-oublie');
    await page.fill('input[name=emailAddress]', email);
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    await expect(page.locator('form [role=status]')).toBeVisible();
    const token = await tokenFromMail(email, '/compte/mot-de-passe');
    await page.goto(`/compte/mot-de-passe?token=${token}`);
    await page.fill('input[name=password]', 'nouveaumdp2');
    await page.locator('main').getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page).toHaveURL('/compte');
  });

  await test.step('e-mail address change', async () => {
    const newEmail = `new.${email}`;
    await page.fill('input[name=newEmailAddress]', newEmail);
    await page.fill('form:has(input[name=newEmailAddress]) input[name=password]', 'nouveaumdp2');
    await page.getByRole('button', { name: 'Changer d’adresse' }).click();
    await expect(page.getByText('pour confirmer le changement')).toBeVisible();
    const token = await tokenFromMail(newEmail, '/compte/verification-email');
    await page.goto(`/compte/verification-email?token=${token}`);
    await page.getByRole('button', { name: 'Confirmer la nouvelle adresse' }).click();
    await expect(page.locator('form [role=status]')).toBeVisible();
    await page.goto('/compte');
    await expect(page.locator('main')).toContainText(newEmail);
  });
});
