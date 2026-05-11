'use client';

import React, { memo } from 'react';

interface FunninessSliderProps {
  /** Current funniness level (1-5) */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Whether the slider is disabled */
  disabled: boolean;
}

const FUNNINESS_LABELS = [
  'Not funny at all',
  'A little funny',
  'Pretty amusing',
  'Hilarious',
  'Too funny for words',
];

const FUNNINESS_EMOJIS = ['😐', '🙂', '😄', '😂', '🤣'];

const FunninessSlider = memo(function FunninessSlider({
  value,
  onChange,
  disabled,
}: FunninessSliderProps) {
  return (
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
            style={{
              left: '16px',
              right: '16px',
              top: '50%',
              marginTop: '-3px',
              height: '6px',
              borderRadius: '9999px',
              background: `linear-gradient(to right, var(--color-primary) ${(value - 1) * 25}%, var(--border-subtle) ${(value - 1) * 25}%)`,
            }}
          />
          {/* Range input spans full width for interaction */}
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            aria-label="Funniness level"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={value}
            aria-valuetext={FUNNINESS_LABELS[value - 1]}
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
              left: `calc(16px + ${(value - 1) / 4} * (100% - 32px))`,
              transform: 'translateX(-50%)',
              width: '32px',
              textAlign: 'center',
              zIndex: 3,
            }}
            aria-hidden="true"
          >
            {FUNNINESS_EMOJIS[value - 1]}
          </span>
        </div>
      </div>
    </fieldset>
  );
});

export default FunninessSlider;
