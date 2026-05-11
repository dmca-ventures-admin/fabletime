'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import StoryDisplay from './StoryDisplay';
import GenerateButton from './GenerateButton';
import CharacterPicker from './CharacterPicker';
import ThemePicker from './ThemePicker';
import FunninessSlider from './FunninessSlider';

const MAX_CHARACTERS = 3;
const MAX_WORDS_PER_ENTRY = 3;

const lengths = [
  { value: 'short', label: 'Short', sub: '~300 words' },
  { value: 'medium', label: 'Medium', sub: '~500 words' },
  { value: 'long', label: 'Long', sub: '~800 words' },
];

interface SuggestionEntry {
  value: string;
  emoji?: string;
}

interface Suggestions {
  characters: SuggestionEntry[];
  themes: SuggestionEntry[];
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
  // Suggestion state — full 50 from API (used for autocomplete)
  const [suggestions, setSuggestions] = useState<Suggestions>({ characters: [], themes: [] });
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState(false);
  // Randomly sampled display lists (9 chars, 8 themes) — set once on mount
  const [displayedCharacters, setDisplayedCharacters] = useState<SuggestionEntry[]>([]);
  const [displayedThemes, setDisplayedThemes] = useState<SuggestionEntry[]>([]);

  // Selection state
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [length, setLength] = useState('short');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [funninessLevel, setFunninessLevel] = useState(2);

  // Custom input state — pills are committed entries, input is in-progress typing
  const [characterPills, setCharacterPills] = useState<string[]>([]);
  const [customCharacterInput, setCustomCharacterInput] = useState('');
  const [themePills, setThemePills] = useState<string[]>([]);
  const [customThemeInput, setCustomThemeInput] = useState('');
  const [customCharacterError, setCustomCharacterError] = useState('');
  const [customThemeError, setCustomThemeError] = useState('');

  // Generation ID ref to prevent stale stream writes (#94)
  const generationIdRef = useRef<number>(0);

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
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const [inlineButtonVisible, setInlineButtonVisible] = useState(false);
  
  // Validation in-flight state (blocks input while validating)
  const [charValidating, setCharValidating] = useState(false);
  const [themeValidating, setThemeValidating] = useState(false);

