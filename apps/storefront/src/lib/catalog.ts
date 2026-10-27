import 'server-only';

import { SORTS, type CategoryParams } from './category-params';
import {
  CATEGORY_PAGE,
  LISTING_FACETS,
  PRODUCTS_BY_IDS,
  RANKED_PRODUCTS,
  type ProductSummary,
} from './queries';
import { shopQuery } from './vendure';

export const PAGE_SIZE = 48;

export interface FacetGroup {
  id: string;
  name: string;
  values: { id: string; name: string; count: number }[];
}

export interface CategoryProduct {
  product: ProductSummary;
  /** Lowest price with tax; `from` when the product's variants have different prices. */
  priceWithTax: number;
  from: boolean;
}

export interface CategoryListing {
  facets: FacetGroup[];
  products: CategoryProduct[];
  totalItems: number;
  pageCount: number;
}

/** What a listing shows: a category's products, a brand's (a facet value) or search results. */
export type ListingScope = { collectionId: string } | { term: string } | { facetValueId: string };

/**
 * A page of a listing with its filters. `filterFacetIds`: the facets a category offers as filters,
 * in that order (chosen in the dashboard); empty: every facet of its products.
 */
export async function loadListing(
  scope: ListingScope,
  params: CategoryParams,
  filterFacetIds: string[] = [],
): Promise<CategoryListing> {
  const { facetValueId, ...scopeInput } = { facetValueId: undefined, ...scope };
  const scopeFilters = facetValueId ? [{ and: facetValueId }] : [];
  const { search: all } = await shopQuery(LISTING_FACETS, {
    input: { ...scopeInput, facetValueFilters: scopeFilters, groupByProduct: true, take: 0 },
  });
  const facets = new Map<string, FacetGroup>();
  for (const { count, facetValue } of all.facetValues) {
    const group = facets.get(facetValue.facet.id) ?? {
      id: facetValue.facet.id,
      name: facetValue.facet.name,
      values: [],
    };
    group.values.push({ id: facetValue.id, name: facetValue.name, count });
    facets.set(group.id, group);
  }

  // Values of one facet widen the results (OR); different facets narrow them (AND).
  const facetValueFilters = [...facets.values()]
    .map((group) => group.values.map((v) => v.id).filter((id) => params.facetValueIds.includes(id)))
    .filter((ids) => ids.length > 0)
    .map((ids) => ({ or: ids }));

  const { search } = await shopQuery(CATEGORY_PAGE, {
    input: {
      ...scopeInput,
      groupByProduct: true,
      facetValueFilters: [...scopeFilters, ...facetValueFilters],
      inStock: params.inStock || undefined,
      sort: params.order ? SORTS[params.order].sort : undefined,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    },
  });

  return {
    // A facet with one value shared by every product (Type: Aspirateur in Aspirateurs) cannot narrow the list.
    facets: (filterFacetIds.length
      ? filterFacetIds.flatMap((id) => facets.get(id) ?? [])
      : [...facets.values()]
    ).filter((group) => group.values.length > 1 || group.values[0]?.count !== all.totalItems),
    totalItems: search.totalItems,
    pageCount: Math.max(1, Math.ceil(search.totalItems / PAGE_SIZE)),
    products: await withSummaries(search.items),
  };
}

type PriceWithTax = { value: number } | { min: number; max: number };

/** Adds the product summaries (URL fields, image) to search results, keeping their order. */
async function withSummaries(
  items: { productId: string; priceWithTax: PriceWithTax }[],
): Promise<CategoryProduct[]> {
  const ids = items.map((item) => item.productId);
  if (ids.length === 0) {
    return [];
  }
  const { products } = await shopQuery(PRODUCTS_BY_IDS, { ids, take: ids.length });
  const byId = new Map(products.items.map((product) => [product.id, product]));
  return items.flatMap((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      return [];
    }
    const price = item.priceWithTax;
    return 'value' in price
      ? [{ product, priceWithTax: price.value, from: false }]
      : [{ product, priceWithTax: price.min, from: price.min !== price.max }];
  });
}

/** A selection from the whole catalog, for the default homepage. */
export async function featuredProducts(take: number): Promise<CategoryProduct[]> {
  const { search } = await shopQuery(CATEGORY_PAGE, { input: { groupByProduct: true, take } });
  return withSummaries(search.items);
}

/**
 * PrestaShop's new products and best sellers pages: every product, newest first (date added in
 * PrestaShop), or the products sold at least once, best sellers first.
 */
export async function rankedProducts(
  ranking: 'newest' | 'best-selling',
  page: number,
): Promise<{ products: CategoryProduct[]; pageCount: number }> {
  const { products } = await shopQuery(RANKED_PRODUCTS, {
    options: {
      ...(ranking === 'newest'
        ? { sort: { addedAt: 'DESC' as const } }
        : { sort: { unitsSold: 'DESC' as const }, filter: { unitsSold: { gt: 0 } } }),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    },
  });
  return {
    pageCount: Math.max(1, Math.ceil(products.totalItems / PAGE_SIZE)),
    products: products.items.map((product) => {
      const prices = product.variants.map((v) => v.priceWithTax);
      const lowest = Math.min(...prices);
      return { product, priceWithTax: lowest, from: prices.some((price) => price !== lowest) };
    }),
  };
}
