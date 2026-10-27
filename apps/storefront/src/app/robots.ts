import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Staging must never be indexed: set NEXT_PUBLIC_SITE_URL to the real domain only in production.
  const isProduction = absoluteUrl('/').startsWith('https://karcher-gei.tn');
  if (!isProduction) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/panier',
        '/commande',
        '/compte',
        '/admin-cms',
        '/api/',
        '/*?q=',
        '/*&q=',
        '/*?order=',
        '/*&order=',
        '/*?stock=',
        '/*&stock=',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
