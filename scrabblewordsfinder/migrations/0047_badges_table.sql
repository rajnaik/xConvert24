-- Badges table — tiered rewards for diamond collection
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  diamonds_required INTEGER NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the 7 badge tiers
INSERT INTO badges (name, diamonds_required, image) VALUES ('Wordmaker', 25, '/badges/wordmaker.svg');
INSERT INTO badges (name, diamonds_required, image) VALUES ('Wordsmith', 100, '/badges/wordsmith.svg');
INSERT INTO badges (name, diamonds_required, image) VALUES ('Wordmaster', 250, '/badges/wordmaster.svg');
INSERT INTO badges (name, diamonds_required, image) VALUES ('Word Wizard', 500, '/badges/word-wizard.svg');
INSERT INTO badges (name, diamonds_required, image) VALUES ('Grand Lexicon', 1000, '/badges/grand-lexicon.svg');
INSERT INTO badges (name, diamonds_required, image) VALUES ('Scrabble Sage', 2500, '/badges/scrabble-sage.svg');
INSERT INTO badges (name, diamonds_required, image) VALUES ('Lex Legend', 5000, '/badges/lex-legend.svg');
