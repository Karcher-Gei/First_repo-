import 'server-only';

import { brandPath, slugify } from '@karcher/seo';

import { BRANDS } from './queries';
import { shopQuery } from './vendure';

export interface Brand {
  /** Facet value id, to list the brand's products. */
  id: string;
  /** PrestaShop manufacturer id, in the URL. */
  legacyId: number;
  name: string;
  href: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

/** Migrated brands, by name. A brand without a PrestaShop id has no page. */
export async function getBrands(): Promise<Brand[]> {
  const { facets } = await shopQuery(BRANDS, {});
  return (facets.items[0]?.values ?? [])
    .flatMap((value) => {
      const legacyId = value.customFields?.legacyManufacturerId;
      if (legacyId == null) {
        return [];
      }
      return [
        {
          id: value.id,
          legacyId,
          name: value.name,
          // PrestaShop builds the brand slug from its name, as here.
          href: brandPath({ id: legacyId, slug: slugify(value.name) }),
          description: value.customFields?.description ?? null,
          metaTitle: value.customFields?.metaTitle ?? null,
          metaDescription: value.customFields?.metaDescription ?? null,
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function getBrand(id: string): Promise<Brand | null> {
  const legacyId = Number(id);
  if (!Number.isSafeInteger(legacyId)) {
    return null;
  }
  return (await getBrands()).find((brand) => brand.legacyId === legacyId) ?? null;
}
