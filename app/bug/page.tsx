import IssueForm from '@/app/components/IssueForm';

export const metadata = { title: 'Report a Bug — Fabletime' };

export default function BugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[var(--surface-page-via)] to-[var(--surface-page-to)]">
      <main className="container mx-auto px-4 py-12 max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface-rose-icon)] rounded-3xl border-4 border-[var(--border-rose)] shadow-[var(--clay-error)] mb-4">
            <svg
              className="w-8 h-8 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl font-semibold text-primary mb-2">
            Report a Bug
          </h1>
          <p className="text-secondary">
            Something not working right? Let us know and we'll fix it.
          </p>
        </div>
        <div className="bg-[var(--surface-card)] rounded-3xl border-4 border-[var(--border-card)] shadow-[var(--clay-card)] p-6 md:p-8">
          <IssueForm type="bug" />
        </div>
      </main>
    </div>
  );
}
