-- Live Migration: tournament_winners table + seed data + seo_index entries
-- Run with: echo "Y" | npx wrangler d1 execute DB --remote --file=scripts/migrate-tournament-winners-live.sql
-- For staging: echo "Y" | npx wrangler d1 execute DB --remote --config wrangler.staging.jsonc --file=scripts/migrate-tournament-winners-live.sql

-- 1. Create table
CREATE TABLE IF NOT EXISTS tournament_winners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament TEXT NOT NULL,
  year INTEGER NOT NULL,
  winner_name TEXT NOT NULL,
  winner_country TEXT DEFAULT '',
  winner_country_code TEXT DEFAULT '',
  runner_up TEXT DEFAULT '',
  runner_up_country TEXT DEFAULT '',
  location TEXT DEFAULT '',
  division TEXT DEFAULT 'main',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tw_tournament ON tournament_winners(tournament);
CREATE INDEX IF NOT EXISTS idx_tw_year ON tournament_winners(year DESC);
CREATE INDEX IF NOT EXISTS idx_tw_winner ON tournament_winners(winner_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tw_unique ON tournament_winners(tournament, year, division);

-- 2. Seed WSC winners
INSERT OR IGNORE INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division) VALUES
('WSC', 2025, 'Adam Logan', 'Canada', 'CA', '', '', 'Accra, Ghana', 'main'),
('WSC', 2019, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Goa, India', 'main'),
('WSC', 2018, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'London, UK', 'main'),
('WSC', 2017, 'David Eldar', 'Australia', 'AU', '', '', 'Nottingham, UK', 'main'),
('WSC', 2016, 'Brett Smitheram', 'England', 'GB', '', '', 'Lille, France', 'main'),
('WSC', 2014, 'Craig Beevers', 'England', 'GB', '', '', 'London, UK', 'main'),
('WSC', 2013, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Prague, Czech Republic', 'main'),
('WSC', 2011, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Warsaw, Poland', 'main'),
('WSC', 2009, 'Pakorn Nemitrmansuk', 'Thailand', 'TH', '', '', 'Johor Bahru, Malaysia', 'main'),
('WSC', 2007, 'Nigel Richards', 'New Zealand', 'NZ', 'Ganesh Asirvatham', 'Malaysia', 'Mumbai, India', 'main'),
('WSC', 2005, 'Adam Logan', 'Canada', 'CA', '', '', 'London, UK', 'main'),
('WSC', 2003, 'Panupol Sujjayakorn', 'Thailand', 'TH', '', '', 'Kuala Lumpur, Malaysia', 'main'),
('WSC', 2001, 'Brian Cappelletto', 'USA', 'US', 'Joel Wapnick', 'Canada', 'Las Vegas, USA', 'main'),
('WSC', 1999, 'Joel Wapnick', 'Canada', 'CA', 'Mark Nyman', 'England', 'Melbourne, Australia', 'main'),
('WSC', 1997, 'Joel Sherman', 'USA', 'US', '', '', 'Washington DC, USA', 'main'),
('WSC', 1995, 'David Boys', 'Canada', 'CA', '', '', 'London, UK', 'main'),
('WSC', 1993, 'Mark Nyman', 'England', 'GB', '', '', 'New York, USA', 'main'),
('WSC', 1991, 'Peter Morris', 'Canada', 'CA', 'Brian Cappelletto', 'USA', 'London, UK', 'main');

-- 3. Seed WESPAC winners
INSERT OR IGNORE INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division) VALUES
('WESPAC', 2019, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Goa, India', 'main'),
('WESPAC', 2017, 'Harshan Lamabadusuriya', 'Sri Lanka', 'LK', '', '', 'Nairobi, Kenya', 'main'),
('WESPAC', 2015, 'Wellington Jighere', 'Nigeria', 'NG', 'Lewis Mackay', 'Scotland', 'Perth, Australia', 'main');

-- 4. Seed NSC/NASC/SPC winners
INSERT OR IGNORE INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division) VALUES
('NSC', 2025, 'Nigel Peltier', 'USA', 'US', '', '', 'TBD', 'main'),
('NSC', 2024, 'Mack Meller', 'USA', 'US', '', '', 'South Bend, IN', 'main'),
('NSC', 2023, 'Josh Sokol', 'USA', 'US', '', '', 'Las Vegas, NV', 'main'),
('NSC', 2022, 'Michael Fagen', 'USA', 'US', '', '', 'Baltimore, MD', 'main'),
('NSC', 2019, 'Josh Castellano', 'USA', 'US', '', '', 'Orlando, FL', 'main'),
('NSC', 2018, 'Will Anderson', 'USA', 'US', '', '', 'Buffalo, NY', 'main'),
('NSC', 2017, 'Joel Sherman', 'USA', 'US', '', '', 'New Orleans, LA', 'main'),
('NSC', 2016, 'David Eldar', 'Australia', 'AU', '', '', 'Indianapolis, IN', 'main'),
('NSC', 2015, 'Matthew Tunnicliffe', 'Canada', 'CA', '', '', 'Portland, OR', 'main'),
('NSC', 2014, 'Dave Wiegand', 'USA', 'US', '', '', 'Buffalo, NY', 'main'),
('NSC', 2013, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Las Vegas, NV', 'main'),
('NSC', 2012, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Orlando, FL', 'main'),
('NSC', 2011, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Dallas, TX', 'main'),
('NSC', 2010, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Dallas, TX', 'main'),
('NSC', 2009, 'Brian Cappelletto', 'USA', 'US', '', '', 'Dayton, OH', 'main'),
('NSC', 2008, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Orlando, FL', 'main'),
('NSC', 2004, 'Trey Wright', 'USA', 'US', '', '', 'New Orleans, LA', 'main'),
('NSC', 2002, 'Joel Sherman', 'USA', 'US', '', '', 'San Diego, CA', 'main'),
('NSC', 2000, 'Joe Edley', 'USA', 'US', '', '', 'Providence, RI', 'main'),
('NSC', 1998, 'Brian Cappelletto', 'USA', 'US', '', '', 'Chicago, IL', 'main'),
('NSC', 1996, 'Adam Logan', 'Canada', 'CA', '', '', 'Dallas, TX', 'main'),
('NSC', 1994, 'David Gibson', 'USA', 'US', '', '', 'Los Angeles, CA', 'main'),
('NSC', 1992, 'Joe Edley', 'USA', 'US', '', '', 'Atlanta, GA', 'main'),
('NSC', 1989, 'Peter Morris', 'Canada', 'CA', '', '', 'New York, NY', 'main'),
('NSC', 1985, 'Ron Tiekert', 'USA', 'US', '', '', 'Boston, MA', 'main'),
('NSC', 1983, 'Joel Wapnick', 'Canada', 'CA', '', '', 'Chicago, IL', 'main'),
('NSC', 1980, 'Joe Edley', 'USA', 'US', '', '', 'Los Angeles, CA', 'main'),
('NSC', 1978, 'David Prinz', 'USA', 'US', '', '', 'New York, NY', 'main');

-- 5. Seed Causeway Challenge winners
INSERT OR IGNORE INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division) VALUES
('Causeway', 2026, 'David Eldar', 'Australia', 'AU', 'Hakeem Olaribigbe', 'Nigeria', 'Bangkok, Thailand', 'premier'),
('Causeway', 2024, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Bangkok, Thailand', 'premier'),
('Causeway', 2023, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Bangkok, Thailand', 'premier'),
('Causeway', 2026, 'A Krishnan', 'India', 'IN', '', '', 'Bangkok, Thailand', 'div1');

-- 6. Seed WYSC winners
INSERT OR IGNORE INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division) VALUES
('WYSC', 2022, 'Ali Salman', 'Pakistan', 'PK', 'Madhav Gopal Kamath', 'India', 'Online (Woogles)', 'main'),
('WYSC', 2019, 'Syed Imaad Ali', 'Pakistan', 'PK', '', '', 'Kuala Lumpur, Malaysia', 'main'),
('WYSC', 2018, 'Hasham Hadi Khan', 'Pakistan', 'PK', '', '', 'Kuala Lumpur, Malaysia', 'main'),
('WYSC', 2017, 'Hasham Hadi Khan', 'Pakistan', 'PK', '', '', 'Kuala Lumpur, Malaysia', 'main'),
('WYSC', 2016, 'Janul de Silva', 'Sri Lanka', 'LK', '', '', 'Lille, France', 'main'),
('WYSC', 2015, 'Janul de Silva', 'Sri Lanka', 'LK', '', '', 'Perth, Australia', 'main'),
('WYSC', 2014, 'Janul de Silva', 'Sri Lanka', 'LK', '', '', 'London, UK', 'main'),
('WYSC', 2013, 'Sanchit Kapoor', 'India', 'IN', '', '', 'Prague, Czech Republic', 'main'),
('WYSC', 2012, 'Lewis Mackay', 'Scotland', 'GB', '', '', 'Kuala Lumpur, Malaysia', 'main'),
('WYSC', 2011, 'Alastair Richards', 'Australia', 'AU', '', '', 'Warsaw, Poland', 'main'),
('WYSC', 2009, 'Alastair Richards', 'Australia', 'AU', '', '', 'Johor Bahru, Malaysia', 'main'),
('WYSC', 2007, 'Akshay Bhandarkar', 'Bahrain', 'BH', '', '', 'Mumbai, India', 'main'),
('WYSC', 2006, 'Lewis Mackay', 'Scotland', 'GB', '', '', 'Kuala Lumpur, Malaysia', 'main');

-- 7. Seed World Cup winners
INSERT OR IGNORE INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division, notes) VALUES
('WorldCup', 2019, 'Nigel Richards', 'New Zealand', 'NZ', '', '', 'Goa, India', 'main', 'Held alongside WESPAC 2019'),
('WorldCup', 2017, 'David Eldar', 'Australia', 'AU', '', '', 'Nairobi, Kenya', 'main', 'Held alongside WESPAC 2017');

-- 8. Seed JWSC winners
INSERT OR IGNORE INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division, notes) VALUES
('JWSC', 2019, 'Syed Imaad Ali', 'Pakistan', 'PK', '', '', 'Goa, India', 'main', 'Held alongside WSC 2019'),
('JWSC', 2018, 'Hasham Hadi Khan', 'Pakistan', 'PK', '', '', 'London, UK', 'main', 'Held alongside WSC 2018'),
('JWSC', 2017, 'Hasham Hadi Khan', 'Pakistan', 'PK', '', '', 'Nottingham, UK', 'main', 'Held alongside WSC 2017');

-- 9. SEO Index entries for new pages
INSERT OR IGNORE INTO seo_index (url, status, seo_title, seo_meta_description, seo_json_ld_article, seo_json_ld_faq, notes) VALUES
('/blog/world-scrabble-championship/', 'discovered', 'World Scrabble Championship (WSC) — Winners, History & Records', 'Complete history of the World Scrabble Championship from 1991 to 2025.', 1, 1, 'Tournament history page - v1.21.2'),
('/blog/wespac-scrabble-championship/', 'discovered', 'WESPAC — WESPA Championship History, Winners & Format', 'Complete guide to WESPAC. Winners from 2015 to present.', 1, 1, 'Tournament history page - v1.21.2'),
('/blog/national-scrabble-championship/', 'discovered', 'National Scrabble Championship (USA) — Complete Winners History', 'Every winner of the NSC/SPC from 1978 to 2025.', 1, 1, 'Tournament history page - v1.21.2'),
('/blog/causeway-challenge-scrabble/', 'discovered', 'Causeway Challenge — The Worlds Biggest Scrabble Tournament', 'History of the Causeway Scrabble Challenge in Bangkok.', 1, 1, 'Tournament history page - v1.21.2'),
('/blog/world-youth-scrabble-championship/', 'discovered', 'World Youth Scrabble Championship (WYSC) — Winners & History', 'Complete history of the WYSC. Every champion since 2006.', 1, 1, 'Tournament history page - v1.21.2'),
('/blog/scrabble-world-cup/', 'discovered', 'Scrabble World Cup — Winners, Format & History', 'Guide to the Scrabble World Cup knockout-format event.', 1, 1, 'Tournament history page - v1.21.2'),
('/blog/junior-world-scrabble-championship/', 'discovered', 'Junior World Scrabble Championship (JWSC) — Winners & History', 'Complete guide to the JWSC held alongside the WSC.', 1, 1, 'Tournament history page - v1.21.2'),
('/countries/', 'discovered', 'Scrabble Countries — Players by Nation', 'Explore competitive Scrabble players from all countries.', 0, 1, 'Country pages index - v1.21.2');


-- 10. Update SEO index entries with full field data
UPDATE seo_index SET 
  seo_meta_keywords = 'world scrabble championship, WSC, scrabble world champion, nigel richards, scrabble tournament history, WESPA championship, scrabble winners list',
  seo_h1 = 'World Scrabble Championship (WSC) — Winners, History & Records',
  seo_h2_count = 4, seo_json_ld_article = 1, seo_json_ld_faq = 1,
  seo_title_length = 62, seo_desc_length = 128, seo_word_count = 800
WHERE url = '/blog/world-scrabble-championship/';

UPDATE seo_index SET 
  seo_meta_keywords = 'WESPAC, WESPA championship, scrabble championship, Ganesh Asirvatham, Harshan Lamabadusuriya, Nigel Richards, Wellington Jighere, international scrabble',
  seo_h1 = 'WESPAC — WESPA Championship History, Winners & Format',
  seo_h2_count = 4, seo_json_ld_article = 1, seo_json_ld_faq = 1,
  seo_title_length = 53, seo_desc_length = 145, seo_word_count = 650
WHERE url = '/blog/wespac-scrabble-championship/';

UPDATE seo_index SET 
  seo_meta_keywords = 'national scrabble championship, NSC, NASC, scrabble players championship, USA scrabble, Nigel Richards, Joe Edley, North American scrabble',
  seo_h1 = 'National Scrabble Championship (USA) — Complete Winners History',
  seo_h2_count = 3, seo_json_ld_article = 1, seo_json_ld_faq = 1,
  seo_title_length = 63, seo_desc_length = 155, seo_word_count = 750
WHERE url = '/blog/national-scrabble-championship/';

UPDATE seo_index SET 
  seo_meta_keywords = 'causeway challenge scrabble, causeway scrabble, Bangkok scrabble, Michael Tang, David Eldar, A Krishnan, international scrabble tournament, biggest scrabble event',
  seo_h1 = 'Causeway Challenge — The Worlds Biggest Scrabble Tournament',
  seo_h2_count = 4, seo_json_ld_article = 1, seo_json_ld_faq = 1,
  seo_title_length = 59, seo_desc_length = 152, seo_word_count = 700
WHERE url = '/blog/causeway-challenge-scrabble/';

UPDATE seo_index SET 
  seo_meta_keywords = 'world youth scrabble championship, WYSC, youth scrabble, junior scrabble players, Ali Salman, Hasham Hadi Khan, Janul de Silva, young scrabble champions',
  seo_h1 = 'World Youth Scrabble Championship (WYSC) — Winners & History',
  seo_h2_count = 3, seo_json_ld_article = 1, seo_json_ld_faq = 1,
  seo_title_length = 60, seo_desc_length = 148, seo_word_count = 600
WHERE url = '/blog/world-youth-scrabble-championship/';

UPDATE seo_index SET 
  seo_meta_keywords = 'scrabble world cup, world cup scrabble, knockout scrabble, Nigel Richards, David Eldar, WESPA scrabble, international scrabble',
  seo_h1 = 'Scrabble World Cup — Winners, Format & History',
  seo_h2_count = 3, seo_json_ld_article = 1, seo_json_ld_faq = 1,
  seo_title_length = 47, seo_desc_length = 140, seo_word_count = 500
WHERE url = '/blog/scrabble-world-cup/';

UPDATE seo_index SET 
  seo_meta_keywords = 'junior world scrabble championship, JWSC, junior scrabble, young scrabble players, Syed Imaad Ali, Hasham Hadi Khan, youth scrabble',
  seo_h1 = 'Junior World Scrabble Championship (JWSC) — Winners & History',
  seo_h2_count = 3, seo_json_ld_article = 1, seo_json_ld_faq = 1,
  seo_title_length = 61, seo_desc_length = 145, seo_word_count = 550
WHERE url = '/blog/junior-world-scrabble-championship/';

UPDATE seo_index SET 
  seo_meta_keywords = 'scrabble countries, scrabble players by country, international scrabble, WESPA countries, scrabble nations',
  seo_h1 = 'Scrabble Countries — Players by Nation',
  seo_h2_count = 2, seo_json_ld_article = 0, seo_json_ld_faq = 1,
  seo_title_length = 56, seo_desc_length = 143, seo_word_count = 400
WHERE url = '/countries/';


-- 11. Fill OG/Canonical/Internal links fields for all new pages
UPDATE seo_index SET 
  seo_og_title = seo_title,
  seo_og_description = seo_meta_description,
  seo_og_image = 'https://www.scrabblewordsfinder.com/social-card.svg',
  seo_canonical = 'https://www.scrabblewordsfinder.com' || url,
  seo_internal_links = 8
WHERE url IN (
  '/blog/world-scrabble-championship/',
  '/blog/wespac-scrabble-championship/',
  '/blog/national-scrabble-championship/',
  '/blog/causeway-challenge-scrabble/',
  '/blog/world-youth-scrabble-championship/',
  '/blog/scrabble-world-cup/',
  '/blog/junior-world-scrabble-championship/',
  '/countries/'
);


-- 12. WYSC data correction (complete history 2006-2025)
DELETE FROM tournament_winners WHERE tournament = 'WYSC';

INSERT INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, location, division, notes) VALUES
('WYSC', 2025, 'Madhav Gopal Kamath', 'India', 'IN', 'Kuala Lumpur, Malaysia', 'main', ''),
('WYSC', 2024, 'Affan Salman', 'Pakistan', 'PK', 'Colombo, Sri Lanka', 'main', ''),
('WYSC', 2023, 'Hivin Dilmith', 'Sri Lanka', 'LK', 'Online', 'main', 'WESPA Youth Cup'),
('WYSC', 2022, 'Akshat Sharma', 'India', 'IN', 'Online', 'main', ''),
('WYSC', 2021, 'Yagan Gunes', 'Australia', 'AU', 'Online', 'main', ''),
('WYSC', 2019, 'Wellington Jighere Jr.', 'Nigeria', 'NG', 'Torquay, England', 'main', ''),
('WYSC', 2018, 'Abdullah Abbasi', 'Pakistan', 'PK', 'Dubai, UAE', 'main', ''),
('WYSC', 2017, 'Aabid Ismail', 'Sri Lanka', 'LK', 'Subang Jaya, Malaysia', 'main', 'First WESPA Youth Cup branding'),
('WYSC', 2016, 'Sanchit Kapoor', 'United Arab Emirates', 'AE', '', 'main', ''),
('WYSC', 2015, 'Nicholas Hong', 'Malaysia', 'MY', '', 'main', ''),
('WYSC', 2014, 'Jack Durand', 'Australia', 'AU', '', 'main', ''),
('WYSC', 2013, 'Moizullah Baig', 'Pakistan', 'PK', '', 'main', ''),
('WYSC', 2012, 'Michael McKenna', 'Australia', 'AU', '', 'main', ''),
('WYSC', 2011, 'Anand Bharadwaj', 'Australia', 'AU', '', 'main', ''),
('WYSC', 2010, 'Ker Jen Ho', 'Malaysia', 'MY', '', 'main', ''),
('WYSC', 2009, 'Suanne Ong', 'Malaysia', 'MY', '', 'main', ''),
('WYSC', 2008, 'Charnrit Khongthanarat', 'Thailand', 'TH', '', 'main', ''),
('WYSC', 2007, 'Toh Weibin', 'Singapore', 'SG', '', 'main', ''),
('WYSC', 2006, 'David Eldar', 'Australia', 'AU', '', 'main', '');


-- 13. WYSC location backfill (2006-2016 were missing locations)
UPDATE tournament_winners SET location = 'Kuala Lumpur, Malaysia' WHERE tournament = 'WYSC' AND year = 2016;
UPDATE tournament_winners SET location = 'Perth, Australia' WHERE tournament = 'WYSC' AND year = 2015;
UPDATE tournament_winners SET location = 'London, UK' WHERE tournament = 'WYSC' AND year = 2014;
UPDATE tournament_winners SET location = 'Prague, Czech Republic' WHERE tournament = 'WYSC' AND year = 2013;
UPDATE tournament_winners SET location = 'Kuala Lumpur, Malaysia' WHERE tournament = 'WYSC' AND year = 2012;
UPDATE tournament_winners SET location = 'Warsaw, Poland' WHERE tournament = 'WYSC' AND year = 2011;
UPDATE tournament_winners SET location = 'Kuala Lumpur, Malaysia' WHERE tournament = 'WYSC' AND year = 2010;
UPDATE tournament_winners SET location = 'Johor Bahru, Malaysia' WHERE tournament = 'WYSC' AND year = 2009;
UPDATE tournament_winners SET location = 'Kuala Lumpur, Malaysia' WHERE tournament = 'WYSC' AND year = 2008;
UPDATE tournament_winners SET location = 'Mumbai, India' WHERE tournament = 'WYSC' AND year = 2007;
UPDATE tournament_winners SET location = 'Kuala Lumpur, Malaysia' WHERE tournament = 'WYSC' AND year = 2006;


-- 14. WESPAC data correction (complete 6 editions with runners-up)
DELETE FROM tournament_winners WHERE tournament = 'WESPAC';

INSERT INTO tournament_winners (tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division) VALUES
('WESPAC', 2025, 'Adam Logan', 'Canada', 'CA', 'Nigel Richards', 'New Zealand', 'Accra, Ghana', 'main'),
('WESPAC', 2023, 'David Eldar', 'Australia', 'AU', 'Harshan Lamabadusuriya', 'Sri Lanka', 'Las Vegas, USA', 'main'),
('WESPAC', 2021, 'Alastair Richards', 'New Zealand', 'NZ', 'David Eldar', 'Australia', 'Online (Woogles)', 'main'),
('WESPAC', 2019, 'Nigel Richards', 'New Zealand', 'NZ', 'Jesse Day', 'Canada', 'Goa, India', 'main'),
('WESPAC', 2017, 'Akshay Bhandarkar', 'India', 'IN', 'Moses Peter', 'Nigeria', 'Nairobi, Kenya', 'main'),
('WESPAC', 2015, 'Wellington Jighere', 'Nigeria', 'NG', 'Lewis Mackay', 'Scotland', 'Perth, Australia', 'main');


-- 15. Popular Tournaments landing page SEO index entry
INSERT OR IGNORE INTO seo_index (url, status, seo_title, seo_meta_description, seo_meta_keywords, seo_h1, seo_h2_count, seo_json_ld_article, seo_json_ld_faq, seo_title_length, seo_desc_length, seo_word_count, seo_og_title, seo_og_description, seo_og_image, seo_canonical, seo_internal_links, notes) VALUES (
  '/blog/popular-tournaments/',
  'discovered',
  'Popular Scrabble Tournaments — Championship Guide & History',
  'Guide to the worlds biggest Scrabble championships: WSC, WESPAC, NSC, Causeway Challenge, WYSC, World Cup, and JWSC. Winners, history, and how to qualify.',
  'scrabble tournaments, world scrabble championship, WESPAC, NSC, causeway challenge, WYSC, scrabble world cup, competitive scrabble events, scrabble championship history',
  'Popular Scrabble Tournaments — Championship Guide & History',
  7, 1, 1, 59, 153, 900,
  'Popular Scrabble Tournaments — Championship Guide & History',
  'Guide to the worlds biggest Scrabble championships: WSC, WESPAC, NSC, Causeway Challenge, WYSC, World Cup, and JWSC.',
  'https://www.scrabblewordsfinder.com/social-card.svg',
  'https://www.scrabblewordsfinder.com/blog/popular-tournaments/',
  12,
  'Tournament landing page - v1.21.2'
);
