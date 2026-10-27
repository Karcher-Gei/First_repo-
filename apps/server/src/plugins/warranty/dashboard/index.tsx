import { graphql } from '@/gql';
import { defineDashboardExtension, ListPage } from '@vendure/dashboard';

/** Machines registered for the warranty from the storefront (/garantie), under Customers > Garanties. */

const warrantyListDocument = graphql(`
    query WarrantyRegistrationList($options: WarrantyRegistrationListOptions) {
        warrantyRegistrations(options: $options) {
            items {
                id
                createdAt
                updatedAt
                fullName
                email
                phone
                productSku
                serialNumber
                purchaseDate
                purchasedFrom
            }
            totalItems
        }
    }
`);

defineDashboardExtension({
    routes: [
        {
            path: '/warranty-registrations',
            navMenuItem: {
                sectionId: 'customers',
                id: 'warranty-registrations',
                title: 'Garanties',
                url: '/warranty-registrations',
            },
            loader: () => ({ breadcrumb: 'Garanties' }),
            component: route => (
                <ListPage
                    pageId="warranty-registration-list"
                    title="Garanties enregistrées"
                    listQuery={warrantyListDocument}
                    route={route}
                    defaultSort={[{ id: 'createdAt', desc: true }]}
                    defaultVisibility={{ id: false, updatedAt: false }}
                    searchPlaceholder="N° de série, référence, nom ou e-mail"
                    onSearchTermChange={term => ({
                        serialNumber: { contains: term },
                        productSku: { contains: term },
                        fullName: { contains: term },
                        email: { contains: term },
                    })}
                    transformVariables={variables => ({
                        ...variables,
                        // The search matches any of the fields above.
                        options: { ...variables.options, filterOperator: 'OR' },
                    })}
                    customizeColumns={{
                        createdAt: { header: 'Enregistrée le' },
                        fullName: { header: 'Nom' },
                        email: {
                            header: 'E-mail',
                            cell: ({ row }) => <a href={`mailto:${row.original.email}`}>{row.original.email}</a>,
                        },
                        phone: { header: 'Téléphone' },
                        productSku: { header: 'Référence' },
                        serialNumber: { header: 'N° de série' },
                        purchaseDate: { header: 'Date d’achat' },
                        purchasedFrom: { header: 'Acheté chez' },
                    }}
                />
            ),
        },
    ],
});
