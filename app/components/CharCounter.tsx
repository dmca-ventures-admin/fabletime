'use client';

/**
 * Live character counter shown beneath a controlled <textarea> or <input>.
 *
 * Visual states:
 *   - Default: muted secondary text
 *   - Warning (remaining ≤ 50): red text, signals user is approaching the cap
 *
 * Accessibility:
 *   - aria-live="polite" so screen readers announce the remaining count as the
 *     user types, but without interrupting their flow.
 */
interface CharCounterProps {
  value: string;
  max: number;
  /** Optional id so callers can reference the counter via aria-describedby. */
  id?: string;
}

export default function CharCounter({ value, max, id }: CharCounterProps) {
  const length = value.length;
  const remaining = max - length;
  const isWarning = remaining <= 50;

  return (
    <p
      id={id}
      aria-live="polite"
      className={`mt-1 text-xs font-medium tabular-nums text-right ${
        isWarning ? 'text-red-500' : 'text-secondary/70'
      }`}
    >
      {length} / {max}
    </p>
  );
}
