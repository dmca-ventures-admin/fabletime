import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/app/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us — Fabletime',
  description: 'Get in touch with the Fabletime team.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[var(--surface-page-via)] to-[var(--surface-page-to)]">
      <main className="container mx-auto px-4 py-12 max-w-xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors duration-200 mb-8"
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
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Fabletime
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface-chip-active)] rounded-3xl border-4 border-secondary shadow-[var(--clay-icon)] mb-4">
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
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl font-semibold text-primary mb-2">Contact Us</h1>
          <p className="text-secondary">
            Have a question or need to get in touch? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-[var(--surface-card)] rounded-3xl border-4 border-[var(--border-card)] shadow-[var(--clay-card)] p-6 md:p-8">
          <ContactForm />
        </div>
      </main>
    </div>
  );
}
