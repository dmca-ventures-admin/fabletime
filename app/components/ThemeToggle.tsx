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

  const isDark = theme === 'dark';

  // Avoid hydration mismatch — render invisible placeholder until mounted
  if (!mounted) {
    return (
      <div
        className="inline-flex items-center gap-0 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-chip-inactive)] p-0.5 opacity-0 select-none"
        aria-hidden="true"
      >
        <span className="px-3 py-1 text-xs font-semibold rounded-full">Light</span>
        <span className="px-3 py-1 text-xs font-semibold rounded-full">Dark</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="inline-flex items-center gap-0 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-chip-inactive)] p-0.5 cursor-pointer transition-colors duration-200 hover:border-[var(--border-card)]"
    >
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          !isDark
            ? 'bg-primary text-white shadow-sm'
            : 'text-secondary'
        }`}
      >
        Light
      </span>
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          isDark
            ? 'bg-primary text-white shadow-sm'
            : 'text-secondary'
        }`}
      >
        Dark
      </span>
    </button>
  );
}
