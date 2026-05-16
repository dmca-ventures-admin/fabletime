'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_S,
  createSessionToken,
  verifyCredentials,
} from '@/lib/admin-auth';

/** Login server action. Bounces back to ?next=… on success, or returns an error string. */
export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get('username') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');

  // Whitelist the redirect target — only same-origin /admin paths are allowed.
  // Anything else (off-site, scheme-relative, etc.) collapses to /admin.
  const safeNext =
    next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';

  if (!verifyCredentials(username, password)) {
    return { error: 'Invalid username or password' };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  });

  redirect(safeNext);
}

/** Logout — clear the cookie and bounce to login. */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  redirect('/admin/login');
}
