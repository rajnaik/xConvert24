-- Add AdSense toggle to site_status table
-- Values: 'ON' (ads enabled) or 'OFF' (ads disabled)
ALTER TABLE site_status ADD COLUMN adsense TEXT NOT NULL DEFAULT 'ON';
