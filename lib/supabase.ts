import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL – DB operations will fail"
  );
}

if (!supabaseAnonKey) {
  console.error(
    "[supabase] Missing SUPABASE_ANON_KEY – DB operations will fail"
  );
}

// Fall back to placeholder values so the module loads even if env vars are missing.
// Routes that use supabase will see DB errors, but the app won't crash at module init.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

/**
 * Service-role Supabase client. Bypasses RLS — never expose to client code or
 * to the response body of a public-facing route. Use only inside server-only
 * modules behind an authentication check (e.g. the admin dashboard).
 *
 * Lazily constructed so the module still imports when the key is absent in
 * non-admin environments.
 */
let _serviceClient: SupabaseClient | null = null;
export function getServiceSupabase(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY is not configured — admin reads will fail"
    );
  }
  _serviceClient = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return _serviceClient;
}
