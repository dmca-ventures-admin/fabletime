'use client';

import { forwardRef } from 'react';

interface GenerateButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'button';
  className?: string;
}

const SparkleIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const GenerateButton = forwardRef<HTMLButtonElement, GenerateButtonProps>(
  function GenerateButton(
    { isLoading, disabled, onClick, type = 'submit', className = '' },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled ?? isLoading}
        onClick={onClick}
        className={`py-4 px-6 rounded-xl bg-cta hover:bg-cta-hover text-white font-heading font-semibold text-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer flex items-center justify-center gap-3 ${className}`}
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
            <SparkleIcon />
            Generate Story
          </>
        )}
      </button>
    );
  }
);

export default GenerateButton;
