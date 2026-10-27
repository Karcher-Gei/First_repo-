import { graphql } from '@/gql';
import {
    Alert,
    AlertDescription,
    api,
    Badge,
    Button,
    Checkbox,
    defineDashboardExtension,
    type DashboardFormComponentProps,
    Page,
    PageBlock,
    PageLayout,
    PageTitle,
    toast,
} from '@vendure/dashboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DownloadIcon, UploadIcon } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * Catalog tools for the webmaster: bulk updates from a spreadsheet (Catalog > Mise à jour CSV),
 * the categories of a product on its page, and the filters each category shows.
 */

const exportDocument = graphql(`
    query CatalogCsvExport {
        catalogCsvExport
    }
`);

const previewDocument = graphql(`
    query PreviewCatalogCsv($csv: String!) {
        previewCatalogCsv(csv: $csv) {
            changed
            unchanged
            errors
            applied
            rows {
                line
                sku
                product
                errors
                changes {
                    field
                    from
                    to
                }
            }
        }
    }
`);

const applyDocument = graphql(`
    mutation ApplyCatalogCsv($csv: String!) {
        applyCatalogCsv(csv: $csv) {
            changed
            unchanged
            errors
            applied
            rows {
                line
                sku
                product
                errors
                changes {
                    field
                    from
                    to
                }
            }
        }
    }
`);
type Report = NonNullable<Awaited<ReturnType<typeof previewCsv>>>;
const previewCsv = (csv: string) => api.query(previewDocument, { csv }).then(r => r.previewCatalogCsv);

/** Excel saves "CSV UTF-8" or, in French Windows, "CSV (point-virgule)" in Windows-1252: read both. */
async function readCsvFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        return new TextDecoder('windows-1252').decode(bytes);
    }
}

function download(text: string, name: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
}