  // Hide sticky button when the inline Generate button is visible
  useEffect(() => {
    const el = submitButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInlineButtonVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
          // Randomly sample 9 characters and 8 themes for display on this load
          const shuffledChars = [...data.characters].sort(() => Math.random() - 0.5);
          setDisplayedCharacters(shuffledChars.slice(0, 9));
          const shuffledThemes = [...data.themes].sort(() => Math.random() - 0.5);
          setDisplayedThemes(shuffledThemes.slice(0, 8));
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

  // Resolve the final theme: pills first, then input, then selected
  const finalTheme = themePills[0] || customThemeInput.trim() || selectedTheme;

  // Resolve the final characters: merge selected suggestions + pills
  const finalCharacters = [...Array.from(selectedCharacters), ...characterPills];

  const toggleCharacter = useCallback((value: string) => {
    if (isLoading) return;
    setSelectedCharacters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        // Don't allow selecting beyond max (include pills in count)
        if (next.size + characterPills.length >= MAX_CHARACTERS) return prev;
        next.add(value);
      }
      return next;
    });
  }, [isLoading, characterPills.length]);

  // Add a character pill (from comma or autocomplete selection)
  // Now validates synchronously before adding
  const addCharacterPill = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (characterPills.includes(trimmed)) return;
    if (selectedCharacters.has(trimmed)) return;
    if (selectedCharacters.size + characterPills.length >= MAX_CHARACTERS) return;
    if (exceedsMaxWords(trimmed)) {
      setCustomCharacterError(`"${trimmed}" exceeds ${MAX_WORDS_PER_ENTRY} words`);
      return;
    }
    
    // Synchronous validation before adding pill
    setCharValidating(true);
    setCustomCharacterError('');
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: trimmed, type: 'character' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.valid) {
          // Block the pill and show error
          setCustomCharacterInput('');
          if (data.reason === 'inappropriate') {
            setCustomCharacterError("That's not appropriate for a children's story");
          } else {
            setCustomCharacterError("That doesn't look like a valid character — try something like 'dragon' or 'astronaut'");
          }
          setCharValidating(false);
          return;
        }
      }
      // Validation passed or failed open — add the pill
      setCharacterPills((prev) => [...prev, trimmed]);
      setCustomCharacterInput('');
      setCustomCharacterError('');
    } catch {
      // Fail open — add the pill
      setCharacterPills((prev) => [...prev, trimmed]);
      setCustomCharacterInput('');
      setCustomCharacterError('');
    } finally {
      setCharValidating(false);
    }
  }, [characterPills, selectedCharacters]);

  // Remove a character pill
  const removeCharacterPill = useCallback((value: string) => {
    setCharacterPills((prev) => prev.filter((p) => p !== value));
  }, []);

  // Add a theme pill (from comma or autocomplete selection)
  // Now validates synchronously before adding
  const addThemePill = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (themePills.includes(trimmed)) return;
    if (exceedsMaxWords(trimmed)) {
      setCustomThemeError(`Theme must be ${MAX_WORDS_PER_ENTRY} words or fewer`);
      return;
    }
    
    // Synchronous validation before adding pill
    setThemeValidating(true);
    setCustomThemeError('');
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: trimmed, type: 'theme' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.valid) {
          // Block the pill and show error
          setCustomThemeInput('');
          if (data.reason === 'inappropriate') {
            setCustomThemeError("That's not appropriate for a children's story");
          } else {
            setCustomThemeError("That doesn't look like a valid theme — try something like 'friendship' or 'courage'");
          }
          setThemeValidating(false);
          return;
        }
      }
      // Validation passed or failed open — add the pill
      setThemePills([trimmed]);
      setCustomThemeInput('');
      setCustomThemeError('');
      setSelectedTheme(''); // Clear grid selection when adding custom pill
    } catch {
      // Fail open — add the pill
      setThemePills([trimmed]);
      setCustomThemeInput('');
      setCustomThemeError('');
      setSelectedTheme('');
    } finally {
      setThemeValidating(false);
    }
  }, [themePills]);

  // Remove a theme pill
  const removeThemePill = useCallback((value: string) => {
    setThemePills((prev) => prev.filter((p) => p !== value));
  }, []);

  const handleCustomCharacterChange = useCallback((value: string) => {
    setSubmitError('');

    // Check for comma — convert preceding text to a pill
    if (value.endsWith(',')) {
      const textBeforeComma = value.slice(0, -1).trim();
      if (textBeforeComma) {
        addCharacterPill(textBeforeComma);
      }
      return;
    }

    setCustomCharacterInput(value);

    // Validate current input
    const trimmed = value.trim();
    if (trimmed && exceedsMaxWords(trimmed)) {
      setCustomCharacterError(`"${trimmed}" exceeds ${MAX_WORDS_PER_ENTRY} words`);
    } else {
      setCustomCharacterError('');
    }
  }, [addCharacterPill]);

  const handleCustomThemeChange = useCallback((value: string) => {
    setSubmitError('');

    // Check for comma — convert preceding text to a pill
    if (value.endsWith(',')) {
      const textBeforeComma = value.slice(0, -1).trim();
      if (textBeforeComma) {
        addThemePill(textBeforeComma);
      }
      return;
    }

    setCustomThemeInput(value);

    // Validate current input
    const trimmed = value.trim();
    if (trimmed && exceedsMaxWords(trimmed)) {
      setCustomThemeError(`Theme must be ${MAX_WORDS_PER_ENTRY} words or fewer`);
    } else {
      setCustomThemeError('');
    }
  }, [addThemePill]);

  // Handle theme selection from grid — clears custom input/pills
  const handleSelectTheme = useCallback((value: string) => {
    setSelectedTheme(value);
    setThemePills([]);
    setCustomThemeInput('');
    setCustomThemeError('');
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

    const myGenerationId = ++generationIdRef.current;

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
        if (generationIdRef.current !== myGenerationId) break;
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
        className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-card)] shadow-sm p-6 md:p-10"
      >
        <div className="space-y-8">
          {/* Instruction line */}
          <p className="text-base text-secondary">
            Pick characters, choose a learning theme, and get a personalised story.
          </p>

          {/* Character Selection */}
          <CharacterPicker
            suggestions={suggestions.characters}
            displayedCharacters={displayedCharacters}
            suggestionsLoading={suggestionsLoading}
            suggestionsError={suggestionsError}
            selectedCharacters={selectedCharacters}
            characterPills={characterPills}
            customCharacterInput={customCharacterInput}
            customCharacterError={customCharacterError}
            charValidationWarning={charValidationWarning}
            isLoading={isLoading}
            isValidating={charValidating}
            maxCharacters={MAX_CHARACTERS}
            onToggleCharacter={toggleCharacter}
            onAddPill={addCharacterPill}
            onRemovePill={removeCharacterPill}
            onInputChange={handleCustomCharacterChange}
          />

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
          <ThemePicker
            suggestions={suggestions.themes}
            displayedThemes={displayedThemes}
            suggestionsLoading={suggestionsLoading}
            suggestionsError={suggestionsError}
            selectedTheme={selectedTheme}
            themePills={themePills}
            customThemeInput={customThemeInput}
            customThemeError={customThemeError}
            themeValidationWarning={themeValidationWarning}
            isLoading={isLoading}
            isValidating={themeValidating}
            onSelectTheme={handleSelectTheme}
            onAddPill={addThemePill}
            onRemovePill={removeThemePill}
            onInputChange={handleCustomThemeChange}
          />

          {/* Submission error */}
          {submitError && (
            <p className="text-sm text-red-500 font-medium" role="alert">
              {submitError}
            </p>
          )}

          {/* Funniness Level */}
          <FunninessSlider
            value={funninessLevel}
            onChange={setFunninessLevel}
            disabled={isLoading}
          />

          {/* Submit Button */}
          <GenerateButton
            ref={submitButtonRef}
            isLoading={isLoading}
            type="submit"
            className="w-full"
          />
        </div>
      </form>

      {/* Sticky Generate button — mobile only, hidden once story is showing */}
      {!story && !inlineButtonVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-[var(--bg-background,_white)] to-transparent pointer-events-none">
          <GenerateButton
            type="button"
            isLoading={isLoading}
            onClick={() => {
              const form = document.querySelector('form') as HTMLFormElement | null;
              if (!form) return;
              if (form.requestSubmit) {
                form.requestSubmit();
              } else {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
            className="w-full pointer-events-auto shadow-lg"
          />
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
