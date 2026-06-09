-- Migration: 0031_seo_health_table
-- Creates the seo_health table for storing SEO health check reports

CREATE TABLE IF NOT EXISTS seo_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  environment TEXT NOT NULL,
  report TEXT,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
