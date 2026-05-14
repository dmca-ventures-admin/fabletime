'use client';

import React, { memo, useRef, useEffect } from 'react';
import {
  CHARACTER_FALLBACK_POOL,
  DEFAULT_CHARACTER_EMOJI,
  getCharacterEmoji,
} from '@/lib/constants';

interface SuggestionEntry {
  value: string;
  emoji?: string;
}

interface CharacterPickerProps {
  /** Full suggestions list for autocomplete */
  suggestions: SuggestionEntry[];
  /** Randomly sampled display list (9 characters) */
  displayedCharacters: SuggestionEntry[];
  /** Loading state for suggestions */
  suggestionsLoading: boolean;
  /** Error state for suggestions */
  suggestionsError: boolean;
  /** Currently selected characters from grid */
  selectedCharacters: Set<string>;
  /** Custom character pills */
  characterPills: string[];
  /** Current input value */
  customCharacterInput: string;
  /** Error message for input */
  customCharacterError: string;
  /** Validation warning from AI */
  charValidationWarning: string;
  /** Whether form is submitting */
  isLoading: boolean;
  /** Whether validation is in progress */
  isValidating?: boolean;
  /** Max characters allowed */
  maxCharacters: number;
  /** Toggle a character selection */
  onToggleCharacter: (value: string) => void;
  /** Add a character pill */
  onAddPill: (value: string, trusted?: boolean) => void;
  /** Remove a character pill */
  onRemovePill: (value: string) => void;
  /** Handle input change */
  onInputChange: (value: string) => void;
}

const CharacterPicker = memo(function CharacterPicker({
  suggestions,
  displayedCharacters,
  suggestionsLoading,
  suggestionsError,
  selectedCharacters,
  characterPills,
  customCharacterInput,
  customCharacterError,
  charValidationWarning,
  isLoading,
  isValidating = false,
  maxCharacters,
  onToggleCharacter,
  onAddPill,
  onRemovePill,
  onInputChange,
}: CharacterPickerProps) {
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

  const totalCharacters = selectedCharacters.size + characterPills.length;
  const maxReached = totalCharacters >= maxCharacters;

  // Autocomplete suggestions
  const autocompleteSuggestions = showDropdown && customCharacterInput.trim()
    ? suggestions
        .filter(
          (c) =>
            c.value.toLowerCase().includes(customCharacterInput.toLowerCase()) &&
            !selectedCharacters.has(c.value) &&
            !characterPills.includes(c.value)
        )
        .slice(0, 5)
    : [];

  return (
    <fieldset>
      <legend className="block text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
        Choose Your Heroes
      </legend>
      <p className="text-xs text-secondary mb-3">
        Pick up to {maxCharacters} characters
        {maxReached && (
          <span className="text-amber-600 font-semibold ml-1">(max {maxCharacters} reached)</span>
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
      ) : suggestionsError || suggestions.length === 0 ? (
        <p className="text-xs text-secondary mb-3 italic">
          {suggestionsError
            ? 'Could not load suggestions — type your own characters below'
            : 'No popular characters yet — type your own below'}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {(() => {
            const usedEmojis = new Set<string>();
            let poolIdx = 0;
            return displayedCharacters.map((entry) => {
              const isSelected = selectedCharacters.has(entry.value);
              const isDisabled = isLoading || (!isSelected && maxReached);
              const emoji = entry.emoji || getCharacterEmoji(entry.value);
              let displayEmoji = emoji;
              if (usedEmojis.has(displayEmoji)) {
                while (poolIdx < CHARACTER_FALLBACK_POOL.length) {
                  const candidate = CHARACTER_FALLBACK_POOL[poolIdx++];
                  if (!usedEmojis.has(candidate)) {
                    displayEmoji = candidate;
                    break;
                  }
                }
                if (usedEmojis.has(displayEmoji)) displayEmoji = DEFAULT_CHARACTER_EMOJI;
              }
              usedEmojis.add(displayEmoji);

              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => onToggleCharacter(entry.value)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-[var(--border-card)] bg-[var(--surface-chip-inactive)] hover:border-primary hover:bg-[var(--surface-chip-active)]'
                  }`}
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {displayEmoji}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {entry.value}
                  </span>
                </button>
              );
            });
          })()}
        </div>
      )}

      {/* Custom character input with pills and autocomplete */}
      <div ref={inputWrapperRef} className="relative">
        <div
          className={`flex flex-wrap items-center gap-1.5 w-full px-3 py-2 rounded-xl border text-sm bg-[var(--surface-input)] transition-colors duration-200 ${
            customCharacterError
              ? 'border-red-400'
              : 'border-[var(--border-subtle)] focus-within:ring-2 focus-within:ring-secondary/60 focus-within:border-secondary'
          } ${isLoading || isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            const input = inputWrapperRef.current?.querySelector('input');
            input?.focus();
          }}
        >
          {/* Character pills */}
          {characterPills.map((pill) => (
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
          {/* Text input */}
          <input
            type="text"
            value={customCharacterInput}
            onChange={(e) => {
              onInputChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              // Backspace on empty input removes last pill
              if (e.key === 'Backspace' && !customCharacterInput && characterPills.length > 0) {
                onRemovePill(characterPills[characterPills.length - 1]);
              }
              // Enter commits current input as pill
              if (e.key === 'Enter') {
                e.preventDefault();
                if (customCharacterInput.trim()) {
                  onAddPill(customCharacterInput.trim());
                }
              }
              // Comma commits current input as pill
              if (e.key === ',' || e.key === 'Comma') {
                e.preventDefault();
                if (customCharacterInput.trim()) {
                  onAddPill(customCharacterInput.trim());
                }
              }
              // Tab commits current input as pill (only if non-empty)
              if (e.key === 'Tab' && customCharacterInput.trim()) {
                e.preventDefault();
                onAddPill(customCharacterInput.trim());
              }
            }}
            disabled={isLoading || maxReached || isValidating}
            maxLength={30}
            placeholder={characterPills.length === 0 ? 'Type custom characters...' : maxReached ? '' : 'Add more...'}
            aria-label="Custom characters"
            aria-autocomplete="list"
            aria-expanded={autocompleteSuggestions.length > 0}
            aria-invalid={!!customCharacterError}
            aria-describedby={customCharacterError ? 'custom-character-error' : undefined}
            className="flex-1 min-w-[80px] py-0.5 bg-transparent text-foreground placeholder:text-[var(--text-hint)] focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
        {autocompleteSuggestions.length > 0 && (
          <ul
            role="listbox"
            aria-label="Character suggestions"
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
                    onAddPill(entry.value, true);
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
        {customCharacterError && (
          <p id="custom-character-error" className="text-xs text-red-500 mt-1" role="alert">
            {customCharacterError}
          </p>
        )}
        {charValidationWarning && !customCharacterError && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <span aria-hidden="true">💡</span>
            {charValidationWarning}
          </p>
        )}
        {characterPills.length === 0 && (
          <p className="text-xs text-secondary italic mt-1">Type and press comma, tab or Enter to add</p>
        )}
      </div>
    </fieldset>
  );
});

export default CharacterPicker;
