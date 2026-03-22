-- Fabletime database schema
-- Run against your Supabase project via the SQL Editor or psql.

-- Stories table: persists every generated story with metadata
CREATE TABLE IF NOT EXISTS stories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  characters TEXT[]      NOT NULL,
  theme      TEXT        NOT NULL,
  length     TEXT        NOT NULL,
  prompt     TEXT        NOT NULL,
  response   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ratings table: user feedback on stories (1-5 stars + optional text)
CREATE TABLE IF NOT EXISTS ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID        NOT NULL REFERENCES stories(id),
  stars      INTEGER     NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom entries table: user-submitted characters, themes, etc.
CREATE TABLE IF NOT EXISTS custom_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  usage_count INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, value)
);

-- D003: Anonymous model — no auth, RLS disabled on all tables
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_entries DISABLE ROW LEVEL SECURITY;
