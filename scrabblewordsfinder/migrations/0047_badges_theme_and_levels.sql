-- Add theme column to badges table
ALTER TABLE badges ADD COLUMN theme TEXT NOT NULL DEFAULT '';

-- Update existing 7 badges with themes
UPDATE badges SET theme = 'Beginner' WHERE id = 1;
UPDATE badges SET theme = 'Crafter' WHERE id = 2;
UPDATE badges SET theme = 'Skilled' WHERE id = 3;
UPDATE badges SET theme = 'Magical' WHERE id = 4;
UPDATE badges SET theme = 'Vocabulary' WHERE id = 5;
UPDATE badges SET theme = 'Wise' WHERE id = 6;
UPDATE badges SET theme = 'Legendary' WHERE id = 7;

-- Insert new badge levels 8-15
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Vocabulary Virtuoso', 10000, '/badges/vocabulary-virtuoso.svg', 'active', 'Elite');
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Dictionary Guardian', 20000, '/badges/dictionary-guardian.svg', 'active', 'Protector of words');
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Letter Lord', 40000, '/badges/letter-lord.svg', 'active', 'Commander');
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Tile Titan', 75000, '/badges/tile-titan.svg', 'active', 'Giant');
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Word Emperor', 125000, '/badges/word-emperor.svg', 'active', 'Royal');
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Lexicon Immortal', 250000, '/badges/lexicon-immortal.svg', 'active', 'Eternal');
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Alphabet Ascendant', 500000, '/badges/alphabet-ascendant.svg', 'active', 'Mythical');
INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES ('Grand Word Deity', 1000000, '/badges/grand-word-deity.svg', 'active', 'Ultimate');
