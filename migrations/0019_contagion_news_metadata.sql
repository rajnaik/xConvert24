-- Migration: Add metadata columns to ContagionNews table
ALTER TABLE ContagionNews ADD COLUMN Snippet TEXT DEFAULT '';
ALTER TABLE ContagionNews ADD COLUMN Source TEXT DEFAULT '';
ALTER TABLE ContagionNews ADD COLUMN PublishedDate TEXT DEFAULT '';
