-- Register Cows and Bulls as a star-earning activity
-- This makes CaB contribute to the daily diamond progression (now 7 stars needed)

INSERT OR IGNORE INTO activities (slug, name, icon, description, component, star_action, color, sort_order) VALUES
  ('cab', 'Cows and Bulls', '🐄', 'Guess the secret word — bulls for correct position, cows for wrong position', 'CaBPanel', 'Solve 1 game (any length)', 'orange', 7);
