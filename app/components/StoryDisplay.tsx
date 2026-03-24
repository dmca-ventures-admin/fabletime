'use client';

import { useState } from 'react';

interface StoryDisplayProps {
  story: string;
  isLoading: boolean;
  storyId: string | null;
  hasRated: boolean;
  onRated: () => void;
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export default function StoryDisplay({ story, isLoading, storyId, hasRated, onRated }: StoryDisplayProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const displayRating = hoveredRating || selectedRating;

  const handleRatingSubmit = async () => {
    if (selectedRating === 0 || !storyId) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: storyId,
          stars: selectedRating,
          feedback: feedbackText.trim() || null,
        }),
      });

      if (response.status === 201) {
        // Reset local rating state for next story
        setSelectedRating(0);
        setHoveredRating(0);
        setFeedbackText('');
        onRated();
      } else {
        const data = await response.json().catch(() => null);
        setSubmitError(data?.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Could not connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!story && !isLoading) return null;

  const showRatingForm = !isLoading && story && storyId && !hasRated;
  const showThankYou = !isLoading && story && storyId && hasRated;

  return (
    <div className="mt-6 w-full max-w-2xl mx-auto">
      {/* Story Card */}
      <div className="bg-[var(--surface-card)] rounded-3xl border-4 border-[var(--border-card)] shadow-[var(--clay-card)] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-[var(--surface-chip-active)] rounded-2xl border-2 border-[var(--border-card)] shrink-0">
            <svg
              className="w-5 h-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-semibold text-primary">Your Story</h2>
          {isLoading && (
            <span className="ml-auto inline-flex items-center gap-1.5" aria-label="Story is loading">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
              <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
              <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-bounce" />
            </span>
          )}
        </div>

        <div className="space-y-4">
          {story.split('\n').map((paragraph, index) =>
            paragraph.trim() ? (
              <p
                key={index}
                className="text-foreground/80 leading-relaxed text-base md:text-lg font-serif"
              >
                {paragraph}
              </p>
            ) : null,
          )}
          {isLoading && !story && (
            <p className="text-secondary italic animate-pulse text-lg font-serif">
              Once upon a time...
            </p>
          )}
        </div>
      </div>

      {/* Rating Form */}
      {showRatingForm && (
        <div className="mt-4 bg-[var(--surface-card)] rounded-3xl border-4 border-[var(--border-card)] shadow-[var(--clay-card)] p-6 md:p-8">
          <h3 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <span aria-hidden="true">⭐</span>
            Rate This Story
          </h3>

          {/* Star Rating */}
          <fieldset
            role="radiogroup"
            aria-label="Story rating"
            className="mb-5"
          >
            <legend className="block text-xs font-semibold text-secondary mb-3 uppercase tracking-wider">
              How many stars?
            </legend>
            <div
              className="flex gap-1"
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  htmlFor={`star-${n}`}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className="relative cursor-pointer p-1 rounded-xl transition-transform duration-150 hover:scale-110 active:scale-95"
                  onMouseEnter={() => setHoveredRating(n)}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    id={`star-${n}`}
                    className="sr-only peer"
                    checked={selectedRating === n}
                    onChange={() => setSelectedRating(n)}
                  />
                  <StarIcon
                    filled={n <= displayRating}
                    className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-150 ${
                      n <= displayRating
                        ? 'text-cta'
                        : 'text-secondary/40'
                    }`}
                  />
                  {/* Focus ring for keyboard navigation */}
                  <span className="absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--surface-card)]" />
                </label>
              ))}
            </div>
          </fieldset>

          {/* Feedback Textarea */}
          <div className="mb-5">
            <label
              htmlFor="rating-feedback"
              className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider"
            >
              Feedback (optional)
            </label>
            <textarea
              id="rating-feedback"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What did you think? (optional)"
              rows={3}
              className="w-full rounded-2xl border-2 border-[var(--border-card)] bg-[var(--surface-input)] text-foreground placeholder:text-[var(--text-hint)] p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-150"
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div
              className="mb-4 p-3 bg-[var(--surface-error-bg)] border-2 border-[var(--border-error)] rounded-xl text-[var(--text-error)] text-sm font-medium"
              role="alert"
            >
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleRatingSubmit}
            disabled={selectedRating === 0 || isSubmitting}
            className="py-3 px-6 rounded-2xl border-4 border-[var(--border-card)] bg-[var(--surface-chip-active)] text-primary font-heading font-semibold text-base shadow-[var(--clay-btn-primary)] hover:shadow-[var(--clay-btn-primary-hover)] hover:translate-y-0.5 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Submitting…
              </>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      )}

      {/* Thank You Message */}
      {showThankYou && (
        <div className="mt-4 bg-[var(--surface-success-bg)] rounded-3xl border-4 border-[var(--border-success)] shadow-[var(--clay-success)] p-6 md:p-8 text-center">
          <p className="font-heading text-lg font-semibold text-[var(--text-success)] flex items-center justify-center gap-2">
            Thanks for your feedback!
            <span aria-hidden="true">⭐</span>
          </p>
        </div>
      )}
    </div>
  );
}
