import { graphql } from '@/gql';
import {
    api,
    Badge,
    Button,
    defineDashboardExtension,
    DetailPageButton,
    LabeledData,
    ListPage,
    Page,
    PageActionBar,
    PageActionBarRight,
    PageBlock,
    PageLayout,
    PageTitle,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    toast,
    useLocalFormat,
} from '@vendure/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailIcon } from 'lucide-react';

/** Quote requests from the storefront (/devis), handled by the sales team under Sales > Devis. */

const STATUSES = {
    new: { label: 'Nouvelle', variant: 'warning' },
    in_progress: { label: 'En cours', variant: 'default' },
    sent: { label: 'Devis envoyé', variant: 'outline' },
    won: { label: 'Gagnée', variant: 'success' },
    lost: { label: 'Perdue', variant: 'destructive' },
} as const;

type Status = keyof typeof STATUSES;

function StatusBadge({ status }: { status: string }) {
    const entry = STATUSES[status as Status];
    return <Badge variant={entry?.variant ?? 'outline'}>{entry?.label ?? status}</Badge>;
}

const quoteListDocument = graphql(`
    query QuoteRequestList($options: QuoteRequestListOptions) {
        quoteRequests(options: $options) {
            items {
                id
                createdAt
                updatedAt
                fullName
                company
                email
                phone
                status
                lines {
                    quantity
                }
            }
            totalItems
        }
    }
`);

const quoteDocument = graphql(`
    query QuoteRequestDetail($id: ID!) {
        quoteRequest(id: $id) {
            id
            createdAt
            fullName
            company
            email
            phone
            message
            status
            lines {
                productVariantId
                quantity
            }
        }
    }
`);

const quoteVariantsDocument = graphql(`
    query QuoteRequestVariants($ids: [String!]!) {
        productVariants(options: { filter: { id: { in: $ids } }, take: 100 }) {
            items {
                id
                name
                sku
                priceWithTax
                currencyCode
                product {
                    id
                }
            }
        }
    }
`);

const setStatusDocument = graphql(`
    mutation SetQuoteRequestStatus($id: ID!, $status: String!) {
        setQuoteRequestStatus(id: $id, status: $status) {
            id
            status
        }
    }
`);

