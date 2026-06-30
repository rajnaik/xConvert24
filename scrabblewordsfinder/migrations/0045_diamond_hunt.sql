-- Diamond Hunt: hidden collectible diamonds placed on pages
-- Users discover and claim them for diamond rewards

CREATE TABLE IF NOT EXISTS diamond_hunt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dom_loc TEXT NOT NULL DEFAULT '',
  diamonds_remaining INTEGER NOT NULL DEFAULT 10,
  diamonds_per_claim INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  end_date TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diamond_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diamond_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  diamonds_earned INTEGER NOT NULL DEFAULT 1,
  claimed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(diamond_id, user_id)
);
