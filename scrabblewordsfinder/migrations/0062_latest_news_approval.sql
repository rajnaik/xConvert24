-- Migration 0062: Add approval workflow to latest_news
-- New items from cron start as approved=0 (pending), only approved=1 shows publicly
ALTER TABLE latest_news ADD COLUMN approved INTEGER NOT NULL DEFAULT 0;
-- Approve all existing items
UPDATE latest_news SET approved = 1;
