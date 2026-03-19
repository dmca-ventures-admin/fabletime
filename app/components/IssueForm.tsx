'use client';

import { useState } from 'react';
import Link from 'next/link';

interface IssueFormProps {
  type: 'feedback' | 'bug';
}

const config = {
  feedback: {
    emoji: '💬',
    title: 'Share Feedback',
    description: "We'd love to hear what you think about Fabletime!",
    placeholder: 'What do you love? What could be better? Any ideas?',
    buttonLabel: 'Send Feedback',
    buttonColor: 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300',
    accentColor: 'border-blue-200',
    successMessage: 'Thanks for your feedback! We really appreciate it. 💙',
  },
  bug: {
    emoji: '🐛',
    title: 'Report a Bug',
    description: "Something not working right? Let us know and we'll fix it.",
    placeholder: 'Describe what happened and what you expected to happen...',
    buttonLabel: 'Submit Bug Report',
    buttonColor: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300',
    accentColor: 'border-red-200',
    successMessage: 'Bug report submitted! Thanks for helping us improve. 🛠️',
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
        <div className="text-5xl mb-4">✅</div>
        <p className="text-lg font-semibold text-gray-700 mb-6">{cfg.successMessage}</p>
        <Link
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
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
          className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
        >
          Email <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`w-full rounded-xl border-2 ${cfg.accentColor} bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors`}
          disabled={isSubmitting}
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide"
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
          className={`w-full rounded-xl border-2 ${cfg.accentColor} bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-colors resize-none`}
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Link
          href="/"
          className="flex-1 text-center rounded-xl border-2 border-gray-200 text-gray-600 font-semibold py-3 px-6 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className={`flex-1 rounded-xl ${cfg.buttonColor} text-white font-bold py-3 px-6 transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
