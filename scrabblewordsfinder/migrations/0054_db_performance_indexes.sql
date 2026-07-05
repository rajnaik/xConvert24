-- Performance indexes for commonly queried columns (July 4, 2026)

-- campaign_leads: filtered by batch and sent status
CREATE INDEX IF NOT EXISTS idx_campaign_leads_batch ON campaign_leads(batch);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_sent ON campaign_leads(sent);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_batch_sent ON campaign_leads(batch, sent);

-- seo_index: filtered by updated_at for incremental sync
CREATE INDEX IF NOT EXISTS idx_seo_index_updated_at ON seo_index(updated_at DESC);

-- seo_sync_log: ordered by synced_at
CREATE INDEX IF NOT EXISTS idx_seo_sync_log_synced_at ON seo_sync_log(synced_at DESC);

-- blog_ideas: filtered by status and category
CREATE INDEX IF NOT EXISTS idx_blog_ideas_status ON blog_ideas(status);
CREATE INDEX IF NOT EXISTS idx_blog_ideas_category ON blog_ideas(category);

-- daily_anagram & daily_rack: queried by date
CREATE INDEX IF NOT EXISTS idx_daily_anagram_date ON daily_anagram(date);
CREATE INDEX IF NOT EXISTS idx_daily_rack_date ON daily_rack(date);

-- daily_progress: queried by user + date
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date DESC);

-- users: compound index for admin dashboard sorting
CREATE INDEX IF NOT EXISTS idx_users_last_seen2 ON users(last_seen DESC, visit_count DESC);

-- batch_status table for campaign batch tracking
CREATE TABLE IF NOT EXISTS batch_status (batch TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'scheduled', 'finished')), updated_at TEXT DEFAULT (datetime('now')));
