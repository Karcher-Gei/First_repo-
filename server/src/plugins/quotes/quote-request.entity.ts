import { DeepPartial } from '@vendure/common/lib/shared-types';
import { EntityId, ID, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

export const QUOTE_STATUSES = ['new', 'in_progress', 'sent', 'won', 'lost'] as const;
export type QuoteRequestStatus = (typeof QUOTE_STATUSES)[number];

export interface QuoteLine {
    productVariantId: string;
    quantity: number;
}

/** A quote request sent from a product page or the cart (replaces roja45quotationspro). */
@Entity()
export class QuoteRequest extends VendureEntity {
    constructor(input?: DeepPartial<QuoteRequest>) {
        super(input);
    }

    @Column()
    fullName: string;

    @Column()
    email: string;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column({ type: 'varchar', nullable: true })
    company: string | null;

    @Column('text')
    message: string;

    @Column('simple-json')
    lines: QuoteLine[];

    @Column({ type: 'varchar', default: 'new' })
    status: QuoteRequestStatus;

    /** The signed-in user who sent it, if any. */
    @EntityId({ nullable: true })
    userId: ID | null;
}
