# Words Must Have Meanings — Mandatory Data Integrity Rule

## Rule

Every word stored in the following SWF database tables **MUST** have a non-empty `meaning` field at the time of insertion. No exceptions.

| Table | Word Column | Meaning Column | Notes |
|-------|-------------|----------------|-------|
| `word_of_the_day` | `word` | `meaning` | WOTD — daily vocabulary word |
| `daily_anagram` | `word` | `meaning` | Daily anagram challenge word |
| `daily_rack` | `best_word` | `meaning` | Best scoring word for the daily rack |

## What This Means

1. **When seeding new words** (bulk INSERT for future dates), always include a concise definition in the `meaning` column.
2. **When generating words programmatically**, fetch or generate the definition before inserting.
3. **Never insert a word with an empty meaning** — treat `meaning = ''` as a bug.
4. **If a meaning is unknown**, use a general dictionary definition (one sentence, plain English, no jargon).

## Definition Style Guide

- One sentence, max 60 characters where possible (fits cleanly in UI tables)
- Start with the part of speech implied (noun → "A...", verb → "To...", adjective → description)
- No trailing periods needed for short definitions
- Examples:
  - QUIXOTIC → "Exceedingly idealistic; unrealistic and impractical."
  - ZEPHYR → "A light wind from the west."
  - THRIVE → "To prosper or flourish."

## Validation Check

Before any bulk insert of words, run this validation:

```sql
-- Check for empty meanings (should return 0 rows)
SELECT word, date FROM word_of_the_day WHERE meaning = '' OR meaning IS NULL;
SELECT word, date FROM daily_anagram WHERE meaning = '' OR meaning IS NULL;
SELECT best_word, date FROM daily_rack WHERE (meaning = '' OR meaning IS NULL) AND best_word != '';
```

If any rows are returned, **backfill the meanings before proceeding** with other work.

## When Seeding Future Words

Template for INSERT statements:

```sql
-- WOTD
INSERT INTO word_of_the_day (word, date, meaning, fun_fact) 
VALUES ('EPHEMERAL', '2026-07-01', 'Lasting for a very short time.', 'From Greek ephemeros meaning lasting only a day.');

-- Anagram
INSERT INTO daily_anagram (date, word, scrambled, hint, word_length, meaning) 
VALUES ('2026-07-01', 'CASTLE', 'TCLSAE', 'A fortified building', 6, 'A large fortified building or group of buildings.');

-- Rack
INSERT INTO daily_rack (date, rack, best_word, best_score, meaning) 
VALUES ('2026-07-01', 'AEILNRT', 'LATRINE', 42, 'A communal toilet in a camp or barracks.');
```

## Applies To

- SWF workspace only (these tables live in the SWF D1 database)
- All environments: local, staging, live
- All agents: kiro, quill, any future agent that seeds word data

## Agent Attribution

This is a **kiro** steering rule, created June 21, 2026.
