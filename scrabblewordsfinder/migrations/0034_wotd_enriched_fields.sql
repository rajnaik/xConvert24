-- Add enriched content fields to word_of_the_day for richer WOTD panel display
ALTER TABLE word_of_the_day ADD COLUMN origin TEXT DEFAULT '';
ALTER TABLE word_of_the_day ADD COLUMN usage_example TEXT DEFAULT '';
ALTER TABLE word_of_the_day ADD COLUMN spelling_tip TEXT DEFAULT '';
ALTER TABLE word_of_the_day ADD COLUMN cultural_note TEXT DEFAULT '';
