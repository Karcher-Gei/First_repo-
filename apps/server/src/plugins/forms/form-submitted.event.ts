import { RequestContext, VendureEvent } from '@vendure/core';

import { FormSubmission } from './form-submission.entity';

/** Published when a shopper sends a contact, reseller or after-sales form (see email/handlers.ts). */
export class FormSubmittedEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public submission: FormSubmission,
    ) {
        super();
    }
}
