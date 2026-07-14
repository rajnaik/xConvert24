-- Migration 0068: Recurring maintenance tasks for data upkeep
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  category TEXT NOT NULL DEFAULT 'rankings',
  last_completed TEXT DEFAULT '',
  next_due TEXT DEFAULT '',
  status INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Seed monthly tasks
INSERT INTO maintenance_tasks (name, description, frequency, category, next_due, sort_order) VALUES
('Update WESPA ratings', 'Check wespa.org for new ratings, update player_rankings table for ranking_type=wespa', 'monthly', 'rankings', '2026-08-01', 1),
('Update YTD standings', 'Check wespa.org YTD page, update rankings where ranking_type=ytd', 'monthly', 'rankings', '2026-08-01', 2),
('Add new tournaments', 'Insert upcoming events into tournaments table from WESPA calendar', 'monthly', 'tournaments', '2026-08-01', 3),
('Mark completed tournaments', 'Set status=completed, add winner + participants for finished events', 'monthly', 'tournaments', '2026-08-01', 4),
('Add tournament results', 'Insert top-3 placements into tournament_results for completed events', 'monthly', 'tournaments', '2026-08-01', 5),
('Review news queue', 'Check /admin/latest-news/ — approve or hide auto-fetched stories', 'monthly', 'content', '2026-08-01', 6);

-- Seed quarterly tasks
INSERT INTO maintenance_tasks (name, description, frequency, category, next_due, sort_order) VALUES
('Add new players', 'If someone enters the top 50, insert into player_rankings', 'quarterly', 'rankings', '2026-10-01', 7),
('Update player career data', 'Refresh games_played, peak_rating, titles for top players', 'quarterly', 'rankings', '2026-10-01', 8),
('Update online ratings', 'Check WESPA online ratings page, refresh ranking_type=online', 'quarterly', 'rankings', '2026-10-01', 9),
('Refresh records', 'Check if any records were broken, update scrabble_records table', 'quarterly', 'records', '2026-10-01', 10),
('Update country data', 'Ensure correct country/country_code for all ranked players', 'quarterly', 'rankings', '2026-10-01', 11);

-- Seed annual tasks
INSERT INTO maintenance_tasks (name, description, frequency, category, next_due, sort_order) VALUES
('Reset YTD rankings', 'At year start, archive previous year YTD and start fresh', 'annual', 'rankings', '2027-01-01', 12),
('WESPAC year update', 'After world championship, update winner in records + tournaments', 'annual', 'tournaments', '2027-01-01', 13),
('Review roadmap', 'Archive shipped items, add new planned features to roadmap_features', 'annual', 'admin', '2027-01-01', 14);
