'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = name.trim() && email.trim() && message.trim() && !isSubmitting;

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--surface-success-bg)] rounded-3xl border-4 border-[var(--border-success)] shadow-[var(--clay-success)] mb-4">
          <svg
            className="w-8 h-8 text-[var(--text-success)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-foreground mb-2">Thanks! We'll be in touch.</p>
        <p className="text-sm text-secondary mb-8">Your message has been received.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-2xl border-4 border-secondary bg-primary text-white transition-all duration-200 shadow-[var(--clay-btn-primary)] hover:shadow-[var(--clay-btn-primary-hover)] hover:translate-y-0.5 cursor-pointer"
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider"
        >
          Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          autoComplete="name"
          className="w-full rounded-2xl border-4 border-[var(--border-card)] focus:border-primary focus:ring-primary/20 bg-[var(--surface-input)] px-4 py-3 text-foreground placeholder:text-secondary/50 focus:outline-none focus:ring-2 transition-all duration-200"
          disabled={isSubmitting}
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider"
        >
          Email <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="w-full rounded-2xl border-4 border-[var(--border-card)] focus:border-primary focus:ring-primary/20 bg-[var(--surface-input)] px-4 py-3 text-foreground placeholder:text-secondary/50 focus:outline-none focus:ring-2 transition-all duration-200"
          disabled={isSubmitting}
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider"
        >
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          rows={5}
          required
          className="w-full rounded-2xl border-4 border-[var(--border-card)] focus:border-primary focus:ring-primary/20 bg-[var(--surface-input)] px-4 py-3 text-foreground placeholder:text-secondary/50 focus:outline-none focus:ring-2 transition-all duration-200 resize-none"
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div
          className="p-4 bg-[var(--surface-error-bg)] border-4 border-[var(--border-error)] rounded-2xl text-[var(--text-error)] text-sm font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/"
          className="flex-1 text-center rounded-2xl border-4 border-[var(--surface-cancel-border)] text-primary font-semibold py-3 px-6 hover:bg-[var(--surface-hover)] hover:border-[var(--border-card)] transition-all duration-200 cursor-pointer"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-2xl border-4 border-secondary bg-primary hover:bg-primary-hover disabled:opacity-60 shadow-[var(--clay-btn-primary)] hover:shadow-[var(--clay-btn-primary-hover)] hover:translate-y-0.5 text-white font-bold py-3 px-6 transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span
                className="inline-block w-4 h-4 border-[3px] border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Sending…
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  );
}
