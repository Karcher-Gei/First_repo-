import { DeepPartial } from '@vendure/common/lib/shared-types';
import { VendureEntity } from '@vendure/core';
import { Column, Entity, Index } from 'typeorm';

/** An old URL that must point somewhere new (e.g. a deleted product sent to its category). */
@Entity()
export class LegacyRedirect extends VendureEntity {
    constructor(input?: DeepPartial<LegacyRedirect>) {
        super(input);
    }

    /** Path only, starting with "/", no domain or query string. */
    @Index({ unique: true })
    @Column()
    fromPath: string;

    @Column()
    toPath: string;

    /** 301 (permanent) or 410 (gone). */
    @Column({ type: 'int', default: 301 })
    statusCode: number;
}
