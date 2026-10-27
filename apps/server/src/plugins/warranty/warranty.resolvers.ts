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

import { WarrantyRegistration } from './warranty-registration.entity';
import { RegisterWarrantyInput, WarrantyService } from './warranty.service';

@Resolver()
export class WarrantyShopResolver {
    constructor(private readonly warrantyService: WarrantyService) {}

    @Mutation()
    @Transaction()
    async registerWarranty(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: RegisterWarrantyInput },
    ): Promise<ID> {
        const registration = await this.warrantyService.register(ctx, args.input);
        return registration.id;
    }
}

@Resolver()
export class WarrantyAdminResolver {
    constructor(private readonly warrantyService: WarrantyService) {}

    @Query()
    @Allow(Permission.ReadCustomer)
    warrantyRegistrations(
        @Ctx() ctx: RequestContext,
        @Args() args: { options?: ListQueryOptions<WarrantyRegistration> },
    ): Promise<PaginatedList<WarrantyRegistration>> {
        return this.warrantyService.findAll(ctx, args.options);
    }
}
