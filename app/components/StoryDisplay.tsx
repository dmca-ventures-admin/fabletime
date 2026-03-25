'use client';

import { useState, useEffect, useRef } from 'react';

interface StoryDisplayProps {
  story: string;
  isLoading: boolean;
  storyId: string | null;
  hasRated: boolean;
  onRated: () => void;
  onReset: () => void;
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

export default function StoryDisplay({ story, isLoading, storyId, hasRated, onRated, onReset }: StoryDisplayProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [glowActive, setGlowActive] = useState(false);
  const prevLoadingRef = useRef(isLoading);

  // Fire the one-shot glow when isLoading transitions from true → false with a story present
  useEffect(() => {
    if (prevLoadingRef.current === true && isLoading === false && story) {
      setGlowActive(true);
      const timer = setTimeout(() => setGlowActive(false), 1700);
      prevLoadingRef.current = isLoading;
      return () => clearTimeout(timer);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, story]);

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
  const showGenerateAnother = !isLoading && story;

  // Split paragraphs once for reuse
  const paragraphs = story.split('\n').filter((p) => p.trim());

  return (
    <div className="mt-6 w-full max-w-2xl mx-auto">
      {/* Story Card */}
      <div className="bg-[var(--surface-card)] rounded-3xl border-4 border-[var(--border-card)] shadow-[var(--clay-card)] p-6 md:p-8">
        {/* Header — glows once when story finishes */}
        <div
          className={`flex items-center gap-3 mb-5 rounded-2xl transition-shadow duration-300 ${glowActive ? 'animate-story-complete' : ''}`}
        >
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

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-2 mb-6 text-secondary/40 text-sm select-none" aria-hidden="true">
          <span className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="tracking-widest px-2">· ✦ ·</span>
          <span className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        {/* Story text area — warm tinted background */}
        <div className="bg-[var(--surface-chip-active)] rounded-2xl p-6 md:p-8">
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) =>
              index === 0 ? (
                <p
                  key={index}
                  className="text-foreground/80 leading-[1.85] text-lg md:text-xl font-serif [&::first-letter]:font-heading [&::first-letter]:float-left [&::first-letter]:text-[3.4em] [&::first-letter]:leading-[0.85] [&::first-letter]:mr-2 [&::first-letter]:mt-1 [&::first-letter]:text-primary"
                >
                  {paragraph}
                </p>
              ) : (
                <p
                  key={index}
                  className="text-foreground/80 leading-[1.85] text-lg md:text-xl font-serif"
                >
                  {paragraph}
                </p>
              )
            )}
            {isLoading && !story && (
              <p className="text-secondary italic animate-pulse text-lg font-serif">
                Once upon a time...
              </p>
            )}
          </div>

          {/* Closing ornament — only when story is complete */}
          {!isLoading && story && (
            <p className="text-center font-heading text-sm text-secondary mt-6 select-none" aria-hidden="true">
              ✦ The End ✦
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

          {/* Submit Button — warmer amber CTA style */}
          <button
            type="button"
            onClick={handleRatingSubmit}
            disabled={selectedRating === 0 || isSubmitting}
            className="w-full justify-center py-3 px-6 rounded-2xl border-4 border-amber-300/60 bg-amber-50 text-amber-700 font-heading font-semibold text-base shadow-[var(--clay-btn-cta)] hover:shadow-[var(--clay-btn-cta-hover)] hover:translate-y-0.5 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Submitting…
              </>
            ) : (
              'Share My Rating'
            )}
          </button>
        </div>
      )}

      {/* Thank You Message */}
      {showThankYou && (
        <div className="mt-4 bg-[var(--surface-success-bg)] rounded-3xl border-4 border-[var(--border-success)] shadow-[var(--clay-success)] p-6 md:p-8 text-center">
          <p className="font-heading text-lg font-semibold text-[var(--text-success)] flex items-center justify-center gap-2">
            ✨ Thanks! We&apos;re glad you enjoyed it.
          </p>
          <p className="text-sm text-[var(--text-success)]/70 mt-1">
            Come back tomorrow for a new story.
          </p>
        </div>
      )}

      {/* Generate Another Story */}
      {showGenerateAnother && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-2xl border-2 border-amber-400/60 bg-transparent text-amber-600 font-heading font-semibold text-base hover:bg-amber-50/60 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            Generate another story
          </button>
        </div>
      )}
    </div>
  );
}
