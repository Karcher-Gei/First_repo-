import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    Permission,
    RequestContext,
    Transaction,
} from '@vendure/core';

import { FormSubmission } from './form-submission.entity';
import { FormsService, SubmitFormInput } from './forms.service';

@Resolver()
export class FormsShopResolver {
    constructor(private readonly formsService: FormsService) {}

    @Mutation()
    @Transaction()
    async submitForm(@Ctx() ctx: RequestContext, @Args() args: { input: SubmitFormInput }): Promise<ID> {
        const submission = await this.formsService.submit(ctx, args.input);
        return submission.id;
    }
}

@Resolver()
export class FormsAdminResolver {
    constructor(private readonly formsService: FormsService) {}

    @Query()
    @Allow(Permission.ReadCustomer)
    formSubmissions(
        @Ctx() ctx: RequestContext,
        @Args() args: { options?: ListQueryOptions<FormSubmission> },
    ): Promise<PaginatedList<FormSubmission>> {
        return this.formsService.findAll(ctx, args.options);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateCustomer)
    markFormSubmissionHandled(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<FormSubmission> {
        return this.formsService.markHandled(ctx, args.id);
    }
}
