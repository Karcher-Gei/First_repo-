import { DeepPartial } from '@vendure/common/lib/shared-types';
import { VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

export const FORM_TYPES = ['contact', 'reseller', 'after-sales'] as const;
export type FormType = (typeof FORM_TYPES)[number];

/** A contact, reseller or after-sales form sent from the storefront (replaces gformcms). */
@Entity()
export class FormSubmission extends VendureEntity {
    constructor(input?: DeepPartial<FormSubmission>) {
        super(input);
    }

    @Column({ type: 'varchar' })
    form: FormType;

    @Column()
    fullName: string;

    @Column()
    email: string;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    /** Free-form fields specific to each form (company, city, message, ...). */
    @Column('simple-json')
    fields: Record<string, string>;

    @Column({ default: false })
    handled: boolean;
}
