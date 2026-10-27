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

import { FORM_TYPES, FormSubmission, FormType } from './form-submission.entity';
import { FormSubmittedEvent } from './form-submitted.event';

export interface SubmitFormInput {
    form: string;
    fullName: string;
    email: string;
    phone?: string | null;
    fields?: Record<string, unknown> | null;
}

@Injectable()
export class FormsService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly listQueryBuilder: ListQueryBuilder,
        private readonly eventBus: EventBus,
    ) {}

    async submit(ctx: RequestContext, input: SubmitFormInput): Promise<FormSubmission> {
        if (!isFormType(input.form)) {
            throw new UserInputError(`Unknown form "${input.form}"; expected one of ${FORM_TYPES.join(', ')}`);
        }
        const submission = await this.connection.getRepository(ctx, FormSubmission).save(
            new FormSubmission({
                form: input.form,
                fullName: input.fullName,
                email: input.email,
                phone: input.phone ?? null,
                fields: toStringRecord(input.fields ?? {}),
                handled: false,
            }),
        );
        await this.eventBus.publish(new FormSubmittedEvent(ctx, submission));
        return submission;
    }

    async findAll(ctx: RequestContext, options?: ListQueryOptions<FormSubmission>): Promise<PaginatedList<FormSubmission>> {
        const [items, totalItems] = await this.listQueryBuilder
            .build(FormSubmission, options, { ctx })
            .getManyAndCount();
        return { items, totalItems };
    }

    async markHandled(ctx: RequestContext, id: ID): Promise<FormSubmission> {
        const submission = await this.connection.getEntityOrThrow(ctx, FormSubmission, id);
        submission.handled = true;
        return this.connection.getRepository(ctx, FormSubmission).save(submission);
    }
}

function isFormType(value: string): value is FormType {
    return (FORM_TYPES as readonly string[]).includes(value);
}

/** Keeps only scalar values, stored as strings, so the JSON column stays flat. */
function toStringRecord(fields: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            out[key] = String(value).slice(0, 5000);
        }
    }
    return out;
}
