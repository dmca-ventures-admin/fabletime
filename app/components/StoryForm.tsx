'use client';

import { useState } from 'react';
import StoryDisplay from './StoryDisplay';

const characters = [
  { value: 'Fox', label: '🦊 Fox' },
  { value: 'Bear', label: '🐻 Bear' },
  { value: 'Little Wizard', label: '🧙 Little Wizard' },
  { value: 'Brave Knight', label: '⚔️ Brave Knight' },
  { value: 'Young Scientist', label: '🔬 Young Scientist' },
  { value: 'Mermaid', label: '🧜 Mermaid' },
];

const lengths = [
  { value: 'short', label: 'Short (300–400 words)' },
  { value: 'medium', label: 'Medium (500–700 words)' },
  { value: 'long', label: 'Long (800–1000 words)' },
];

const themes = [
  { value: 'Vocabulary', label: '📚 Vocabulary' },
  { value: 'Empathy', label: '💛 Empathy' },
  { value: 'Courage', label: '🦁 Courage' },
  { value: 'Kindness', label: '🌸 Kindness' },
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
        className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-8"
      >
        <div className="space-y-6">
          {/* Character Select */}
          <div>
            <label
              htmlFor="character"
              className="block text-sm font-semibold text-amber-800 mb-2 uppercase tracking-wide"
            >
              Main Character
            </label>
            <select
              id="character"
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-gray-800 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {characters.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Length Select */}
          <div>
            <label
              htmlFor="length"
              className="block text-sm font-semibold text-amber-800 mb-2 uppercase tracking-wide"
            >
              Story Length
            </label>
            <select
              id="length"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-gray-800 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {lengths.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Select */}
          <div>
            <label
              htmlFor="theme"
              className="block text-sm font-semibold text-amber-800 mb-2 uppercase tracking-wide"
            >
              Learning Theme
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-gray-800 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {themes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-4 px-6 text-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Writing your story...
              </>
            ) : (
              <>Generate Story ✨</>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <StoryDisplay story={story} isLoading={isLoading} />
    </div>
  );
}
