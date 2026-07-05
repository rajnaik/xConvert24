-- Add bounced column to campaign_leads table
ALTER TABLE campaign_leads ADD COLUMN bounced INTEGER NOT NULL DEFAULT 0;
