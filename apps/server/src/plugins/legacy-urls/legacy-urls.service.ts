import { Injectable } from '@nestjs/common';
import {
    Asset,
    ID,
    ListQueryBuilder,
    ListQueryOptions,
    PaginatedList,
    RequestContext,
    TransactionalConnection,
    UserInputError,
} from '@vendure/core';

import { LegacyRedirect } from './legacy-redirect.entity';

export interface LegacyRedirectInput {
    fromPath: string;
    toPath: string;
    statusCode?: number | null;
}

@Injectable()
export class LegacyUrlsService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly listQueryBuilder: ListQueryBuilder,
    ) {}

    findRedirect(ctx: RequestContext, path: string): Promise<LegacyRedirect | null> {
        return this.connection
            .getRepository(ctx, LegacyRedirect)
            .findOne({ where: { fromPath: normalizePath(path) } });
    }

    findAssetByLegacyImageId(ctx: RequestContext, imageId: number): Promise<Asset | null> {
        return this.connection
            .getRepository(ctx, Asset)
            .findOne({ where: { customFields: { legacyImageId: imageId } } });
    }

    async findAll(ctx: RequestContext, options?: ListQueryOptions<LegacyRedirect>): Promise<PaginatedList<LegacyRedirect>> {
        const [items, totalItems] = await this.listQueryBuilder
            .build(LegacyRedirect, options, { ctx })
            .getManyAndCount();
        return { items, totalItems };
    }

    async upsert(ctx: RequestContext, input: LegacyRedirectInput): Promise<LegacyRedirect> {
        const statusCode = input.statusCode ?? 301;
        if (statusCode !== 301 && statusCode !== 410) {
            throw new UserInputError('statusCode must be 301 or 410');
        }
        const repo = this.connection.getRepository(ctx, LegacyRedirect);
        const fromPath = normalizePath(input.fromPath);
        const existing = await repo.findOne({ where: { fromPath } });
        const redirect = existing ?? new LegacyRedirect({ fromPath });
        redirect.toPath = input.toPath;
        redirect.statusCode = statusCode;
        return repo.save(redirect);
    }

    async delete(ctx: RequestContext, id: ID): Promise<boolean> {
        const result = await this.connection.getRepository(ctx, LegacyRedirect).delete(id);
        return (result.affected ?? 0) > 0;
    }
}

/** "/Foo/bar/?x=1" -> "/foo/bar": PrestaShop paths are lowercase and have no trailing slash. */
export function normalizePath(path: string): string {
    const withoutQuery = path.split(/[?#]/)[0] ?? '';
    const trimmed = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery;
    const leading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return leading.toLowerCase();
}
