import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Admin sign in — Fabletime',
  // Don't let the admin login show up in search indexes.
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { next: rawNext } = await searchParams;
  // Sanity-check the `next` param — middleware would redirect off-site values,
  // but we filter here too so the form never embeds a hostile URL.
  const next =
    typeof rawNext === 'string' && rawNext.startsWith('/admin') && !rawNext.startsWith('//')
      ? rawNext
      : '/admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[var(--surface-page-via)] to-[var(--surface-page-to)] flex items-center justify-center px-4 py-12">
      <main className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--surface-chip-active)] rounded-3xl border-4 border-secondary shadow-[var(--clay-icon)] mb-4">
            <svg
              className="w-7 h-7 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
              <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-primary mb-1">
            Admin sign in
          </h1>
          <p className="text-sm text-secondary">Restricted area — staff only.</p>
        </div>

        <div className="bg-[var(--surface-card)] rounded-3xl border-4 border-[var(--border-card)] shadow-[var(--clay-card)] p-6 md:p-8">
          <LoginForm next={next} />
        </div>
      </main>
    </div>
  );
}
