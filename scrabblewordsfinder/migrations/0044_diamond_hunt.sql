-- Diamond Hunt: first-come-first-served diamond mining across 50+ page locations
-- Each row is a "mine" with a finite diamond pool that depletes as users claim

CREATE TABLE IF NOT EXISTS diamond_hunt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diamonds_remaining INTEGER NOT NULL DEFAULT 10,
  diamonds_per_claim INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  end_date TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Per-user claim audit trail (prevents double-claiming same slot)
CREATE TABLE IF NOT EXISTS diamond_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diamond_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  diamonds_earned INTEGER NOT NULL DEFAULT 1,
  claimed_at TEXT DEFAULT (datetime('now')),
  UNIQUE(diamond_id, user_id)
);
