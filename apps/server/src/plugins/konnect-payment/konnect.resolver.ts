import { Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext, Transaction } from '@vendure/core';

import { KonnectService } from './konnect.service';

@Resolver()
export class KonnectShopResolver {
    constructor(private readonly konnectService: KonnectService) {}

    @Mutation()
    @Transaction()
    @Allow(Permission.Owner)
    createKonnectPaymentIntent(@Ctx() ctx: RequestContext): Promise<string> {
        return this.konnectService.createPaymentIntent(ctx);
    }
}
