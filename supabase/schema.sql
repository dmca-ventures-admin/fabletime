-- Fabletime database schema
-- Run against your Supabase project via the SQL Editor or psql.

-- Stories table: persists every generated story with metadata
CREATE TABLE IF NOT EXISTS stories (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  characters      TEXT[]      NOT NULL,
  theme           TEXT        NOT NULL,
  length          TEXT        NOT NULL,
  prompt          TEXT        NOT NULL,
  response        TEXT        NOT NULL,
  funniness_level INTEGER     NOT NULL DEFAULT 2,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ratings table: user feedback on stories (1-5 stars + optional text)
CREATE TABLE IF NOT EXISTS ratings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id             UUID        NOT NULL REFERENCES stories(id),
  stars                INTEGER     NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback             TEXT,
  suspicious_feedback  BOOLEAN     NOT NULL DEFAULT false,
  read                 BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Add suspicious_feedback to existing deployments (issue #135 — flags rows whose
-- feedback text matches known prompt-injection patterns; see lib/sanitize.ts).
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS suspicious_feedback BOOLEAN NOT NULL DEFAULT false;

-- Custom entries table: user-submitted characters, themes, etc.
CREATE TABLE IF NOT EXISTS custom_entries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type           TEXT        NOT NULL,
  value          TEXT        NOT NULL,
  usage_count    INTEGER     NOT NULL DEFAULT 1,
  child_friendly BOOLEAN     DEFAULT NULL,
  emoji          TEXT        DEFAULT NULL,
  excluded       BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, value)
);

-- Atomic upsert function: inserts a new entry with usage_count=1, or increments
-- the existing row's usage_count. Avoids read-then-write race conditions.
CREATE OR REPLACE FUNCTION upsert_entry(p_type TEXT, p_value TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO custom_entries (type, value, usage_count)
  VALUES (p_type, p_value, 1)
  ON CONFLICT (type, value)
  DO UPDATE SET usage_count = custom_entries.usage_count + 1;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
-- Server-side API routes use the service role key, which bypasses RLS.
-- The anon key (used by client-side requests) is restricted by RLS policies.
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_entries ENABLE ROW LEVEL SECURITY;

-- custom_entries: allow public read access for suggestions endpoint
CREATE POLICY "public_read" ON custom_entries FOR SELECT USING (true);

-- #92: Cache style selection and DALL-E image URL per story
-- Run these manually against both preview and production Supabase projects:
--   ALTER TABLE stories ADD COLUMN IF NOT EXISTS style INTEGER;
--   ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS style INTEGER;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT;
-- Per-browser anonymous session id used to count unique users on the admin
-- dashboard (issue #140). Nullable — old rows and any client that fails to
-- persist localStorage simply don't contribute to the unique-user count.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS session_id TEXT;
