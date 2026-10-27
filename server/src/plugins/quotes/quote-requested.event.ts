import { RequestContext, VendureEvent } from '@vendure/core';

import { QuoteRequest } from './quote-request.entity';

/** Published when a shopper sends a quote request; hook an EmailEventHandler on it to notify sales. */
export class QuoteRequestedEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public quote: QuoteRequest,
    ) {
        super();
    }
}
