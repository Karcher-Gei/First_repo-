import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Asset,
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    Permission,
    RequestContext,
    Transaction,
} from '@vendure/core';

import { LegacyRedirect } from './legacy-redirect.entity';
import { LegacyRedirectInput, LegacyUrlsService } from './legacy-urls.service';

@Resolver()
export class LegacyUrlsShopResolver {
    constructor(private readonly legacyUrlsService: LegacyUrlsService) {}

    @Query()
    legacyRedirect(@Ctx() ctx: RequestContext, @Args() args: { path: string }): Promise<LegacyRedirect | null> {
        return this.legacyUrlsService.findRedirect(ctx, args.path);
    }

    @Query()
    legacyImage(@Ctx() ctx: RequestContext, @Args() args: { imageId: number }): Promise<Asset | null> {
        return this.legacyUrlsService.findAssetByLegacyImageId(ctx, args.imageId);
    }
}

@Resolver()
export class LegacyUrlsAdminResolver {
    constructor(private readonly legacyUrlsService: LegacyUrlsService) {}

    @Query()
    @Allow(Permission.ReadCatalog)
    legacyRedirects(
        @Ctx() ctx: RequestContext,
        @Args() args: { options?: ListQueryOptions<LegacyRedirect> },
    ): Promise<PaginatedList<LegacyRedirect>> {
        return this.legacyUrlsService.findAll(ctx, args.options);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateCatalog)
    upsertLegacyRedirect(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: LegacyRedirectInput },
    ): Promise<LegacyRedirect> {
        return this.legacyUrlsService.upsert(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.DeleteCatalog)
    deleteLegacyRedirect(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<boolean> {
        return this.legacyUrlsService.delete(ctx, args.id);
    }
}
