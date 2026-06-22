-- Cows and Bulls game scores/sessions table
CREATE TABLE IF NOT EXISTS CaB_Scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wordId INTEGER NOT NULL,
  startDatetime TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wordId) REFERENCES CaB(id)
);
