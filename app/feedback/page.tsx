import IssueForm from '@/app/components/IssueForm';

export const metadata = { title: 'Feedback — Fabletime' };

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12 max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-3xl border-4 border-secondary shadow-[var(--clay-icon)] mb-4">
            <svg
              className="w-8 h-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl font-semibold text-primary mb-2">
            Share Feedback
          </h1>
          <p className="text-secondary">We'd love to hear what you think about Fabletime!</p>
        </div>
        <div className="bg-white rounded-3xl border-4 border-indigo-200 shadow-[var(--clay-card)] p-6 md:p-8">
          <IssueForm type="feedback" />
        </div>
      </main>
    </div>
  );
}
