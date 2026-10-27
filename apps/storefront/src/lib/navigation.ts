import 'server-only';

import { getCms } from './cms';
import { categoryHref } from './paths';
import { CATEGORY_TREE } from './queries';
import { shopQuery } from './vendure';

export interface MenuCategory {
  name: string;
  href: string;
  image: string | null;
  children: { name: string; href: string; image: string | null }[];
}

export interface MenuLink {
  label: string;
  url: string;
}

/** Category menu from Vendure's collection tree; collections without a legacyId have no URL yet and are skipped. */
export async function getCategoryMenu(): Promise<MenuCategory[]> {
  const { collections } = await shopQuery(CATEGORY_TREE, {});
  return collections.items.flatMap((collection) => {
    const href = categoryHref(collection);
    if (!href) {
      return [];
    }
    const children = [...(collection.children ?? [])]
      .sort((a, b) => a.position - b.position)
      .flatMap((child) => {
        const childHref = categoryHref(child);
        return childHref
          ? [{ name: child.name, href: childHref, image: child.featuredAsset?.preview ?? null }]
          : [];
      });
    return [
      { name: collection.name, href, image: collection.featuredAsset?.preview ?? null, children },
    ];
  });
}

/** Header links and footer columns maintained by staff in the CMS (Navigation global). */
export async function getCmsNavigation() {
  const cms = await getCms();
  const navigation = await cms.findGlobal({ slug: 'navigation' });
  return {
    header: (navigation.header ?? []).map((item) => ({ label: item.label, url: item.url })),
    footer: (navigation.footer ?? []).map((column) => ({
      title: column.title,
      links: (column.links ?? []).map((item) => ({ label: item.label, url: item.url })),
    })),
  };
}
