'use client';

import React, { memo, useRef, useEffect } from 'react';
import {
  THEME_FALLBACK_POOL,
  DEFAULT_THEME_EMOJI,
  getThemeEmoji,
} from '@/lib/constants';

interface SuggestionEntry {
  value: string;
  emoji?: string;
}

interface ThemePickerProps {
  /** Full suggestions list for autocomplete */
  suggestions: SuggestionEntry[];
  /** Randomly sampled display list (8 themes) */
  displayedThemes: SuggestionEntry[];
  /** Loading state for suggestions */
  suggestionsLoading: boolean;
  /** Error state for suggestions */
  suggestionsError: boolean;
  /** Currently selected theme from grid */
  selectedTheme: string;
  /** Custom theme pills (max 1) */
  themePills: string[];
  /** Current input value */
  customThemeInput: string;
  /** Error message for input */
  customThemeError: string;
  /** Validation warning from AI */
  themeValidationWarning: string;
  /** Whether form is submitting */
  isLoading: boolean;
  /** Select a theme from grid */
  onSelectTheme: (value: string) => void;
  /** Add a theme pill */
  onAddPill: (value: string) => void;
  /** Remove a theme pill */
  onRemovePill: (value: string) => void;
  /** Handle input change */
  onInputChange: (value: string) => void;
}

const ThemePicker = memo(function ThemePicker({
  suggestions,
  displayedThemes,
  suggestionsLoading,
  suggestionsError,
  selectedTheme,
  themePills,
  customThemeInput,
  customThemeError,
  themeValidationWarning,
  isLoading,
  onSelectTheme,
  onAddPill,
  onRemovePill,
  onInputChange,
}: ThemePickerProps) {
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Autocomplete suggestions
  const autocompleteSuggestions = showDropdown && customThemeInput.trim()
    ? suggestions
        .filter(
          (t) =>
            t.value.toLowerCase().includes(customThemeInput.toLowerCase()) &&
            !themePills.includes(t.value)
        )
        .slice(0, 5)
    : [];

  return (
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
      ) : suggestionsError || suggestions.length === 0 ? (
        <p className="text-xs text-secondary mb-3 italic">
          {suggestionsError
            ? 'Could not load themes — type your own theme below'
            : 'No popular themes yet — type your own below'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(() => {
            const usedEmojis = new Set<string>();
            let poolIdx = 0;
            return displayedThemes.map((entry) => {
              const isSelected = selectedTheme === entry.value && themePills.length === 0 && !customThemeInput.trim();
              const emoji = entry.emoji || getThemeEmoji(entry.value);
              let displayEmoji = emoji;
              if (usedEmojis.has(displayEmoji)) {
                while (poolIdx < THEME_FALLBACK_POOL.length) {
                  const candidate = THEME_FALLBACK_POOL[poolIdx++];
                  if (!usedEmojis.has(candidate)) {
                    displayEmoji = candidate;
                    break;
                  }
                }
                if (usedEmojis.has(displayEmoji)) displayEmoji = DEFAULT_THEME_EMOJI;
              }
              usedEmojis.add(displayEmoji);

              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => {
                    if (!isLoading) {
                      onSelectTheme(entry.value);
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
                  {entry.value}
                </button>
              );
            });
          })()}
        </div>
      )}

      {/* Custom theme input with pill and autocomplete */}
      <div ref={inputWrapperRef} className="relative">
        <div
          className={`flex flex-wrap items-center gap-1.5 w-full px-3 py-2 rounded-xl border text-sm bg-[var(--surface-input)] transition-colors duration-200 ${
            customThemeError
              ? 'border-red-400'
              : 'border-[var(--border-subtle)] focus-within:ring-2 focus-within:ring-secondary/60 focus-within:border-secondary'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            const input = inputWrapperRef.current?.querySelector('input');
            input?.focus();
          }}
        >
          {/* Theme pill (only one allowed) */}
          {themePills.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
            >
              {pill}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePill(pill);
                }}
                disabled={isLoading}
                className="ml-0.5 p-0.5 rounded hover:bg-primary/20 transition-colors"
                aria-label={`Remove ${pill}`}
              >
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </span>
          ))}
          {/* Text input — hidden when a pill exists */}
          {themePills.length === 0 && (
            <input
              type="text"
              value={customThemeInput}
              onChange={(e) => {
                onInputChange(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                // Enter commits current input as pill
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customThemeInput.trim()) {
                    onAddPill(customThemeInput.trim());
                  }
                }
              }}
              disabled={isLoading}
              placeholder="Or type a custom theme..."
              aria-label="Custom theme"
              aria-autocomplete="list"
              aria-expanded={autocompleteSuggestions.length > 0}
              aria-invalid={!!customThemeError}
              aria-describedby={customThemeError ? 'custom-theme-error' : undefined}
              className="flex-1 min-w-[80px] py-0.5 bg-transparent text-foreground placeholder:text-[var(--text-hint)] focus:outline-none disabled:cursor-not-allowed"
            />
          )}
        </div>
        {autocompleteSuggestions.length > 0 && (
          <ul
            role="listbox"
            aria-label="Theme suggestions"
            className="absolute z-10 left-0 right-0 top-full mt-1 bg-[var(--surface-card)] border border-[var(--border-card)] rounded-xl shadow-lg overflow-hidden"
          >
            {autocompleteSuggestions.map((entry) => (
              <li key={entry.value} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    onAddPill(entry.value);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-[var(--surface-chip-active)] transition-colors duration-150"
                >
                  {entry.value}
                </button>
              </li>
            ))}
          </ul>
        )}
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
        {themePills.length === 0 && !customThemeInput && (
          <p className="text-xs text-secondary italic mt-1">Type and press comma or Enter to add</p>
        )}
      </div>
    </fieldset>
  );
});

export default ThemePicker;
