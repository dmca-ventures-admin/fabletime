'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = document.documentElement.getAttribute('data-theme');
    if (saved === 'dark') setTheme('dark');
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fabletime-theme', next);
  };

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) {
    return (
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold border-2 rounded-xl px-4 py-2 border-[var(--border-subtle)] text-secondary opacity-0"
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className="w-4 h-4" />
        Theme
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary border-2 border-[var(--border-subtle)] hover:border-[var(--border-card)] rounded-xl px-4 py-2 transition-all duration-200 hover:bg-[var(--surface-hover)] cursor-pointer"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
}
