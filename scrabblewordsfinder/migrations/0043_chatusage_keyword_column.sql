-- Add keyword column to chatusage table
-- Stores the short rack letters (e.g. "AERTBLS") separately from the full user_message
-- This fixes the issue where Ask Lex messages (109+ chars) were excluded from keyword history
ALTER TABLE chatusage ADD COLUMN keyword TEXT DEFAULT '';
