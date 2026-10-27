import 'server-only';

import { SORTS, type CategoryParams } from './category-params';
import { CATEGORY_FACETS, CATEGORY_PAGE, PRODUCTS_BY_IDS, type ProductSummary } from './queries';
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

export async function loadCategoryListing(
  collectionId: string,
  params: CategoryParams,
): Promise<CategoryListing> {
  const { search: all } = await shopQuery(CATEGORY_FACETS, { collectionId });
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
      collectionId,
      groupByProduct: true,
      facetValueFilters,
      sort: params.order ? SORTS[params.order].sort : undefined,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    },
  });

  const ids = search.items.map((item) => item.productId);
  const { products } = ids.length
    ? await shopQuery(PRODUCTS_BY_IDS, { ids, take: ids.length })
    : { products: { items: [] } };
  const byId = new Map(products.items.map((product) => [product.id, product]));

  return {
    facets: [...facets.values()],
    totalItems: search.totalItems,
    pageCount: Math.max(1, Math.ceil(search.totalItems / PAGE_SIZE)),
    products: search.items.flatMap((item) => {
      const product = byId.get(item.productId);
      if (!product) {
        return [];
      }
      const price = item.priceWithTax;
      return 'value' in price
        ? [{ product, priceWithTax: price.value, from: false }]
        : [{ product, priceWithTax: price.min, from: price.min !== price.max }];
    }),
  };
}
