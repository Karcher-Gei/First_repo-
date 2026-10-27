import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, ID, Permission, RequestContext, Transaction } from '@vendure/core';

import { CatalogCsvService } from './catalog-csv.service';
import { CategoryAssignmentService } from './category-assignment.service';

@Resolver()
export class CatalogToolsAdminResolver {
    constructor(
        private readonly csv: CatalogCsvService,
        private readonly categories: CategoryAssignmentService,
    ) {}

    @Query()
    @Allow(Permission.ReadCatalog)
    catalogCsvExport(@Ctx() ctx: RequestContext): Promise<string> {
        return this.csv.export(ctx);
    }

    @Query()
    @Allow(Permission.UpdateCatalog)
    previewCatalogCsv(@Ctx() ctx: RequestContext, @Args() args: { csv: string }) {
        return this.csv.preview(ctx, args.csv);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateCatalog)
    applyCatalogCsv(@Ctx() ctx: RequestContext, @Args() args: { csv: string }) {
        return this.csv.apply(ctx, args.csv);
    }

    @Query()
    @Allow(Permission.ReadCatalog)
    productCategories(@Ctx() ctx: RequestContext, @Args() args: { productId: ID }) {
        return this.categories.productCategories(ctx, args.productId);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateCatalog)
    setProductCategories(@Ctx() ctx: RequestContext, @Args() args: { productId: ID; collectionIds: ID[] }) {
        return this.categories.setProductCategories(ctx, args.productId, args.collectionIds);
    }
}
