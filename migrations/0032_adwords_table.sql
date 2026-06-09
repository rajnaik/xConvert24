-- AdWords table: stores keyword campaigns for SEO enhancements
CREATE TABLE IF NOT EXISTS AdWords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value TEXT NOT NULL,
  categoryid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed: Scrabble Word Solver keywords
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble tiles', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble Word Finder', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble Cheat', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble Find', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble Word Solver', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Word Finder', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble Word', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble dictionary', 'scrabble-word-solver');
INSERT INTO AdWords (value, categoryid) VALUES ('Scrabble helper', 'scrabble-word-solver');
