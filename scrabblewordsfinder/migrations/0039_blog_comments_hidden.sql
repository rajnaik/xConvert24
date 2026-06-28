-- Add 'hidden' column to Blog_Comments table
-- hidden = 0 (visible, default), hidden = 1 (hidden from public view)
ALTER TABLE Blog_Comments ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;
