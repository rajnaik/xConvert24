CREATE TABLE IF NOT EXISTS fav_blogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  blog TEXT NOT NULL,
  datetime_created TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fav_blogs_user_blog ON fav_blogs(user_id, blog);
