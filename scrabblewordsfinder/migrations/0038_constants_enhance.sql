-- Enhance constants table with description, category, status, updated_at, updated_by, created_at

ALTER TABLE constants ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE constants ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE constants ADD COLUMN status INTEGER NOT NULL DEFAULT 1;
ALTER TABLE constants ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
ALTER TABLE constants ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'system';
ALTER TABLE constants ADD COLUMN created_at TEXT NOT NULL DEFAULT '';

-- Backfill created_at and updated_at from datecreated for existing rows
UPDATE constants SET created_at = datecreated, updated_at = datecreated WHERE datecreated IS NOT NULL;

-- Set sensible defaults for the existing TAGLINE row
UPDATE constants SET
  description = 'Main site tagline displayed in header and about page',
  category = 'branding',
  updated_by = 'kiro'
WHERE name = 'TAGLINE';
