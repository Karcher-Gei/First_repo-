import { DeepPartial } from '@vendure/common/lib/shared-types';
import { EntityId, ID, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

/** A machine registered by its owner for the Karcher warranty (replaces aregisterguarantee). */
@Entity()
export class WarrantyRegistration extends VendureEntity {
    constructor(input?: DeepPartial<WarrantyRegistration>) {
        super(input);
    }

    @Column()
    fullName: string;

    @Column()
    email: string;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    /** Karcher part number, e.g. 1.673-535.0 */
    @Column()
    productSku: string;

    @Column()
    serialNumber: string;

    @Column({ type: 'date' })
    purchaseDate: string;

    /** Shop or reseller where the machine was bought. */
    @Column({ type: 'varchar', nullable: true })
    purchasedFrom: string | null;

    @EntityId({ nullable: true })
    userId: ID | null;
}
