import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { robots: { index: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl">{children}</div>;
}
