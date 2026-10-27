import { Injectable } from '@nestjs/common';
import {
    EventBus,
    ID,
    ListQueryBuilder,
    ListQueryOptions,
    PaginatedList,
    RequestContext,
    TransactionalConnection,
    UserInputError,
} from '@vendure/core';

import { QUOTE_STATUSES, QuoteLine, QuoteRequest, QuoteRequestStatus } from './quote-request.entity';
import { QuoteRequestedEvent } from './quote-requested.event';

export interface RequestQuoteInput {
    fullName: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    message: string;
    lines: QuoteLine[];
}

@Injectable()
export class QuoteService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly listQueryBuilder: ListQueryBuilder,
        private readonly eventBus: EventBus,
    ) {}

    async create(ctx: RequestContext, input: RequestQuoteInput): Promise<QuoteRequest> {
        if (input.lines.length === 0) {
            throw new UserInputError('A quote request needs at least one product');
        }
        const quote = await this.connection.getRepository(ctx, QuoteRequest).save(
            new QuoteRequest({
                fullName: input.fullName,
                email: input.email,
                phone: input.phone ?? null,
                company: input.company ?? null,
                message: input.message,
                lines: input.lines,
                status: 'new',
                userId: ctx.activeUserId ?? null,
            }),
        );
        await this.eventBus.publish(new QuoteRequestedEvent(ctx, quote));
        return quote;
    }

    async findAll(ctx: RequestContext, options?: ListQueryOptions<QuoteRequest>): Promise<PaginatedList<QuoteRequest>> {
        const [items, totalItems] = await this.listQueryBuilder
            .build(QuoteRequest, options, { ctx })
            .getManyAndCount();
        return { items, totalItems };
    }

    findOne(ctx: RequestContext, id: ID): Promise<QuoteRequest | null> {
        return this.connection.getRepository(ctx, QuoteRequest).findOne({ where: { id } });
    }

    async setStatus(ctx: RequestContext, id: ID, status: string): Promise<QuoteRequest> {
        if (!isQuoteStatus(status)) {
            throw new UserInputError(`Unknown status "${status}"; expected one of ${QUOTE_STATUSES.join(', ')}`);
        }
        const quote = await this.connection.getEntityOrThrow(ctx, QuoteRequest, id);
        quote.status = status;
        return this.connection.getRepository(ctx, QuoteRequest).save(quote);
    }
}

function isQuoteStatus(value: string): value is QuoteRequestStatus {
    return (QUOTE_STATUSES as readonly string[]).includes(value);
}
