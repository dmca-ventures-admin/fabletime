'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import StoryDisplay from './StoryDisplay';

const MAX_CHARACTERS = 3;
const MAX_WORDS_PER_ENTRY = 3;

/** Emoji lookup for known characters — custom/unknown entries get the default */
const CHARACTER_EMOJI: Record<string, string> = {
  fox: '🦊',
  bear: '🐻',
  wizard: '🧙',
  knight: '🛡️',
  scientist: '🔬',
  mermaid: '🧜',
  dragon: '🐉',
  princess: '👸',
  prince: '🤴',
  pirate: '🏴‍☠️',
  robot: '🤖',
  cat: '🐱',
  dog: '🐶',
  owl: '🦉',
  bunny: '🐰',
  rabbit: '🐇',
  unicorn: '🦄',
  dinosaur: '🦕',
  fairy: '🧚',
  astronaut: '🧑‍🚀',
  monkey: '🐒',
  lion: '🦁',
  elephant: '🐘',
  penguin: '🐧',
  fish: '🐟',
  turtle: '🐢',
  butterfly: '🦋',
  frog: '🐸',
  mouse: '🐭',
  bird: '🐦',
  martian: '👽',
  wolf: '🐺',
  horse: '🐴',
  panda: '🐼',
  shark: '🦈',
  bee: '🐝',
  witch: '🧙‍♀️',
  superhero: '🦸',
  messi: '⚽',
};
const DEFAULT_CHARACTER_EMOJI = '⭐';

/** Emoji lookup for known themes — custom/unknown entries get the default */
const THEME_EMOJI: Record<string, string> = {
  kindness: '🤝',
  courage: '⚡',
  empathy: '💛',
  vocabulary: '📚',
  friendship: '👫',
  honesty: '💎',
  creativity: '🎨',
  patience: '🧘',
  sharing: '🤲',
  teamwork: '🫂',
  curiosity: '🔍',
  gratitude: '🙏',
  respect: '🌟',
  perseverance: '💪',
  responsibility: '🏅',
};
const DEFAULT_THEME_EMOJI = '💡';

/** Get the emoji for a character name (case-insensitive lookup, falls back to word matching) */
function getCharacterEmoji(name: string): string {
  const key = name.toLowerCase().trim();
  if (CHARACTER_EMOJI[key]) return CHARACTER_EMOJI[key];
  // Try matching any word in the name (e.g. "Little Wizard" → wizard → 🧙)
  const words = key.split(/\s+/);
  for (const word of words) {
    if (CHARACTER_EMOJI[word]) return CHARACTER_EMOJI[word];
  }
  return DEFAULT_CHARACTER_EMOJI;
}

/** Get the emoji for a theme name (case-insensitive lookup, falls back to word matching) */
function getThemeEmoji(name: string): string {
  const key = name.toLowerCase().trim();
  if (THEME_EMOJI[key]) return THEME_EMOJI[key];
  const words = key.split(/\s+/);
  for (const word of words) {
    if (THEME_EMOJI[word]) return THEME_EMOJI[word];
  }
  return DEFAULT_THEME_EMOJI;
}

const lengths = [
  { value: 'short', label: 'Short', sub: '~300 words' },
  { value: 'medium', label: 'Medium', sub: '~500 words' },
  { value: 'long', label: 'Long', sub: '~800 words' },
];

interface Suggestions {
  characters: string[];
  themes: string[];
}

