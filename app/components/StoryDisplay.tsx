'use client';

interface StoryDisplayProps {
  story: string;
  isLoading: boolean;
}

export default function StoryDisplay({ story, isLoading }: StoryDisplayProps) {
  if (!story && !isLoading) return null;

  return (
    <div className="mt-6 w-full max-w-2xl mx-auto">
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
    </div>
  );
}
