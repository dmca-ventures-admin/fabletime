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
-- story_id uses ON DELETE CASCADE so purging a story also removes its ratings.
CREATE TABLE IF NOT EXISTS ratings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id             UUID        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  stars                INTEGER     NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback             TEXT,
  suspicious_feedback  BOOLEAN     NOT NULL DEFAULT false,
  read                 BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Backfill CASCADE on existing deployments where the FK was created without it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.referential_constraints
    WHERE constraint_name = 'ratings_story_id_fkey'
      AND delete_rule <> 'CASCADE'
  ) THEN
    ALTER TABLE ratings DROP CONSTRAINT ratings_story_id_fkey;
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_story_id_fkey
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
  END IF;
END $$;
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

-- Row Level Security — defence-in-depth for the dual-key strategy.
--
-- Fabletime uses two Supabase keys:
--   * SERVICE ROLE key — used by every route in app/api/**. Bypasses RLS
--     entirely. This is the primary trust boundary.
--   * ANON key — used only by client-side and unauthenticated paths (e.g.
--     the public suggestions read, and any future direct-from-client
--     inserts). Restricted by the policies below.
--
-- With RLS enabled and no policies, the anon key can't do anything, which is
-- the current state. The policies below explicitly allow the minimum needed
-- for the public paths and deny everything else, so a future refactor that
-- accidentally uses the anon key where the service role was expected fails
-- closed instead of opening the table wide.
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_entries ENABLE ROW LEVEL SECURITY;

-- custom_entries: allow public read access for suggestions endpoint
DROP POLICY IF EXISTS "public_read" ON custom_entries;
CREATE POLICY "public_read" ON custom_entries FOR SELECT TO anon USING (true);

-- stories: anon can create a story and read it back by id, but cannot
-- update or delete. All writes to the response text, cached style, and
-- image_url happen via the service role key from /api/generate and /api/image.
DROP POLICY IF EXISTS "stories_anon_insert" ON stories;
CREATE POLICY "stories_anon_insert" ON stories FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "stories_anon_select" ON stories;
CREATE POLICY "stories_anon_select" ON stories FOR SELECT TO anon USING (true);

-- Explicit deny: anon must not update or delete stories. Absence of a
-- policy already denies these, but we make it obvious for reviewers.
DROP POLICY IF EXISTS "stories_anon_no_update" ON stories;
CREATE POLICY "stories_anon_no_update" ON stories FOR UPDATE TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "stories_anon_no_delete" ON stories;
CREATE POLICY "stories_anon_no_delete" ON stories FOR DELETE TO anon USING (false);

-- ratings: anon can insert a rating for any existing story, but cannot read
-- ratings back (feedback is admin-only). No update/delete for anon.
DROP POLICY IF EXISTS "ratings_anon_insert" ON ratings;
CREATE POLICY "ratings_anon_insert" ON ratings FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM stories WHERE stories.id = ratings.story_id));

DROP POLICY IF EXISTS "ratings_anon_no_select" ON ratings;
CREATE POLICY "ratings_anon_no_select" ON ratings FOR SELECT TO anon USING (false);

DROP POLICY IF EXISTS "ratings_anon_no_update" ON ratings;
CREATE POLICY "ratings_anon_no_update" ON ratings FOR UPDATE TO anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "ratings_anon_no_delete" ON ratings;
CREATE POLICY "ratings_anon_no_delete" ON ratings FOR DELETE TO anon USING (false);

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