/** Parse comma-separated input into trimmed, non-empty entries */
function parseCustomCharacters(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Check if a single entry exceeds the max word count */
function exceedsMaxWords(entry: string): boolean {
  return entry.trim().split(/\s+/).length > MAX_WORDS_PER_ENTRY;
}

export default function StoryForm() {
  // Suggestion state
  const [suggestions, setSuggestions] = useState<Suggestions>({ characters: [], themes: [] });
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState(false);

  // Selection state
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [length, setLength] = useState('short');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [funninessLevel, setFunninessLevel] = useState(2);

  // Custom input state
  const [customCharacterInput, setCustomCharacterInput] = useState('');
  const [customThemeInput, setCustomThemeInput] = useState('');
  const [customCharacterError, setCustomCharacterError] = useState('');
  const [customThemeError, setCustomThemeError] = useState('');

  // Form state
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // AI validation state
  const [charValidationWarning, setCharValidationWarning] = useState('');
  const [themeValidationWarning, setThemeValidationWarning] = useState('');
  const charValidationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeValidationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestions() {
      try {
        const res = await fetch('/api/suggestions');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Suggestions = await res.json();

        if (!cancelled) {
          setSuggestions(data);
          setSuggestionsLoading(false);
        }
      } catch (err) {
        console.error('[S03] Failed to fetch suggestions:', err);
        if (!cancelled) {
          setSuggestionsError(true);
          setSuggestionsLoading(false);
        }
      }
    }

    fetchSuggestions();
    return () => { cancelled = true; };
  }, []);

  // Debounced AI validation for custom inputs
  const validateInput = useCallback(async (value: string, type: 'character' | 'theme') => {
    const trimmed = value.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: trimmed, type }),
      });
      if (!res.ok) return;
      const data = await res.json();

      if (!data.valid && data.suggestion) {
        return `Did you mean "${data.suggestion}"?`;
      } else if (!data.valid) {
        return `This doesn't look like a valid ${type} — you can still continue.`;
      }
    } catch {
      // Fail silently — validation is advisory
    }
    return '';
  }, []);

  // Trigger debounced validation on custom character input
  useEffect(() => {
    if (charValidationTimer.current) clearTimeout(charValidationTimer.current);
    setCharValidationWarning('');

    const entries = parseCustomCharacters(customCharacterInput);
    const lastEntry = entries[entries.length - 1];
    if (!lastEntry || !lastEntry.trim()) return;

    charValidationTimer.current = setTimeout(async () => {
      const warning = await validateInput(lastEntry, 'character');
      if (warning) setCharValidationWarning(warning);
    }, 800);

    return () => {
      if (charValidationTimer.current) clearTimeout(charValidationTimer.current);
    };
  }, [customCharacterInput, validateInput]);

  // Trigger debounced validation on custom theme input
  useEffect(() => {
    if (themeValidationTimer.current) clearTimeout(themeValidationTimer.current);
    setThemeValidationWarning('');

    if (!customThemeInput.trim()) return;

    themeValidationTimer.current = setTimeout(async () => {
      const warning = await validateInput(customThemeInput, 'theme');
      if (warning) setThemeValidationWarning(warning);
    }, 800);

    return () => {
      if (themeValidationTimer.current) clearTimeout(themeValidationTimer.current);
    };
  }, [customThemeInput, validateInput]);

  // Derived counts
  const parsedCustomCharacters = parseCustomCharacters(customCharacterInput);
  const totalCharacters = selectedCharacters.size + parsedCustomCharacters.length;
  const maxReached = totalCharacters >= MAX_CHARACTERS;

  // Resolve the final theme: custom input takes precedence if non-empty
  const finalTheme = customThemeInput.trim() || selectedTheme;

  // Resolve the final characters: merge selected suggestions + custom entries
  const finalCharacters = [...Array.from(selectedCharacters), ...parsedCustomCharacters];

  const toggleCharacter = useCallback((value: string) => {
    if (isLoading) return;
    setSelectedCharacters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        // Don't allow selecting beyond max
        if (next.size + parsedCustomCharacters.length >= MAX_CHARACTERS) return prev;
        next.add(value);
      }
      return next;
    });
  }, [isLoading, parsedCustomCharacters.length]);

  const handleCustomCharacterChange = useCallback((value: string) => {
    setCustomCharacterInput(value);
    setSubmitError('');

    // Validate each entry
    const entries = parseCustomCharacters(value);
    const tooLong = entries.find(exceedsMaxWords);
    if (tooLong) {
      setCustomCharacterError(`"${tooLong}" exceeds ${MAX_WORDS_PER_ENTRY} words`);
    } else {
      setCustomCharacterError('');
    }
  }, []);

  const handleCustomThemeChange = useCallback((value: string) => {
    setCustomThemeInput(value);
    setSubmitError('');

    if (value.trim() && exceedsMaxWords(value)) {
      setCustomThemeError(`Custom theme must be ${MAX_WORDS_PER_ENTRY} words or fewer`);
    } else {
      setCustomThemeError('');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validate: at least 1 character
    if (finalCharacters.length === 0) {
      setSubmitError('Please select or type at least one character');
      return;
    }

    // Validate: max characters
    if (finalCharacters.length > MAX_CHARACTERS) {
      setSubmitError(`Maximum ${MAX_CHARACTERS} characters allowed`);
      return;
    }

    // Validate: no entries exceed word limit
    const tooLongChar = finalCharacters.find(exceedsMaxWords);
    if (tooLongChar) {
      setSubmitError(`"${tooLongChar}" exceeds ${MAX_WORDS_PER_ENTRY} words`);
      return;
    }

    // Validate: theme required
    if (!finalTheme) {
      setSubmitError('Please select or type a theme');
      return;
    }

    if (finalTheme && exceedsMaxWords(finalTheme)) {
      setSubmitError(`Theme must be ${MAX_WORDS_PER_ENTRY} words or fewer`);
      return;
    }

    setStory('');
    setError('');
    setStoryId(null);
    setHasRated(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: finalCharacters,
          length,
          theme: finalTheme,
          funninessLevel,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate story');
      if (!response.body) throw new Error('No response body');

      const id = response.headers.get('X-Story-Id');
      setStoryId(id);

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

  // Determine if custom character input should show a "max reached" warning
  const customWouldExceedMax =
    parsedCustomCharacters.length > 0 &&
    selectedCharacters.size + parsedCustomCharacters.length > MAX_CHARACTERS;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-card)] shadow-sm p-6 md:p-10"
      >
        <div className="space-y-8">
          {/* Character Selection */}
          <fieldset>
            <legend className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Choose Your Heroes
            </legend>
            <p className="text-xs text-secondary mb-3">
              Pick up to {MAX_CHARACTERS} characters
              {maxReached && (
                <span className="text-amber-600 font-semibold ml-1">(max {MAX_CHARACTERS} reached)</span>
              )}
            </p>

            {/* Dynamic suggestion buttons */}
            {suggestionsLoading ? (
              <div className="grid grid-cols-3 gap-2 mb-3" aria-label="Loading character suggestions">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-chip-inactive)] animate-pulse"
                    aria-hidden="true"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary/20" />
                    <div className="w-12 h-3 rounded bg-secondary/20" />
                  </div>
                ))}
              </div>
            ) : suggestionsError || suggestions.characters.length === 0 ? (
              <p className="text-xs text-secondary mb-3 italic">
                {suggestionsError
                  ? 'Could not load suggestions — type your own characters below'
                  : 'No popular characters yet — type your own below'}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(() => {
                  const usedCharEmojis = new Set<string>();
                  return suggestions.characters.map((name) => {
                    const isSelected = selectedCharacters.has(name);
                    const isDisabled = isLoading || (!isSelected && maxReached);
                    const emoji = getCharacterEmoji(name);
                    const displayEmoji = usedCharEmojis.has(emoji) ? DEFAULT_CHARACTER_EMOJI : emoji;
                    usedCharEmojis.add(displayEmoji);

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleCharacter(name)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                          isSelected
                            ? 'border-primary bg-primary text-white'
                            : 'border-[var(--border-card)] bg-[var(--surface-chip-inactive)] hover:border-primary hover:bg-[var(--surface-chip-active)]'
                        }`}
                      >
                        <span
                          className={`text-2xl leading-none ${
                            isSelected ? '' : ''
                          }`}
                          aria-hidden="true"
                        >
                          {displayEmoji}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-white' : 'text-foreground'
                          }`}
                        >
                          {name}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            )}

            {/* Custom character input */}
            <div>
              <input
                type="text"
                value={customCharacterInput}
                onChange={(e) => handleCustomCharacterChange(e.target.value)}
                disabled={isLoading}
                placeholder="Or type custom characters (comma-separated)..."
                aria-label="Custom characters"
                aria-invalid={!!customCharacterError || customWouldExceedMax}
                aria-describedby={
                  customCharacterError
                    ? 'custom-character-error'
                    : customWouldExceedMax
                      ? 'custom-character-max-error'
                      : undefined
                }
                className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-[var(--surface-input)] text-foreground placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-secondary/60 focus:border-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                  customCharacterError || customWouldExceedMax
                    ? 'border-red-400'
                    : 'border-[var(--border-subtle)]'
                }`}
              />
              {customCharacterError && (
                <p id="custom-character-error" className="text-xs text-red-500 mt-1" role="alert">
                  {customCharacterError}
                </p>
              )}
              {customWouldExceedMax && !customCharacterError && (
                <p id="custom-character-max-error" className="text-xs text-amber-600 mt-1" role="alert">
                  Total characters exceed maximum of {MAX_CHARACTERS} — remove some selections or custom entries
                </p>
              )}
              {charValidationWarning && !customCharacterError && !customWouldExceedMax && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span aria-hidden="true">💡</span>
                  {charValidationWarning}
                </p>
              )}
              {!customCharacterInput && (
                <p className="text-xs text-secondary italic mt-1">Add multiple: Pirate, Dragon, Princess</p>
              )}
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
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border font-semibold text-sm transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed ${
                    length === l.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-[var(--border-card)] bg-[var(--surface-chip-inactive)] text-foreground hover:border-primary hover:bg-[var(--surface-chip-active)]'
                  }`}
                >
                  <span>{l.label}</span>
                  <span
                    className={`text-xs font-normal ${
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

            {/* Dynamic theme suggestion buttons */}
            {suggestionsLoading ? (
              <div className="grid grid-cols-2 gap-2 mb-3" aria-label="Loading theme suggestions">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="py-3 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-chip-inactive)] animate-pulse"
                    aria-hidden="true"
                  >
                    <div className="w-16 h-4 rounded bg-secondary/20" />
                  </div>
                ))}
              </div>
            ) : suggestionsError || suggestions.themes.length === 0 ? (
              <p className="text-xs text-secondary mb-3 italic">
                {suggestionsError
                  ? 'Could not load themes — type your own theme below'
                  : 'No popular themes yet — type your own below'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(() => {
                  const usedThemeEmojis = new Set<string>();
                  return suggestions.themes.map((name) => {
                    const isSelected = selectedTheme === name && !customThemeInput.trim();
                    const emoji = getThemeEmoji(name);
                    const displayEmoji = usedThemeEmojis.has(emoji) ? DEFAULT_THEME_EMOJI : emoji;
                    usedThemeEmojis.add(displayEmoji);

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          if (!isLoading) {
                            setSelectedTheme(name);
                            // Clear custom theme when selecting a suggestion
                            setCustomThemeInput('');
                            setCustomThemeError('');
                          }
                        }}
                        disabled={isLoading}
                        aria-pressed={isSelected}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border font-semibold text-sm transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-primary bg-primary text-white'
                            : 'border-[var(--border-card)] bg-[var(--surface-chip-inactive)] text-foreground hover:border-primary hover:bg-[var(--surface-chip-active)]'
                        }`}
                      >
                        <span className="text-lg leading-none" aria-hidden="true">
                          {displayEmoji}
                        </span>
                        {name}
                      </button>
                    );
                  });
                })()}
              </div>
            )}

            {/* Custom theme input */}
            <div>
              <input
                type="text"
                value={customThemeInput}
                onChange={(e) => handleCustomThemeChange(e.target.value)}
                disabled={isLoading}
                placeholder="Or type a custom theme..."
                aria-label="Custom theme"
                aria-invalid={!!customThemeError}
                aria-describedby={customThemeError ? 'custom-theme-error' : undefined}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-[var(--surface-input)] text-foreground placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 focus:ring-secondary/60 focus:border-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                  customThemeError ? 'border-red-400' : 'border-[var(--border-subtle)]'
                }`}
              />
              {customThemeError && (
                <p id="custom-theme-error" className="text-xs text-red-500 mt-1" role="alert">
                  {customThemeError}
                </p>
              )}
              {themeValidationWarning && !customThemeError && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span aria-hidden="true">💡</span>
                  {themeValidationWarning}
                </p>
              )}
              {!customThemeInput && (
                <p className="text-xs text-secondary italic mt-1">Try: Bravery, Honesty, Friendship</p>
              )}
            </div>
          </fieldset>

          {/* Submission error */}
          {submitError && (
            <p className="text-sm text-red-500 font-medium" role="alert">
              {submitError}
            </p>
          )}

          {/* Funniness Level */}
          <fieldset>
            <legend className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
              Funniness Level
            </legend>
            <p className="text-xs text-secondary mb-3">How funny should the story be?</p>
            <div className="px-4">
              {/* Slider CSS is in globals.css */}
              {/* Wrapper adds horizontal padding so emoji has room at both ends */}
              <div className="relative" style={{ height: '44px', paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' }}>
                {/* Track — spans the padded area */}
                <div
                  className="absolute"
                  style={{ left: '16px', right: '16px', top: '50%', marginTop: '-3px', height: '6px', borderRadius: '9999px',
                    background: `linear-gradient(to right, var(--color-primary) ${(funninessLevel - 1) * 25}%, var(--border-subtle) ${(funninessLevel - 1) * 25}%)` }}
                />
                {/* Range input spans full width for interaction */}
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={funninessLevel}
                  onChange={(e) => setFunninessLevel(Number(e.target.value))}
                  disabled={isLoading}
                  aria-label="Funniness level"
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-valuenow={funninessLevel}
                  aria-valuetext={['Not funny at all', 'A little funny', 'Pretty amusing', 'Hilarious', 'Too funny for words'][funninessLevel - 1]}
                  className="funniness-slider absolute inset-0 w-full"
                />
                {/* Emoji — travels 0% to 100% of the padded inner width */}
                <span
                  className="absolute pointer-events-none select-none"
                  style={{
                    fontSize: '26px',
                    lineHeight: 1,
                    top: '50%',
                    marginTop: '-13px',
                    left: `calc(16px + ${(funninessLevel - 1) / 4} * (100% - 32px))`,
                    transform: 'translateX(-50%)',
                    width: '32px',
                    textAlign: 'center',
                    zIndex: 3,
                  }}
                  aria-hidden="true"
                >
                  {['😐', '🙂', '😄', '😂', '🤣'][funninessLevel - 1]}
                </span>
              </div>
            </div>
          </fieldset>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl bg-cta hover:bg-cta-hover text-white font-heading font-semibold text-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer flex items-center justify-center gap-3"
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

      {/* Sticky Generate button — mobile only, hidden once story is showing */}
      {!story && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-[var(--bg-background,_white)] to-transparent pointer-events-none">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            className="w-full py-4 px-6 rounded-xl bg-cta hover:bg-cta-hover text-white font-heading font-semibold text-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer flex items-center justify-center gap-3 pointer-events-auto shadow-lg"
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
      )}

      {error && (
        <div
          className="mt-4 p-4 bg-[var(--surface-error-bg)] border border-[var(--border-error)] rounded-xl text-[var(--text-error)] text-sm font-medium"
          role="alert"
        >
          {error}
        </div>
      )}

      <StoryDisplay
        story={story}
        isLoading={isLoading}
        storyId={storyId}
        hasRated={hasRated}
        onRated={() => setHasRated(true)}
        characters={finalCharacters}
        theme={finalTheme}
        onGenerateAnother={() => {
          // Reset story state only — keep all form selections
          setStory('');
          setStoryId(null);
          setHasRated(false);
          setIsLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
