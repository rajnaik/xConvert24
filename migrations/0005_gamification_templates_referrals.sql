-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0005: Gamification overhaul + Templates + Referrals + Badges
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Templates ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  version INTEGER DEFAULT 1,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  modified_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE INDEX IF NOT EXISTS idx_templates_modified ON templates(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_versions_tid ON template_versions(template_id, version DESC);

-- ─── Activities ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  reward INTEGER NOT NULL DEFAULT 0,
  badge_id INTEGER DEFAULT NULL,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  modified_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- ─── Badges ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  modified_at TEXT DEFAULT (datetime('now')),
  status INTEGER DEFAULT 1
);

-- ─── Rewards Granted ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards_granted (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity_id INTEGER NOT NULL,
  coins_granted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE INDEX IF NOT EXISTS idx_rewards_granted_user ON rewards_granted(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_granted_activity ON rewards_granted(activity_id);

-- ─── Referrals ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  referee_name TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  message TEXT DEFAULT '',
  status INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  referee_id TEXT NOT NULL,
  registered_at TEXT DEFAULT (datetime('now')),
  rewards_granted INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_completions_user ON referral_completions(user_id);

-- ─── User Profiles (for leaderboard) ────────────────────────────────
-- Extends user_coins with nickname and location
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT 'Anonymous',
  location TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Seed Badges (16 types) ─────────────────────────────────────────
INSERT OR IGNORE INTO badges (id, name, description) VALUES
  (1, 'Converter', 'Use converters (5/10/25/50/100 conversions)'),
  (2, 'Favouriter', 'Add favourites (5/10/25/50/100 favourites)'),
  (3, 'Referrer', 'Refer friends (1/10/25/50/100 referrals)'),
  (4, 'Bug Reporter', 'Report bugs (1/10/25/50/100 bugs)'),
  (5, 'Bug Voter', 'Vote on bugs (5/10/25/50/100 votes)'),
  (6, 'Suggester', 'Submit suggestions (1/10/25/50/100 suggestions)'),
  (7, 'Suggestion Voter', 'Vote on suggestions (5/10/25/50/100 votes)'),
  (8, 'Chatter', 'Use the chat assistant (5/10/25/50/100 messages)'),
  (9, 'Crypto Enthusiast', 'Use crypto tools (5/10/25/50/100 uses)'),
  (10, 'Scrabbler', 'Play Scrabble Solver (5/10/25/50/100 games)'),
  (11, 'Map Hacker', 'Use Map Tools (5/10/25/50/100 lookups)'),
  (12, 'Foodie', 'Use cooking converters (5/10/25/50/100 conversions)'),
  (13, 'Fashionista', 'Use fashion converters (5/10/25/50/100 conversions)'),
  (14, 'Money Minder', 'Use finance tools (5/10/25/50/100 uses)'),
  (15, 'Tinkerer', 'Use measurement converters (5/10/25/50/100 conversions)'),
  (16, 'Reader', 'Read blog posts (5/10/25/50/100 reads)');

-- ─── Seed Activities ─────────────────────────────────────────────────
INSERT OR IGNORE INTO activities (id, name, display_name, reward, badge_id) VALUES
  (1, 'first_conversion', 'First Conversion of the Day', 5, 1),
  (2, 'daily_visit', 'Daily Visit', 5, NULL),
  (3, 'multi_converter', 'Multi-Converter (3+ in session)', 10, 1),
  (4, 'streak_7', '7-Day Streak', 50, NULL),
  (5, 'streak_30', '30-Day Streak', 200, NULL),
  (6, 'share', 'Share a Tool', 5, NULL),
  (7, 'bug_report', 'Bug Report (validated)', 25, 4),
  (8, 'suggestion', 'Feature Suggestion (4+ stars)', 30, 6),
  (9, 'quiz_correct', 'Quiz Correct Answer', 10, NULL),
  (10, 'favourite_5', 'Favourite 5 Tools', 15, 2),
  (11, 'home_screen', 'Add to Home Screen', 100, NULL),
  (12, 'blog_read', 'Read a Blog Post', 5, 16),
  (13, 'refer', 'Refer a Friend (completed)', 500, 3),
  (14, 'bug_vote', 'Vote on a Bug', 2, 5),
  (15, 'suggestion_vote', 'Vote on a Suggestion', 2, 7),
  (16, 'chat_message', 'Chat Assistant Message', 2, 8),
  (17, 'crypto_use', 'Use Crypto Tools', 3, 9),
  (18, 'scrabble_play', 'Play Scrabble Solver', 3, 10),
  (19, 'map_use', 'Use Map Tools', 3, 11),
  (20, 'cooking_convert', 'Cooking Conversion', 3, 12),
  (21, 'fashion_convert', 'Fashion Conversion', 3, 13),
  (22, 'finance_use', 'Use Finance Tools', 3, 14),
  (23, 'measurement_convert', 'Measurement Conversion', 3, 15),
  (24, 'runner_streak', 'Maintain Streak', 5, NULL);