function CatalogCsvPage() {
    const fileInput = useRef<HTMLInputElement>(null);
    const [csv, setCsv] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [report, setReport] = useState<Report | null>(null);

    const exportCsv = useMutation({
        mutationFn: () => api.query(exportDocument, {}),
        onSuccess: data =>
            download(data.catalogCsvExport, `catalogue-karcher-${new Date().toISOString().slice(0, 10)}.csv`),
        onError: (error: Error) => toast.error(error.message),
    });
    const preview = useMutation({
        mutationFn: previewCsv,
        onSuccess: setReport,
        onError: (error: Error) => toast.error(error.message),
    });
    const apply = useMutation({
        mutationFn: (text: string) => api.mutate(applyDocument, { csv: text }).then(r => r.applyCatalogCsv),
        onSuccess: result => {
            toast.success(`${result.changed} ligne(s) mise(s) à jour`);
            setReport(result);
            setCsv(null);
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const onFile = async (file: File | undefined) => {
        if (!file) {
            return;
        }
        const text = await readCsvFile(file);
        setFileName(file.name);
        setCsv(text);
        setReport(null);
        preview.mutate(text);
    };

    return (
        <Page pageId="catalog-csv">
            <PageTitle>Mise à jour du catalogue (CSV)</PageTitle>
            <PageLayout>
                <PageBlock column="main" blockId="csv-steps" title="Comment faire">
                    <ol className="list-decimal space-y-2 pl-5 text-sm">
                        <li>
                            Téléchargez le catalogue : une ligne par produit (ou par version d’un produit).
                        </li>
                        <li>
                            Ouvrez-le dans Excel, modifiez les prix, promotions, stocks ou catégories, puis
                            enregistrez au format CSV. Vous pouvez supprimer les lignes et les colonnes que vous ne
                            changez pas, sauf « Référence ».
                        </li>
                        <li>Envoyez le fichier : rien n’est modifié avant que vous ayez vérifié l’aperçu.</li>
                    </ol>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Télécharger le catalogue
                        </Button>
                        <Button onClick={() => fileInput.current?.click()} disabled={preview.isPending}>
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Envoyer un fichier CSV
                        </Button>
                        <input
                            ref={fileInput}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={event => {
                                void onFile(event.target.files?.[0]);
                                event.target.value = '';
                            }}
                        />
                    </div>
                </PageBlock>

                {report ? (
                    <PageBlock
                        column="main"
                        blockId="csv-report"
                        title={report.applied ? 'Résultat' : `Aperçu de ${fileName}`}
                    >
                        <div className="mb-4 flex flex-wrap gap-2 text-sm">
                            <Badge variant="success">
                                {report.changed} ligne(s) {report.applied ? 'mise(s) à jour' : 'à modifier'}
                            </Badge>
                            <Badge variant="outline">{report.unchanged} sans changement</Badge>
                            {report.errors ? (
                                <Badge variant="destructive">{report.errors} ligne(s) en erreur, ignorée(s)</Badge>
                            ) : null}
                        </div>
                        {report.rows.length ? (
                            <table className="w-full text-sm">
                                <thead className="text-left text-muted-foreground">
                                    <tr>
                                        <th className="pb-2 pr-3 font-medium">Ligne</th>
                                        <th className="pb-2 pr-3 font-medium">Produit</th>
                                        <th className="pb-2 font-medium">Changements</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y align-top">
                                    {report.rows.map(row => (
                                        <tr key={row.line}>
                                            <td className="py-2 pr-3">{row.line}</td>
                                            <td className="py-2 pr-3">
                                                <div className="font-medium">{row.product ?? row.sku}</div>
                                                <div className="text-muted-foreground">{row.sku}</div>
                                            </td>
                                            <td className="py-2">
                                                {row.errors.map(error => (
                                                    <div key={error} className="text-destructive">
                                                        {error}
                                                    </div>
                                                ))}
                                                {row.changes.map(change => (
                                                    <div key={change.field}>
                                                        <span className="font-medium">{change.field}</span> :{' '}
                                                        <span className="text-muted-foreground line-through">
                                                            {change.from}
                                                        </span>{' '}
                                                        → {change.to}
                                                    </div>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-sm text-muted-foreground">Aucun changement dans ce fichier.</p>
                        )}
                        {!report.applied && csv && report.changed > 0 ? (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <Button onClick={() => apply.mutate(csv)} disabled={apply.isPending}>
                                    Appliquer {report.changed} modification(s)
                                </Button>
                                {report.errors ? (
                                    <span className="text-sm text-muted-foreground">
                                        Les lignes en erreur ne seront pas modifiées : corrigez-les et renvoyez le
                                        fichier.
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </PageBlock>
                ) : null}

                <PageBlock column="side" blockId="csv-columns" title="Les colonnes">
                    <dl className="space-y-2 text-sm">
                        {[
                            ['Référence', 'Obligatoire : identifie la ligne.'],
                            ['Prix TTC', 'Le prix de vente, ex. 1311,125.'],
                            ['Prix barré TTC', 'Le prix avant promotion. Vide : pas de promotion.'],
                            ['Remise %', 'Facultatif : calcule le prix TTC depuis le prix barré, ex. 15.'],
                            ['Fin de promotion', 'Ex. 31/12/2026. Vide : sans date de fin.'],
                            ['Stock', 'La quantité en stock.'],
                            ['Sur devis', 'oui : prix et stock cachés, devis uniquement.'],
                            ['Actif', 'non : le produit n’est plus visible sur le site.'],
                            ['Catégories', 'Numéros séparés par « | », ex. 12 | 14.'],
                        ].map(([name, help]) => (
                            <div key={name}>
                                <dt className="font-medium">{name}</dt>
                                <dd className="text-muted-foreground">{help}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-3 text-sm text-muted-foreground">
                        « Produit » et « Version » sont là pour vous repérer : ils ne sont pas modifiés.
                    </p>
                </PageBlock>
            </PageLayout>
        </Page>
    );
}

const productCategoriesDocument = graphql(`
    query ProductCategories($productId: ID!) {
        productCategories(productId: $productId) {
            id
            name
            depth
            legacyId
            assigned
        }
    }
`);

const setProductCategoriesDocument = graphql(`
    mutation SetProductCategories($productId: ID!, $collectionIds: [ID!]!) {
        setProductCategories(productId: $productId, collectionIds: $collectionIds) {
            id
            name
            depth
            legacyId
            assigned
        }
    }
`);

/** The product's categories as a tree of checkboxes, on its page (like PrestaShop). */
function ProductCategoriesBlock({ productId }: { productId: string }) {
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: ['productCategories', productId],
        queryFn: () => api.query(productCategoriesDocument, { productId }),
    });
    const [selected, setSelected] = useState<Set<string> | null>(null);
    const categories = data?.productCategories ?? [];
    const current = selected ?? new Set(categories.filter(c => c.assigned).map(c => String(c.id)));
    const dirty =
        selected != null &&
        (selected.size !== categories.filter(c => c.assigned).length ||
            categories.some(c => c.assigned !== selected.has(String(c.id))));
    const save = useMutation({
        mutationFn: () => api.mutate(setProductCategoriesDocument, { productId, collectionIds: Array.from(current) }),
        onSuccess: result => {
            queryClient.setQueryData(['productCategories', productId], {
                productCategories: result.setProductCategories,
            });
            setSelected(null);
            toast.success('Catégories enregistrées');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    return (
        <div className="space-y-3">
            <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
                {categories.map(category => (
                    <li key={category.id} style={{ paddingLeft: `${category.depth * 1.25}rem` }}>
                        <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                                checked={current.has(String(category.id))}
                                onCheckedChange={checked => {
                                    const next = new Set(current);
                                    if (checked) {
                                        next.add(String(category.id));
                                    } else {
                                        next.delete(String(category.id));
                                    }
                                    setSelected(next);
                                }}
                            />
                            {category.name}
                            {category.legacyId != null ? (
                                <span className="text-muted-foreground">#{category.legacyId}</span>
                            ) : null}
                        </label>
                    </li>
                ))}
            </ul>
            <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
                Enregistrer les catégories
            </Button>
        </div>
    );
}

const facetsDocument = graphql(`
    query FilterFacets {
        facets(options: { take: 100, sort: { name: ASC } }) {
            items {
                id
                name
                isPrivate
            }
        }
    }
`);

/** The "Filtres affichés" field of a category: which characteristics its page offers as filters. */
function FacetFilterPicker({ value, onChange }: DashboardFormComponentProps) {
    const { data } = useQuery({ queryKey: ['filterFacets'], queryFn: () => api.query(facetsDocument, {}) });
    const selected: string[] = Array.isArray(value) ? value : [];
    const facets = (data?.facets.items ?? []).filter(f => !f.isPrivate);
    return (
        <div className="space-y-2">
            {facets.length === 0 ? <p className="text-sm text-muted-foreground">Aucune caractéristique.</p> : null}
            {facets.map(facet => (
                <label key={facet.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                        checked={selected.includes(String(facet.id))}
                        onCheckedChange={checked =>
                            onChange(
                                checked
                                    ? [...selected, String(facet.id)]
                                    : selected.filter(id => id !== String(facet.id)),
                            )
                        }
                    />
                    {facet.name}
                </label>
            ))}
            <Alert>
                <AlertDescription>
                    Aucune cochée : la catégorie propose les filtres de toutes les caractéristiques de ses
                    produits.
                </AlertDescription>
            </Alert>
        </div>
    );
}

defineDashboardExtension({
    routes: [
        {
            path: '/catalog-csv',
            navMenuItem: { sectionId: 'catalog', id: 'catalog-csv', title: 'Mise à jour CSV', url: '/catalog-csv' },
            loader: () => ({ breadcrumb: 'Mise à jour CSV' }),
            component: () => <CatalogCsvPage />,
        },
    ],
    pageBlocks: [
        {
            id: 'product-categories',
            title: 'Catégories',
            location: {
                pageId: 'product-detail',
                column: 'side',
                position: { blockId: 'facet-values', order: 'before' },
            },
            shouldRender: context => Boolean(context.entity?.id),
            component: ({ context }) => <ProductCategoriesBlock productId={String(context.entity.id)} />,
        },
    ],
    customFormComponents: {
        customFields: [{ id: 'facet-filter-picker', component: FacetFilterPicker }],
    },
});
