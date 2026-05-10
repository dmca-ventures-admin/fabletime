import { createClient } from "@supabase/supabase-js";

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
