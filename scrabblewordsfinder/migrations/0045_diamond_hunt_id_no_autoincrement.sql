-- Remove AUTOINCREMENT from diamond_hunt.id so IDs can be set manually
-- SQLite doesn't support ALTER TABLE to change column constraints, so we recreate

CREATE TABLE IF NOT EXISTS diamond_hunt_new (
  id INTEGER PRIMARY KEY,
  diamonds_remaining INTEGER NOT NULL DEFAULT 10,
  diamonds_per_claim INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  end_date TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO diamond_hunt_new (id, diamonds_remaining, diamonds_per_claim, status, end_date, created_at)
  SELECT id, diamonds_remaining, diamonds_per_claim, status, end_date, created_at FROM diamond_hunt;

DROP TABLE diamond_hunt;

ALTER TABLE diamond_hunt_new RENAME TO diamond_hunt;
