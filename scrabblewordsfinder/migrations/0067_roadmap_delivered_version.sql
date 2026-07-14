-- Migration 0067: Add delivered_version and feature_url columns to roadmap_features
ALTER TABLE roadmap_features ADD COLUMN delivered_version TEXT DEFAULT '';
ALTER TABLE roadmap_features ADD COLUMN feature_url TEXT DEFAULT '';
