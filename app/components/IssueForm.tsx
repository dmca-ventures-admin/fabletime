'use client';

import { useState } from 'react';
import Link from 'next/link';
import CharCounter from './CharCounter';

const MAX_MESSAGE_LENGTH = 500;

interface IssueFormProps {
  type: 'feedback' | 'bug';
}

const config = {
  feedback: {
    placeholder: 'What do you love? What could be better? Any ideas?',
    buttonLabel: 'Send Feedback',
    buttonClass:
      'border-secondary bg-primary hover:bg-primary-hover disabled:opacity-60 shadow-[var(--clay-btn-primary)] hover:shadow-[var(--clay-btn-primary-hover)] hover:translate-y-0.5',
    inputBorder: 'border-[var(--border-card)] focus:border-primary focus:ring-primary/20',
    successMessage: 'Thanks for your feedback! We really appreciate it.',
  },
  bug: {
    placeholder: 'Describe what happened and what you expected to happen...',
    buttonLabel: 'Submit Bug Report',
    buttonClass:
      'border-rose-400 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 shadow-[var(--clay-error)] hover:shadow-[2px_3px_0px_rgba(239,68,68,0.3)] hover:translate-y-0.5',
    inputBorder: 'border-[var(--border-rose-subtle)] focus:border-[var(--border-rose)] focus:ring-[var(--border-rose-subtle)]',
    successMessage: 'Bug report submitted! Thanks for helping us improve.',
  },
};

export default function IssueForm({ type }: IssueFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const cfg = config[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/submit-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email: email.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <p className="text-lg font-semibold text-foreground mb-6">{cfg.successMessage}</p>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider"
        >
          Email{' '}
          <span className="text-[var(--text-hint)] font-normal normal-case">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`w-full rounded-2xl border-4 ${cfg.inputBorder} bg-[var(--surface-input)] px-4 py-3 text-foreground placeholder:text-secondary/50 focus:outline-none focus:ring-2 transition-all duration-200`}
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
          placeholder={cfg.placeholder}
          rows={5}
          required
          maxLength={MAX_MESSAGE_LENGTH}
          aria-describedby="message-counter"
          className={`w-full rounded-2xl border-4 ${cfg.inputBorder} bg-[var(--surface-input)] px-4 py-3 text-foreground placeholder:text-secondary/50 focus:outline-none focus:ring-2 transition-all duration-200 resize-none`}
          disabled={isSubmitting}
        />
        <CharCounter id="message-counter" value={message} max={MAX_MESSAGE_LENGTH} />
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
          disabled={
            isSubmitting ||
            !message.trim() ||
            message.length > MAX_MESSAGE_LENGTH
          }
          className={`flex-1 rounded-2xl border-4 ${cfg.buttonClass} text-white font-bold py-3 px-6 transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer`}
        >
          {isSubmitting ? (
            <>
              <span
                className="inline-block w-4 h-4 border-[3px] border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Submitting...
            </>
          ) : (
            cfg.buttonLabel
          )}
        </button>
      </div>
    </form>
  );
}
