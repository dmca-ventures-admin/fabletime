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
        className="text-2xl leading-none p-1.5 rounded-full opacity-0"
        aria-hidden="true"
        tabIndex={-1}
      >
        🌙
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="text-2xl leading-none p-1.5 rounded-full hover:bg-[var(--surface-hover)] transition-colors duration-200 cursor-pointer"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '🌞'}
    </button>
  );
}
