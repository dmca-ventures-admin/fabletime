'use client';

import { useState } from 'react';
import StoryDisplay from './StoryDisplay';

const characters = [
  { value: 'Fox', label: 'Fox', emoji: '🦊' },
  { value: 'Bear', label: 'Bear', emoji: '🐻' },
  { value: 'Little Wizard', label: 'Wizard', emoji: '🧙' },
  { value: 'Brave Knight', label: 'Knight', emoji: '🛡️' },
  { value: 'Young Scientist', label: 'Scientist', emoji: '🔬' },
  { value: 'Mermaid', label: 'Mermaid', emoji: '🧜' },
];

const lengths = [
  { value: 'short', label: 'Short', sub: '~300 words' },
  { value: 'medium', label: 'Medium', sub: '~500 words' },
  { value: 'long', label: 'Long', sub: '~800 words' },
];

const themes = [
  {
    value: 'Vocabulary',
    label: 'Vocabulary',
    icon: (
      <svg
        className="w-5 h-5 shrink-0"
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
    ),
  },
  {
    value: 'Empathy',
    label: 'Empathy',
    icon: (
      <svg
        className="w-5 h-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    value: 'Courage',
    label: 'Courage',
    icon: (
      <svg
        className="w-5 h-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    value: 'Kindness',
    label: 'Kindness',
    icon: (
      <svg
        className="w-5 h-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
    ),
  },
];

export default function StoryForm() {
  const [character, setCharacter] = useState('Fox');
  const [length, setLength] = useState('short');
  const [theme, setTheme] = useState('Kindness');
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStory('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, length, theme }),
      });

      if (!response.ok) throw new Error('Failed to generate story');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setStory((prev) => prev + text);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong generating the story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border-4 border-indigo-200 shadow-[var(--clay-card)] p-6 md:p-8"
      >
        <div className="space-y-7">
          {/* Character Selection */}
          <fieldset>
            <legend className="block text-xs font-semibold text-secondary mb-3 uppercase tracking-wider">
              Choose Your Hero
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {characters.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => !isLoading && setCharacter(c.value)}
                  disabled={isLoading}
                  aria-pressed={character === c.value}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-4 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                    character === c.value
                      ? 'border-secondary bg-background shadow-[var(--clay-chip)]'
                      : 'border-indigo-100 bg-white hover:border-indigo-200 hover:bg-background/40 shadow-[var(--clay-chip-inactive)]'
                  }`}
                >
                  <span className="text-2xl leading-none" role="img" aria-label={c.label}>
                    {c.emoji}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      character === c.value ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Story Length */}
          <fieldset>
            <legend className="block text-xs font-semibold text-secondary mb-3 uppercase tracking-wider">
              Story Length
            </legend>
            <div className="flex gap-2">
              {lengths.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => !isLoading && setLength(l.value)}
                  disabled={isLoading}
                  aria-pressed={length === l.value}
                  className={`flex-1 flex flex-col items-center py-3 px-2 rounded-2xl border-4 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                    length === l.value
                      ? 'border-secondary bg-primary text-white shadow-[var(--clay-chip)]'
                      : 'border-indigo-100 bg-white text-primary hover:border-indigo-200 hover:bg-background shadow-[var(--clay-chip-inactive)]'
                  }`}
                >
                  <span className="font-heading font-semibold text-base">{l.label}</span>
                  <span
                    className={`text-xs mt-0.5 ${
                      length === l.value ? 'text-indigo-200' : 'text-secondary'
                    }`}
                  >
                    {l.sub}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Learning Theme */}
          <fieldset>
            <legend className="block text-xs font-semibold text-secondary mb-3 uppercase tracking-wider">
              Learning Theme
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => !isLoading && setTheme(t.value)}
                  disabled={isLoading}
                  aria-pressed={theme === t.value}
                  className={`flex items-center gap-2.5 py-3 px-4 rounded-2xl border-4 font-semibold text-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                    theme === t.value
                      ? 'border-secondary bg-primary text-white shadow-[var(--clay-chip)]'
                      : 'border-indigo-100 bg-white text-primary hover:border-indigo-200 hover:bg-background shadow-[var(--clay-chip-inactive)]'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl border-4 border-cta-border bg-cta text-white font-heading font-semibold text-xl shadow-[var(--clay-btn-cta)] hover:shadow-[var(--clay-btn-cta-hover)] hover:translate-y-0.5 active:shadow-[var(--clay-btn-cta-active)] active:translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[var(--clay-btn-cta-disabled)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <span
                  className="inline-block w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Writing your story...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Generate Story
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div
          className="mt-4 p-4 bg-red-50 border-4 border-red-200 rounded-2xl text-red-700 text-sm font-medium shadow-[var(--clay-error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      <StoryDisplay story={story} isLoading={isLoading} />
    </div>
  );
}
