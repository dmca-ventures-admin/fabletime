-- Fabletime seed data: default characters and themes
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

-- Characters (6)
INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('character', 'Fox', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('character', 'Bear', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('character', 'Little Wizard', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('character', 'Brave Knight', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('character', 'Young Scientist', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('character', 'Mermaid', 1, true)
ON CONFLICT (type, value) DO NOTHING;

-- Themes (4)
INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('theme', 'Kindness', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('theme', 'Courage', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('theme', 'Empathy', 1, true)
ON CONFLICT (type, value) DO NOTHING;

INSERT INTO custom_entries (type, value, usage_count, child_friendly)
VALUES ('theme', 'Vocabulary', 1, true)
ON CONFLICT (type, value) DO NOTHING;
