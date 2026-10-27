import { CollectionFilter, LanguageCode } from '@vendure/core';

/** Variants on sale (with a regular price): the "Promotions" collection behind /promotions. */
export const onSaleCollectionFilter = new CollectionFilter({
    code: 'on-sale-filter',
    description: [
        { languageCode: LanguageCode.fr, value: 'Variantes en promotion (prix barré renseigné)' },
        { languageCode: LanguageCode.en, value: 'Variants on sale (regular price set)' },
    ],
    args: {},
    apply: qb => qb.andWhere('productVariant.customFieldsRegularprice IS NOT NULL'),
});
