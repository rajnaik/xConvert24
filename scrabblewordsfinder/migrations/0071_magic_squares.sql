-- Migration 0071: Magic Squares game tables
-- Date: July 15, 2026
-- Separate tables for each grid size. Both variants (classic word square + cross grid) stored in same table.

-- 4x4 Magic Squares
CREATE TABLE IF NOT EXISTS magic_squares_4x4 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant TEXT NOT NULL DEFAULT 'cross' CHECK(variant IN ('classic', 'cross')),
  row1 TEXT NOT NULL,
  row2 TEXT NOT NULL,
  row3 TEXT NOT NULL,
  row4 TEXT NOT NULL,
  col1 TEXT NOT NULL,
  col2 TEXT NOT NULL,
  col3 TEXT NOT NULL,
  col4 TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard', 'expert')),
  theme TEXT DEFAULT '',
  used_date TEXT DEFAULT NULL,
  times_played INTEGER NOT NULL DEFAULT 0,
  avg_solve_seconds INTEGER DEFAULT 0,
  avg_hints_used REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ms4_variant ON magic_squares_4x4(variant, difficulty);
CREATE INDEX IF NOT EXISTS idx_ms4_date ON magic_squares_4x4(used_date);
CREATE INDEX IF NOT EXISTS idx_ms4_unused ON magic_squares_4x4(used_date, variant, difficulty) WHERE used_date IS NULL;

-- 5x5 Magic Squares
CREATE TABLE IF NOT EXISTS magic_squares_5x5 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant TEXT NOT NULL DEFAULT 'cross' CHECK(variant IN ('classic', 'cross')),
  row1 TEXT NOT NULL,
  row2 TEXT NOT NULL,
  row3 TEXT NOT NULL,
  row4 TEXT NOT NULL,
  row5 TEXT NOT NULL,
  col1 TEXT NOT NULL,
  col2 TEXT NOT NULL,
  col3 TEXT NOT NULL,
  col4 TEXT NOT NULL,
  col5 TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'hard' CHECK(difficulty IN ('easy', 'medium', 'hard', 'expert')),
  theme TEXT DEFAULT '',
  used_date TEXT DEFAULT NULL,
  times_played INTEGER NOT NULL DEFAULT 0,
  avg_solve_seconds INTEGER DEFAULT 0,
  avg_hints_used REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ms5_variant ON magic_squares_5x5(variant, difficulty);
CREATE INDEX IF NOT EXISTS idx_ms5_date ON magic_squares_5x5(used_date);
CREATE INDEX IF NOT EXISTS idx_ms5_unused ON magic_squares_5x5(used_date, variant, difficulty) WHERE used_date IS NULL;

-- 6x6 Magic Squares
CREATE TABLE IF NOT EXISTS magic_squares_6x6 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant TEXT NOT NULL DEFAULT 'cross' CHECK(variant IN ('classic', 'cross')),
  row1 TEXT NOT NULL,
  row2 TEXT NOT NULL,
  row3 TEXT NOT NULL,
  row4 TEXT NOT NULL,
  row5 TEXT NOT NULL,
  row6 TEXT NOT NULL,
  col1 TEXT NOT NULL,
  col2 TEXT NOT NULL,
  col3 TEXT NOT NULL,
  col4 TEXT NOT NULL,
  col5 TEXT NOT NULL,
  col6 TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'expert' CHECK(difficulty IN ('easy', 'medium', 'hard', 'expert')),
  theme TEXT DEFAULT '',
  used_date TEXT DEFAULT NULL,
  times_played INTEGER NOT NULL DEFAULT 0,
  avg_solve_seconds INTEGER DEFAULT 0,
  avg_hints_used REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ms6_variant ON magic_squares_6x6(variant, difficulty);
CREATE INDEX IF NOT EXISTS idx_ms6_date ON magic_squares_6x6(used_date);
CREATE INDEX IF NOT EXISTS idx_ms6_unused ON magic_squares_6x6(used_date, variant, difficulty) WHERE used_date IS NULL;

-- Game results tracking (all sizes in one table)
CREATE TABLE IF NOT EXISTS magic_squares_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  puzzle_id INTEGER NOT NULL,
  grid_size INTEGER NOT NULL CHECK(grid_size IN (4, 5, 6)),
  variant TEXT NOT NULL DEFAULT 'cross',
  solved INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  solve_seconds INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  is_daily INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_msr_user ON magic_squares_results(user_id, grid_size);
CREATE INDEX IF NOT EXISTS idx_msr_daily ON magic_squares_results(is_daily, created_at);

-- Add times_solved column
ALTER TABLE magic_squares_4x4 ADD COLUMN times_solved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE magic_squares_5x5 ADD COLUMN times_solved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE magic_squares_6x6 ADD COLUMN times_solved INTEGER NOT NULL DEFAULT 0;

-- Add difficulty_score column for numeric grid difficulty rating
ALTER TABLE magic_squares_4x4 ADD COLUMN difficulty_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE magic_squares_5x5 ADD COLUMN difficulty_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE magic_squares_6x6 ADD COLUMN difficulty_score INTEGER NOT NULL DEFAULT 0;

-- Unique indexes to prevent duplicate grids (enables INSERT OR IGNORE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ms4_unique_grid ON magic_squares_4x4(row1, row2, row3, row4);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ms5_unique_grid ON magic_squares_5x5(row1, row2, row3, row4, row5);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ms6_unique_grid ON magic_squares_6x6(row1, row2, row3, row4, row5, row6);
