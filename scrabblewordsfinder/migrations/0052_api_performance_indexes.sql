-- Performance indexes for frequently-queried API endpoints
-- Addresses slow telemetry times: Emails (3701ms), Site Status (522ms), Banners (910ms)

-- emails: speeds up ORDER BY created_at DESC and filters on category/read
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_category_read ON emails(category, read);

-- telemetry: speeds up ORDER BY checked_at DESC on history queries
CREATE INDEX IF NOT EXISTS idx_telemetry_checked_at ON telemetry(checked_at DESC);

-- clicks: speeds up ORDER BY created_at DESC and count queries
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at DESC);

-- banners: speeds up WHERE status = 'active' filter
CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status);
