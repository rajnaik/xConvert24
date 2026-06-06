-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0013: Feature Flags
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Feature Flags ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled_dev INTEGER DEFAULT 1,
  enabled_staging INTEGER DEFAULT 1,
  enabled_live INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_live ON feature_flags(enabled_live);

-- Seed initial feature flags
INSERT OR IGNORE INTO feature_flags (id, name, description, enabled_dev, enabled_staging, enabled_live) VALUES
  ('email_signin', 'Email Sign-On', 'Allow users to create accounts with email', 1, 1, 0),
  ('publish_favourites', 'Publish Favourites', 'Users can publish and share their favourite lists', 1, 1, 1),
  ('crypto_watchlist', 'Crypto Watchlist', 'Create and manage crypto coin watchlists', 1, 1, 1),
  ('opinion_polls', 'Opinion Polls', 'User opinion surveys on upcoming features', 1, 1, 1),
  ('leaderboard', 'Leaderboard', 'Public leaderboard showing top coin earners', 1, 1, 0),
  ('shareable_profiles', 'Shareable Profiles', 'Public profile pages with badges and stats', 1, 1, 0),
  ('coin_redemption', 'Coin Redemption', 'Redeem ConvertCoins for rewards', 1, 0, 0),
  ('ai_chat', 'AI Chat Assistant', 'In-app AI chat for conversion help', 1, 0, 0);
