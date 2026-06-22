-- Add timer_duration and split_time columns to CaB_Scores
-- timer_duration: the countdown timer chosen (30, 45, 60, 75, 90 seconds) or NULL if untimed
-- split_time: seconds remaining when the player solved (only set on solve)

ALTER TABLE CaB_Scores ADD COLUMN timer_duration INTEGER DEFAULT NULL;
ALTER TABLE CaB_Scores ADD COLUMN split_time INTEGER DEFAULT NULL;
