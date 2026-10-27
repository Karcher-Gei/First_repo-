import { Injectable } from '@nestjs/common';
import {
    ListQueryBuilder,
    ListQueryOptions,
    PaginatedList,
    RequestContext,
    TransactionalConnection,
    UserInputError,
} from '@vendure/core';

import { WarrantyRegistration } from './warranty-registration.entity';

export interface RegisterWarrantyInput {
    fullName: string;
    email: string;
    phone?: string | null;
    productSku: string;
    serialNumber: string;
    /** ISO date, YYYY-MM-DD */
    purchaseDate: string;
    purchasedFrom?: string | null;
}

@Injectable()
export class WarrantyService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly listQueryBuilder: ListQueryBuilder,
    ) {}

    async register(ctx: RequestContext, input: RegisterWarrantyInput): Promise<WarrantyRegistration> {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.purchaseDate) || Number.isNaN(Date.parse(input.purchaseDate))) {
            throw new UserInputError('purchaseDate must be a date in the format YYYY-MM-DD');
        }
        if (Date.parse(input.purchaseDate) > Date.now()) {
            throw new UserInputError('purchaseDate cannot be in the future');
        }
        return this.connection.getRepository(ctx, WarrantyRegistration).save(
            new WarrantyRegistration({
                fullName: input.fullName,
                email: input.email,
                phone: input.phone ?? null,
                productSku: input.productSku.trim(),
                serialNumber: input.serialNumber.trim(),
                purchaseDate: input.purchaseDate,
                purchasedFrom: input.purchasedFrom ?? null,
                userId: ctx.activeUserId ?? null,
            }),
        );
    }

    async findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<WarrantyRegistration>,
    ): Promise<PaginatedList<WarrantyRegistration>> {
        const [items, totalItems] = await this.listQueryBuilder
            .build(WarrantyRegistration, options, { ctx })
            .getManyAndCount();
        return { items, totalItems };
    }
}
