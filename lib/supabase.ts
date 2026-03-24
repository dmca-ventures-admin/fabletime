import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL – add it to .env.local (see .env.local.example)"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing SUPABASE_ANON_KEY – add it to .env.local (see .env.local.example)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
