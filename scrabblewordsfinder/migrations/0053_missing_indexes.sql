-- Missing indexes identified by database audit (July 3, 2026)
-- Covers all tables lacking indexes on commonly queried columns

-- chatusage: filter by user + order by time, and success-based aggregations
CREATE INDEX IF NOT EXISTS idx_chatusage_user ON chatusage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatusage_success ON chatusage(success, created_at DESC);

-- daily_anagram_scores: user history lookups and date-based stats
CREATE INDEX IF NOT EXISTS idx_anagram_scores_user ON daily_anagram_scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_anagram_scores_date ON daily_anagram_scores(date);

-- daily_rack_scores: per-user per-date lookups and duplicate checks
CREATE INDEX IF NOT EXISTS idx_rack_scores_date_user ON daily_rack_scores(date, user_id);

-- quiz_scores: user history ordered by recency
CREATE INDEX IF NOT EXISTS idx_quiz_scores_user ON quiz_scores(user_id, created_at DESC);

-- word_of_the_day: daily lookup by date (most frequent query)
CREATE INDEX IF NOT EXISTS idx_wotd_date ON word_of_the_day(date);

-- Blog_Comments: filter by blog post and status
CREATE INDEX IF NOT EXISTS idx_blog_comments_blogid ON Blog_Comments(blogid, status);

-- user_achievements: user history lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, created_at DESC);

-- wordbench_practice: user history lookups
CREATE INDEX IF NOT EXISTS idx_wordbench_practice_user ON wordbench_practice(user_id, created_at DESC);

-- telemetry: history filtered by endpoint name
CREATE INDEX IF NOT EXISTS idx_telemetry_endpoint ON telemetry(endpoint_name, checked_at DESC);

-- seo_index: GROUP BY status aggregation
CREATE INDEX IF NOT EXISTS idx_seo_index_status ON seo_index(status);

-- CaB_Scores: FK join lookups on wordId
CREATE INDEX IF NOT EXISTS idx_cab_scores_word ON CaB_Scores(wordId);

-- users: active user queries sorted by recency
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- Cleanup: drop duplicate index (idx_clicks_date is identical to idx_clicks_created_at)
DROP INDEX IF EXISTS idx_clicks_date;
