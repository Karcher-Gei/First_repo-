import { parseLegacyPath } from '@karcher/seo';
import { NextResponse, type NextRequest } from 'next/server';

/** Internal route prefixes; only reachable through the rewrites below. */
const INTERNAL = /^\/(p|c|b|s|img)(\/|$)/;

/**
 * Maps karcher-gei.tn's PrestaShop URLs onto internal routes without changing the address bar:
 *   /home-garden/867-aspirateur-laveur-fcv-3.html -> /p/867
 *   /12-home-garden                               -> /c/12
 *   /2_karcher                                    -> /b/2
 *   /promotions                                   -> /s/prices-drop
 *   /2292-home_default/aspirateur-laveur-fcv-3.jpg -> /img/2292/home_default
 * The original path travels as ?from=, so each page can 301 to its canonical URL.
 * /content/{id}-{slug} needs no rewrite: it is a real route. Supplier pages are gone: 301 to /brands.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (INTERNAL.test(pathname)) {
    // Never index the internal paths: same content as the legacy URLs.
    return NextResponse.rewrite(new URL('/__not-found', request.url));
  }

  const route = parseLegacyPath(pathname);
  if (!route || route.kind === 'cms') {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  if (route.kind === 'supplier') {
    url.pathname = '/brands';
    url.search = '';
    return NextResponse.redirect(url, 301);
  }
  switch (route.kind) {
    case 'product':
      url.pathname = `/p/${route.productId}`;
      break;
    case 'category':
      url.pathname = `/c/${route.categoryId}`;
      break;
    case 'brand':
      url.pathname = `/b/${route.brandId}`;
      break;
    case 'static':
      url.pathname = `/s/${route.page}`;
      break;
    case 'image':
      url.pathname = `/img/${route.imageId}/${route.size}`;
      break;
  }
  url.searchParams.set('from', pathname.toLowerCase());
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/|api/|admin-cms|favicon.ico|robots.txt|sitemap.xml).*)'],
};
