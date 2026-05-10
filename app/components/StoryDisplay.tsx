'use client';

import { useState, useEffect, useRef } from 'react';

interface StoryDisplayProps {
  story: string;
  isLoading: boolean;
  storyId: string | null;
  hasRated: boolean;
  onRated: () => void;
  characters: string[];
  theme: string;
  onGenerateAnother?: () => void;
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

export default function StoryDisplay({ story, isLoading, storyId, hasRated, onRated, characters, theme, onGenerateAnother }: StoryDisplayProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Discussion questions state
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);
  const questionsFetchedRef = useRef(false);

  // Story image state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const imageFetchedRef = useRef(false);

  // Reset fetch guard and rating state when a new story starts
  useEffect(() => {
    if (isLoading) {
      questionsFetchedRef.current = false;
      imageFetchedRef.current = false;
      setQuestions([]);
      setQuestionsError(false);
      setImageUrl(null);
      setImageLoading(false);
      setSelectedRating(0);
      setHoveredRating(0);
      setFeedbackText('');
      setSubmitError('');
    }
  }, [isLoading]);

  // Fetch story image once story finishes streaming (trigger on isLoading→false)
  useEffect(() => {
    if (isLoading || !story || imageFetchedRef.current) return;
    if (!characters.length || !theme) return;
    imageFetchedRef.current = true;
    let cancelled = false;
    setImageLoading(true);
    const storySnapshot = story;
    const charactersSnapshot = [...characters];
    fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characters: charactersSnapshot, theme, story: storySnapshot }),
    })
      .then((res) => res.json())
      .then((data) => { if (!cancelled && data.url) setImageUrl(data.url); })
      .catch((err) => { console.error('[IMG] client fetch error:', err); })
      .finally(() => { if (!cancelled) setImageLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Fetch discussion questions once the story finishes streaming
  useEffect(() => {
    if (isLoading || !story || questionsFetchedRef.current) return;
    if (!characters.length || !theme) {
      setQuestionsError(true);
      return;
    }

    questionsFetchedRef.current = true;
    let cancelled = false;
    setQuestionsLoading(true);
    setQuestionsError(false);

    async function fetchQuestions() {
      try {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story, characters, theme }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.error('[Q] Failed to fetch discussion questions:', err);
        if (!cancelled) setQuestionsError(true);
      } finally {
        if (!cancelled) setQuestionsLoading(false);
      }
    }

    fetchQuestions();
    return () => { cancelled = true; };
  // story/characters/theme are read but the trigger is isLoading→false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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
  const showActions = !isLoading && story;

  const handleGenerateAnother = () => {
    if (onGenerateAnother) {
      onGenerateAnother();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-8 w-full max-w-2xl mx-auto">
      {/* Story Card */}
      <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-card)] shadow-sm p-6 md:p-10">
        <div className="space-y-5">
          {story.split('\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;
            // First line is the title (# Title)
            if (trimmed.startsWith('# ')) {
              return (
                <div key={index} className="flex items-center gap-3 mb-4">
                  <h1 className="font-heading text-2xl font-bold text-primary">
                    {trimmed.slice(2)}
                  </h1>
                  {isLoading && (
                    <span className="inline-flex items-center gap-1.5" aria-label="Story is loading">
                      <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
                      <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
                      <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-bounce" />
                    </span>
                  )}
                </div>
              );
            }
            return (
              <p
                key={index}
                className="text-foreground leading-loose text-base md:text-lg font-serif"
              >
                {trimmed}
              </p>
            );
          })}
          {isLoading && !story && (
            <p className="text-secondary italic animate-pulse text-lg font-serif">
              Once upon a time...
            </p>
          )}
        </div>
      </div>

      {/* Story Illustration — appears after story, before discussion questions */}
      {!isLoading && story && (imageLoading || imageUrl) && (
        <div className="mt-4">
          {imageLoading && (
            <div className="w-full aspect-square rounded-2xl border border-[var(--border-card)] bg-[var(--surface-chip-inactive)] animate-pulse" />
          )}
          {imageUrl && !imageLoading && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Story illustration"
              className="w-full rounded-2xl border border-[var(--border-card)] shadow-sm"
            />
          )}
        </div>
      )}

      {/* Discussion Questions */}
      {!isLoading && story && (questionsLoading || questions.length > 0 || questionsError) && (
        <div className="mt-4 bg-[var(--surface-card)] rounded-2xl border border-[var(--border-card)] shadow-sm p-6 md:p-8">
          <h3 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <span aria-hidden="true">💬</span>
            Discussion Questions
          </h3>

          {questionsLoading && (
            <div className="space-y-3" aria-label="Loading discussion questions">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 shrink-0 mt-0.5" />
                  <div className="flex-1 h-5 rounded bg-secondary/20" />
                </div>
              ))}
            </div>
          )}

          {questionsError && (
            <p className="text-sm text-secondary italic">
              Could not load discussion questions — try generating another story.
            </p>
          )}

          {questions.length > 0 && (
            <ol className="space-y-3 list-none">
              {questions.map((q, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-chip-active)] text-primary text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground text-base leading-relaxed">{q}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Rating Form */}
      {showRatingForm && (
        <div className="mt-4 bg-[var(--surface-card)] rounded-2xl border border-[var(--border-card)] shadow-sm p-6 md:p-8">
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
                        : 'text-secondary opacity-30'
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
              className="w-full rounded-2xl border border-[var(--border-card)] bg-[var(--surface-input)] text-foreground placeholder:text-[var(--text-hint)] p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-150"
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div
              className="mb-4 p-3 bg-[var(--surface-error-bg)] border border-[var(--border-error)] rounded-xl text-[var(--text-error)] text-sm font-medium"
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
            className="py-2.5 px-6 rounded-xl border border-primary bg-primary text-white font-heading font-semibold text-base hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer flex items-center gap-2"
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
        <div className="mt-4 bg-[var(--surface-success-bg)] rounded-2xl border border-[var(--border-success)] p-6 md:p-8 text-center">
          <p className="font-heading text-lg font-semibold text-[var(--text-success)] flex items-center justify-center gap-2">
            Thanks for your feedback!
            <span aria-hidden="true">⭐</span>
          </p>
        </div>
      )}

      {/* Post-story actions */}
      {showActions && (
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={handleGenerateAnother}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-heading font-semibold text-base transition-colors duration-200 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
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
