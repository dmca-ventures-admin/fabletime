'use client';

import { useActionState } from 'react';
import { loginAction } from '../actions';

interface LoginFormProps {
  next: string;
}

export default function LoginForm({ next }: LoginFormProps) {
  // useActionState gives us pending state + the action's return value (error).
  // On success the action redirects, so the success branch is never rendered.
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <div>
        <label
          htmlFor="username"
          className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoFocus
          disabled={pending}
          className="w-full rounded-2xl border-4 border-[var(--border-card)] focus:border-primary focus:ring-primary/20 bg-[var(--surface-input)] px-4 py-3 text-foreground placeholder:text-secondary/50 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
          className="w-full rounded-2xl border-4 border-[var(--border-card)] focus:border-primary focus:ring-primary/20 bg-[var(--surface-input)] px-4 py-3 text-foreground placeholder:text-secondary/50 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-60"
        />
      </div>

      {state?.error && (
        <div
          className="p-3 bg-[var(--surface-error-bg)] border-4 border-[var(--border-error)] rounded-xl text-[var(--text-error)] text-sm font-medium"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl border-4 border-secondary bg-primary hover:bg-primary-hover disabled:opacity-60 shadow-[var(--clay-btn-primary)] hover:shadow-[var(--clay-btn-primary-hover)] hover:translate-y-0.5 text-white font-bold py-3 px-6 transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {pending ? (
          <>
            <span
              className="inline-block w-4 h-4 border-[3px] border-white border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}
