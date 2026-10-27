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
    toast,
    useLocalFormat,
} from '@vendure/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, MailIcon } from 'lucide-react';

/** Messages sent from the storefront forms (contact, reseller, after-sales), under Customers > Messages. */

const FORM_LABELS: Record<string, string> = {
    contact: 'Contact',
    reseller: 'Devenir revendeur',
    'after-sales': 'Service après-vente',
};

/** Field names the storefront forms send, in French. */
const FIELD_LABELS: Record<string, string> = {
    message: 'Message',
    company: 'Société',
    city: 'Ville',
};

function HandledBadge({ handled }: { handled: boolean }) {
    return handled ? <Badge variant="success">Traité</Badge> : <Badge variant="warning">À traiter</Badge>;
}

const submissionListDocument = graphql(`
    query FormSubmissionList($options: FormSubmissionListOptions) {
        formSubmissions(options: $options) {
            items {
                id
                createdAt
                updatedAt
                form
                fullName
                email
                phone
                handled
                fields
            }
            totalItems
        }
    }
`);

// The Admin API has no single-submission query: the list is filtered on the id.
const submissionDocument = graphql(`
    query FormSubmissionDetail($id: String!) {
        formSubmissions(options: { filter: { id: { eq: $id } }, take: 1 }) {
            items {
                id
                createdAt
                form
                fullName
                email
                phone
                handled
                fields
            }
        }
    }
`);

const markHandledDocument = graphql(`
    mutation MarkFormSubmissionHandled($id: ID!) {
        markFormSubmissionHandled(id: $id) {
            id
            handled
        }
    }
`);

function messageOf(fields: unknown): string {
    const message = (fields as Record<string, unknown> | null)?.message;
    return typeof message === 'string' ? message : '';
}

function SubmissionDetail({ id }: { id: string }) {
    const { formatDate } = useLocalFormat();
    const queryClient = useQueryClient();
    const { data, isPending } = useQuery({
        queryKey: ['formSubmission', id],
        queryFn: () => api.query(submissionDocument, { id }),
    });
    const markHandled = useMutation({
        mutationFn: () => api.mutate(markHandledDocument, { id }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['formSubmission', id] });
            toast.success('Message marqué comme traité');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    if (isPending) {
        return null;
    }
    const submission = data?.formSubmissions.items[0];
    if (!submission) {
        return <p className="p-6">Message introuvable.</p>;
    }
    const fields = Object.entries((submission.fields ?? {}) as Record<string, unknown>);

    return (
        <Page pageId="form-submission-detail">
            <PageTitle>
                {FORM_LABELS[submission.form] ?? submission.form} : {submission.fullName}
            </PageTitle>
            <PageActionBar>
                <PageActionBarRight>
                    <Button
                        variant="outline"
                        render={<a href={`mailto:${submission.email}`} />}
                    >
                        <MailIcon className="mr-2 h-4 w-4" />
                        Répondre par e-mail
                    </Button>
                    <Button disabled={submission.handled || markHandled.isPending} onClick={() => markHandled.mutate()}>
                        <CheckIcon className="mr-2 h-4 w-4" />
                        Marquer comme traité
                    </Button>
                </PageActionBarRight>
            </PageActionBar>
            <PageLayout>
                <PageBlock column="main" blockId="submission-fields" title="Contenu">
                    <div className="space-y-4">
                        {fields.length === 0 ? <p className="text-sm text-muted-foreground">Aucun contenu.</p> : null}
                        {fields.map(([name, value]) => (
                            <LabeledData
                                key={name}
                                label={FIELD_LABELS[name] ?? name}
                                value={<span className="whitespace-pre-line">{String(value)}</span>}
                            />
                        ))}
                    </div>
                </PageBlock>
                <PageBlock column="side" blockId="submission-status" title="Statut">
                    <HandledBadge handled={submission.handled} />
                </PageBlock>
                <PageBlock column="side" blockId="submission-contact" title="Contact">
                    <div className="space-y-3">
                        <LabeledData label="Nom" value={submission.fullName} />
                        <LabeledData
                            label="E-mail"
                            value={<a href={`mailto:${submission.email}`}>{submission.email}</a>}
                        />
                        {submission.phone ? (
                            <LabeledData
                                label="Téléphone"
                                value={<a href={`tel:${submission.phone}`}>{submission.phone}</a>}
                            />
                        ) : null}
                        <LabeledData
                            label="Reçu le"
                            value={formatDate(submission.createdAt, { dateStyle: 'long', timeStyle: 'short' })}
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
            path: '/form-submissions',
            navMenuItem: {
                sectionId: 'customers',
                id: 'form-submissions',
                title: 'Messages',
                url: '/form-submissions',
            },
            loader: () => ({ breadcrumb: 'Messages' }),
            component: route => (
                <ListPage
                    pageId="form-submission-list"
                    title="Messages reçus"
                    listQuery={submissionListDocument}
                    route={route}
                    defaultSort={[{ id: 'createdAt', desc: true }]}
                    defaultVisibility={{ id: false, updatedAt: false }}
                    searchPlaceholder="Nom ou e-mail"
                    onSearchTermChange={term => ({
                        fullName: { contains: term },
                        email: { contains: term },
                    })}
                    transformVariables={variables => ({
                        ...variables,
                        // The search matches any of the fields above.
                        options: { ...variables.options, filterOperator: 'OR' },
                    })}
                    customizeColumns={{
                        createdAt: { header: 'Reçu le' },
                        form: {
                            header: 'Formulaire',
                            cell: ({ row }) => FORM_LABELS[row.original.form] ?? row.original.form,
                        },
                        fullName: {
                            header: 'Nom',
                            cell: ({ row }) => <DetailPageButton id={row.original.id} label={row.original.fullName} />,
                        },
                        email: { header: 'E-mail' },
                        phone: { header: 'Téléphone' },
                        handled: {
                            header: 'Statut',
                            cell: ({ row }) => <HandledBadge handled={row.original.handled} />,
                        },
                        fields: {
                            header: 'Message',
                            cell: ({ row }) => (
                                <span className="line-clamp-1 max-w-80">{messageOf(row.original.fields)}</span>
                            ),
                        },
                    }}
                />
            ),
        },
        {
            path: '/form-submissions/$id',
            loader: () => ({ breadcrumb: [{ path: '/form-submissions', label: 'Messages' }, 'Message'] }),
            component: route => <SubmissionDetail id={(route.useParams() as { id: string }).id} />,
        },
    ],
});
