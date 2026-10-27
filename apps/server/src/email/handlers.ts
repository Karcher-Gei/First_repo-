import { ID, OrderStateTransitionEvent, ProductVariantService } from '@vendure/core';
import {
    adminPasswordResetHandler,
    emailAddressChangeHandler,
    EmailEventHandler,
    EmailEventListener,
    emailVerificationHandler,
    orderConfirmationHandler,
    passwordResetHandler,
} from '@vendure/email-plugin';

import { FormSubmittedEvent } from '../plugins/forms/form-submitted.event';
import { QuoteRequestedEvent } from '../plugins/quotes/quote-requested.event';

const FORM_TITLES: Record<string, string> = {
    contact: 'Nouveau message de contact',
    reseller: 'Demande pour devenir revendeur',
    'after-sales': 'Demande au service après-vente',
};

const FIELD_LABELS: Record<string, string> = {
    message: 'Message',
    company: 'Société',
    city: 'Ville',
    product: 'Produit',
    serialNumber: 'Numéro de série',
};

/** Paid orders, as Vendure's order confirmation (a modified order is not new). */
const isNewPaidOrder = (event: OrderStateTransitionEvent) =>
    event.toState === 'PaymentSettled' && event.fromState !== 'Modifying' && !!event.order.customer;

/**
 * Emails in French (templates in email-templates/), plus alerts to the sales team for paid
 * orders, quote requests and form messages when `salesEmail` is set.
 */
export function karcherEmailHandlers(salesEmail: string): Array<EmailEventHandler<any, any>> {
    const customerEmails = [
        orderConfirmationHandler.setSubject('Votre commande {{ order.code }}'),
        emailVerificationHandler.setSubject('Activez votre compte Karcher Tunisie'),
        passwordResetHandler.setSubject('Choisissez un nouveau mot de passe'),
        emailAddressChangeHandler.setSubject('Confirmez votre nouvelle adresse e-mail'),
        adminPasswordResetHandler.setSubject('Nouveau mot de passe administrateur'),
    ];
    if (!salesEmail) {
        return customerEmails;
    }

    const salesOrder = new EmailEventListener('sales-order')
        .on(OrderStateTransitionEvent)
        .filter(isNewPaidOrder)
        .setRecipient(() => salesEmail)
        .setFrom('{{ fromAddress }}')
        .setOptionalAddressFields(event => ({ replyTo: event.order.customer?.emailAddress }))
        .setSubject('Commande {{ order.code }} : {{ formatMoney order.totalWithTax }}')
        .setTemplateVars(event => ({ order: event.order }));

    const salesQuote = new EmailEventListener('sales-quote')
        .on(QuoteRequestedEvent)
        .loadData(async ({ event, injector }) => {
            const ids = event.quote.lines.map(line => line.productVariantId as ID);
            const variants = ids.length
                ? await injector.get(ProductVariantService).findByIds(event.ctx, ids)
                : [];
            return event.quote.lines.map(line => {
                const variant = variants.find(v => String(v.id) === String(line.productVariantId));
                return {
                    quantity: line.quantity,
                    name: variant?.name ?? `Variante ${line.productVariantId}`,
                    sku: variant?.sku ?? '',
                };
            });
        })
        .setRecipient(() => salesEmail)
        .setFrom('{{ fromAddress }}')
        .setOptionalAddressFields(event => ({ replyTo: event.quote.email }))
        .setSubject('Demande de devis : {{ quote.fullName }}{{#if quote.company}} ({{ quote.company }}){{/if}}')
        .setTemplateVars(event => ({ quote: event.quote, lines: event.data }));

    const salesForm = new EmailEventListener('sales-form')
        .on(FormSubmittedEvent)
        .setRecipient(() => salesEmail)
        .setFrom('{{ fromAddress }}')
        .setOptionalAddressFields(event => ({ replyTo: event.submission.email }))
        .setSubject('{{ title }} : {{ submission.fullName }}')
        .setTemplateVars(event => ({
            title: FORM_TITLES[event.submission.form] ?? 'Nouveau message',
            submission: event.submission,
            fields: Object.entries(event.submission.fields).map(([key, value]) => ({
                label: FIELD_LABELS[key] ?? key,
                value,
            })),
        }));

    return [...customerEmails, salesOrder, salesQuote, salesForm];
}
