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

import { QuoteRequest } from './quote-request.entity';
import { QuoteService, RequestQuoteInput } from './quote.service';

@Resolver()
export class QuoteShopResolver {
    constructor(private readonly quoteService: QuoteService) {}

    @Mutation()
    @Transaction()
    async requestQuote(@Ctx() ctx: RequestContext, @Args() args: { input: RequestQuoteInput }): Promise<ID> {
        const quote = await this.quoteService.create(ctx, args.input);
        return quote.id;
    }
}

@Resolver()
export class QuoteAdminResolver {
    constructor(private readonly quoteService: QuoteService) {}

    @Query()
    @Allow(Permission.ReadOrder)
    quoteRequests(
        @Ctx() ctx: RequestContext,
        @Args() args: { options?: ListQueryOptions<QuoteRequest> },
    ): Promise<PaginatedList<QuoteRequest>> {
        return this.quoteService.findAll(ctx, args.options);
    }

    @Query()
    @Allow(Permission.ReadOrder)
    quoteRequest(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<QuoteRequest | null> {
        return this.quoteService.findOne(ctx, args.id);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateOrder)
    setQuoteRequestStatus(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID; status: string },
    ): Promise<QuoteRequest> {
        return this.quoteService.setStatus(ctx, args.id, args.status);
    }
}
