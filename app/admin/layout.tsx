import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Admin — Fabletime',
  // Internal tooling — keep it out of search engines and link previews.
  robots: { index: false, follow: false, nocache: true, noimageindex: true },
};

// Admin pages are personalised and authenticated — never cache them at the
// edge or in the data cache.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface-page-via,_#f5f5f5)] text-foreground">
      {children}
    </div>
  );
}
