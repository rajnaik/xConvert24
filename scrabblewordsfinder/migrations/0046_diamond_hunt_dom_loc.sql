-- Add dom_loc column to diamond_hunt table
-- Stores the DOM selector/location where this diamond mine is embedded on a page
ALTER TABLE diamond_hunt ADD COLUMN dom_loc TEXT DEFAULT '';
