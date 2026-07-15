-- Migration 0070: Add previous holder info to scrabble_records for timeline display
-- Date: July 15, 2026

-- Add columns for tracking who held the record before the current holder
ALTER TABLE scrabble_records ADD COLUMN previous_holder TEXT DEFAULT '';
ALTER TABLE scrabble_records ADD COLUMN previous_value TEXT DEFAULT '';
ALTER TABLE scrabble_records ADD COLUMN held_since TEXT DEFAULT '';

-- Seed previous holder data for known records
UPDATE scrabble_records SET previous_holder = 'Nigel Richards', previous_value = '2145', held_since = '2024-03-01' WHERE record_name = 'Highest Peak Rating (Active)' AND holder_name = 'David Eldar';
UPDATE scrabble_records SET previous_holder = 'David Eldar (2019-2024)', previous_value = '—', held_since = '2006-01-01' WHERE record_name = 'Longest Time at World No.1' AND holder_name = 'Nigel Richards';
UPDATE scrabble_records SET previous_holder = 'Mack Meller', previous_value = '23 years', held_since = '2023-06-01' WHERE record_name = 'Youngest to Reach 2000 Rating' AND holder_name = 'Austin Shin';
UPDATE scrabble_records SET previous_holder = 'Joel Sherman', previous_value = '4', held_since = '2015-11-01' WHERE record_name = 'Most WESPAC Titles' AND holder_name = 'Nigel Richards';
UPDATE scrabble_records SET previous_holder = 'Karl Khoshnaw', previous_value = '770', held_since = '2006-10-01' WHERE record_name = 'Highest Single-Game Score' AND holder_name = 'Michael Cresta';
UPDATE scrabble_records SET previous_holder = 'Various', previous_value = '480+', held_since = '1999-01-01' WHERE record_name = 'Highest Game Spread' AND holder_name = 'Joel Wapnick';
UPDATE scrabble_records SET previous_holder = 'Various', previous_value = '6', held_since = '2010-01-01' WHERE record_name = 'Most Consecutive Tournament Wins' AND holder_name = 'Nigel Richards';
UPDATE scrabble_records SET previous_holder = 'Nigel Richards', previous_value = '4 years', held_since = '2019-01-01' WHERE record_name = 'Fastest to World No.1 from Debut' AND holder_name = 'David Eldar';
UPDATE scrabble_records SET previous_holder = 'Komol Panyasophonlert', previous_value = '+150', held_since = '2019-01-01' WHERE record_name = 'Biggest Rating Jump in 1 Year' AND holder_name = 'Harshan Lamabadusuriya';
UPDATE scrabble_records SET previous_holder = '—', previous_value = '—', held_since = '2015-11-01' WHERE record_name = 'Biggest Rank Climb from Single Event' AND holder_name = 'Wellington Jighere';
