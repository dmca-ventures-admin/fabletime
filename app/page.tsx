import Link from 'next/link';
import StoryForm from '@/app/components/StoryForm';
import ThemeToggle from '@/app/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl border-2 border-primary-hover shadow-[var(--clay-hero-icon)] mb-5">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <h1 className="font-heading text-6xl font-semibold text-primary mb-2 tracking-tight">
            Fabletime
          </h1>
          <p className="text-xl text-secondary font-medium mb-1">
            Magical stories, made just for you
          </p>
          <p className="text-sm text-secondary/70 mt-1">
            Pick your character, choose a theme, and watch your story come to life!
          </p>
        </div>

        {/* Form */}
        <StoryForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-footer)] bg-[var(--surface-footer)] py-4">
        <div className="container mx-auto px-4 max-w-3xl flex items-center justify-center gap-3 flex-wrap">
          <span className="text-sm text-secondary/70">Have thoughts?</span>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover border-2 border-[var(--border-subtle)] hover:border-secondary rounded-xl px-4 py-2 transition-all duration-200 hover:bg-[var(--surface-hover)] cursor-pointer"
          >
            <svg
              className="w-4 h-4"
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
            Give Feedback
          </Link>
          <Link
            href="/bug"
            className="inline-flex items-center gap-2 text-sm font-semibold text-rose-500 hover:text-rose-700 border-2 border-[var(--border-rose-subtle)] hover:border-[var(--border-rose)] rounded-xl px-4 py-2 transition-all duration-200 hover:bg-[var(--surface-rose-bg)] cursor-pointer"
          >
            <svg
              className="w-4 h-4"
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
            Report a Bug
          </Link>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}
