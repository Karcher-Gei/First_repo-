import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SITE_NAME, SITE_URL } from '@/lib/site';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} : Distributeur officiel aux meilleurs prix`, template: `%s | ${SITE_NAME}` },
  description: 'Karcher Tunisie : nettoyeurs haute pression, aspirateurs et équipements de nettoyage Kärcher.',
};

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a
          href="#contenu"
          className="sr-only z-50 bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" className="mx-auto min-h-[60vh] max-w-7xl px-4 py-6 md:py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