function QuoteDetail({ id }: { id: string }) {
    const { formatCurrency, formatDate } = useLocalFormat();
    const queryClient = useQueryClient();
    const { data, isPending } = useQuery({
        queryKey: ['quoteRequest', id],
        queryFn: () => api.query(quoteDocument, { id }),
    });
    const quote = data?.quoteRequest;
    const variantIds = quote?.lines.map(line => String(line.productVariantId)) ?? [];
    const { data: variantData } = useQuery({
        queryKey: ['quoteRequestVariants', variantIds],
        queryFn: () => api.query(quoteVariantsDocument, { ids: variantIds }),
        enabled: variantIds.length > 0,
    });
    const setStatus = useMutation({
        mutationFn: (status: string) => api.mutate(setStatusDocument, { id, status }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['quoteRequest', id] });
            toast.success('Statut mis à jour');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    if (isPending) {
        return null;
    }
    if (!quote) {
        return <p className="p-6">Demande introuvable.</p>;
    }
    const variants = new Map((variantData?.productVariants.items ?? []).map(v => [v.id, v]));

    return (
        <Page pageId="quote-request-detail">
            <PageTitle>Devis : {quote.company || quote.fullName}</PageTitle>
            <PageActionBar>
                <PageActionBarRight>
                    <Button
                        variant="outline"
                        render={
                            <a
                                href={`mailto:${quote.email}?subject=${encodeURIComponent('Votre demande de devis Kärcher')}`}
                            />
                        }
                    >
                        <MailIcon className="mr-2 h-4 w-4" />
                        Répondre par e-mail
                    </Button>
                </PageActionBarRight>
            </PageActionBar>
            <PageLayout>
                <PageBlock column="main" blockId="quote-lines" title="Produits demandés">
                    <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground">
                            <tr>
                                <th className="pb-2 font-medium">Produit</th>
                                <th className="pb-2 font-medium">Réf.</th>
                                <th className="pb-2 text-right font-medium">Qté</th>
                                <th className="pb-2 text-right font-medium">Prix catalogue TTC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {quote.lines.map(line => {
                                const variant = variants.get(String(line.productVariantId));
                                return (
                                    <tr key={line.productVariantId}>
                                        <td className="py-2">
                                            {variant ? (
                                                <DetailPageButton
                                                    href={`/products/${variant.product.id}`}
                                                    label={variant.name}
                                                />
                                            ) : (
                                                `Variante ${line.productVariantId} (supprimée)`
                                            )}
                                        </td>
                                        <td className="py-2">{variant?.sku}</td>
                                        <td className="py-2 text-right">{line.quantity}</td>
                                        <td className="py-2 text-right">
                                            {variant
                                                ? formatCurrency(variant.priceWithTax * line.quantity, variant.currencyCode)
                                                : ''}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </PageBlock>
                <PageBlock column="main" blockId="quote-message" title="Message">
                    <p className="whitespace-pre-line text-sm">{quote.message}</p>
                </PageBlock>
                <PageBlock column="side" blockId="quote-status" title="Statut">
                    <Select
                        items={Object.fromEntries(Object.entries(STATUSES).map(([key, s]) => [key, s.label]))}
                        value={quote.status}
                        onValueChange={value => {
                            if (value && value !== quote.status) {
                                setStatus.mutate(value);
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(STATUSES).map(([key, s]) => (
                                <SelectItem key={key} value={key}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </PageBlock>
                <PageBlock column="side" blockId="quote-contact" title="Contact">
                    <div className="space-y-3">
                        <LabeledData label="Nom" value={quote.fullName} />
                        {quote.company ? <LabeledData label="Société" value={quote.company} /> : null}
                        <LabeledData
                            label="E-mail"
                            value={<a href={`mailto:${quote.email}`}>{quote.email}</a>}
                        />
                        {quote.phone ? (
                            <LabeledData label="Téléphone" value={<a href={`tel:${quote.phone}`}>{quote.phone}</a>} />
                        ) : null}
                        <LabeledData
                            label="Reçue le"
                            value={formatDate(quote.createdAt, { dateStyle: 'long', timeStyle: 'short' })}
                        />
                    </div>
                </PageBlock>
            </PageLayout>
        </Page>
    );
}

defineDashboardExtension({
    routes: [
        {
            path: '/quote-requests',
            navMenuItem: { sectionId: 'sales', id: 'quote-requests', title: 'Devis', url: '/quote-requests' },
            loader: () => ({ breadcrumb: 'Devis' }),
            component: route => (
                <ListPage
                    pageId="quote-request-list"
                    title="Demandes de devis"
                    listQuery={quoteListDocument}
                    route={route}
                    defaultSort={[{ id: 'createdAt', desc: true }]}
                    defaultVisibility={{ id: false, updatedAt: false }}
                    searchPlaceholder="Nom, société ou e-mail"
                    onSearchTermChange={term => ({
                        fullName: { contains: term },
                        company: { contains: term },
                        email: { contains: term },
                    })}
                    transformVariables={variables => ({
                        ...variables,
                        // The search matches any of the fields above.
                        options: { ...variables.options, filterOperator: 'OR' },
                    })}
                    customizeColumns={{
                        fullName: {
                            header: 'Nom',
                            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.fullName} />,
                        },
                        company: { header: 'Société' },
                        email: { header: 'E-mail' },
                        phone: { header: 'Téléphone' },
                        createdAt: { header: 'Reçue le' },
                        status: {
                            header: 'Statut',
                            cell: ({ row }) => <StatusBadge status={row.original.status} />,
                        },
                        lines: {
                            header: 'Articles',
                            cell: ({ row }) =>
                                row.original.lines.reduce((sum, line) => sum + line.quantity, 0),
                        },
                    }}
                />
            ),
        },
        {
            path: '/quote-requests/$id',
            loader: () => ({ breadcrumb: [{ path: '/quote-requests', label: 'Devis' }, 'Demande'] }),
            component: route => <QuoteDetail id={(route.useParams() as { id: string }).id} />,
        },
    ],
});
