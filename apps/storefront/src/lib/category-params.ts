import type { SearchInput } from '@karcher/graphql';

/* Category URL parameters, shared by the page (server) and the filter form (browser). */

/** Sort options, in PrestaShop's `?order=` parameter (robots.txt already keeps it out of the index). */
export const SORTS = {
  'prix-asc': { label: 'Prix croissant', sort: { price: 'ASC' } },
  'prix-desc': { label: 'Prix décroissant', sort: { price: 'DESC' } },
  'nom-asc': { label: 'Nom (A-Z)', sort: { name: 'ASC' } },
} as const satisfies Record<string, { label: string; sort: SearchInput['sort'] }>;

export type SortKey = keyof typeof SORTS;

export interface CategoryParams {
  /** 1-based, from PrestaShop's `?page=`. */
  page: number;
  /** Selected facet value ids, from `?q=` (robots.txt already keeps it out of the index). */
  facetValueIds: string[];
  order: SortKey | null;
}

type RawParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  return (Array.isArray(value) ? value : value ? [value] : []).flatMap((v) => v.split(','));
}

export function parseCategoryParams(params: RawParams): CategoryParams {
  const page = Math.trunc(Number(params.page));
  const order =
    typeof params.order === 'string' && params.order in SORTS ? (params.order as SortKey) : null;
  return {
    page: Number.isSafeInteger(page) && page > 1 ? page : 1,
    facetValueIds: [...new Set(list(params.q).filter((id) => /^\d+$/.test(id)))],
    order,
  };
}

/** Query string for a category URL; page 1, no filter and the default sort are left out. */
export function categoryQuery(params: CategoryParams): string {
  const search = new URLSearchParams();
  if (params.facetValueIds.length > 0) {
    search.set('q', params.facetValueIds.join(','));
  }
  if (params.order) {
    search.set('order', params.order);
  }
  if (params.page > 1) {
    search.set('page', String(params.page));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
