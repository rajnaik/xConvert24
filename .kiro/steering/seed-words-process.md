# Seed Words Process — WOTD, Daily Anagram, Daily Rack

How to seed word data for future years across all three SWF tables.

## When to Run

- When existing data is running low (less than 6 months ahead)
- When Raj says "seed wotd/anagram/rack for X years"
- After a database reset or migration

## Prerequisites

- Dev Mode SWF must be active
- Dictionary files must exist at `public/data/sowpods-2-7.json` and `public/data/sowpods-8-15.json`
- Check current coverage first:

```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder
npx wrangler d1 execute DB --local --command "
SELECT 'wotd' as tbl, MIN(date) as earliest, MAX(date) as latest, COUNT(*) as total FROM word_of_the_day
UNION ALL SELECT 'anagram', MIN(date), MAX(date), COUNT(*) FROM daily_anagram
UNION ALL SELECT 'rack', MIN(date), MAX(date), COUNT(*) FROM daily_rack;
" --json
```

## Table Schemas

### word_of_the_day
- `word` TEXT NOT NULL **UNIQUE** — the vocabulary word
- `date` TEXT — the display date
- `meaning` TEXT — concise definition (MANDATORY, never empty)
- `fun_fact` TEXT — interesting etymology or fact

### daily_anagram
- `date` TEXT NOT NULL **UNIQUE** — one entry per date
- `word` TEXT NOT NULL — the answer word (5-8 letters)
- `scrambled` TEXT NOT NULL — shuffled version
- `hint` TEXT — short clue
- `word_length` INTEGER — character count
- `meaning` TEXT — concise definition (MANDATORY)

### daily_rack
- `date` TEXT NOT NULL **UNIQUE** — one entry per date
- `rack` TEXT — 7 random Scrabble tiles
- `best_word` TEXT — highest-scoring word from rack
- `best_score` INTEGER — Scrabble score
- `meaning` TEXT — definition of best_word (MANDATORY)

## Step-by-Step Process

### 1. Seed Daily Rack

Racks need to be randomly generated AND solved against the dictionary.

```javascript
// scripts/seed-rack-extension.mjs pattern:
// 1. Generate random 7-tile rack from Scrabble tile distribution
// 2. Solve using SOWPODS dictionary (find highest-scoring word)
// 3. Generate meaning for the best word
// 4. Output SQL INSERT statements
```

Key points:
- Use Scrabble tile bag distribution: `AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ`
- Solve each rack by iterating all dictionary words and checking `canMake(word, rack)`
- Score using standard Scrabble letter values
- Some racks are unsolvable (all consonants) — mark as `best_word = 'N/A'`
- Use UTC dates in generation to avoid DST bugs

### 2. Seed WOTD

```javascript
// scripts/seed-wotd-extension.mjs pattern:
// 1. Curate interesting vocabulary words with meanings + fun facts
// 2. Check against existing DB for UNIQUE constraint on `word`
// 3. Filter out duplicates
// 4. Generate INSERT statements
```

Key points:
- `word` column has UNIQUE constraint — check existing words first!
- Every word MUST have a meaning (per words-must-have-meanings rule)
- Fun facts should be etymological or historical
- Choose varied, interesting vocabulary (mix common + obscure)

### 3. Seed Daily Anagram

```javascript
// scripts/seed-anagram-extension.mjs pattern:
// 1. Curate 5-8 letter words with hints and meanings
// 2. Scramble each word (Fisher-Yates shuffle, ensure different from original)
// 3. Generate INSERT statements
```

Key points:
- `date` column has UNIQUE constraint
- Words should be common enough to be guessable (not obscure SOWPODS words)
- Hints should be 3-5 words, descriptive but not a giveaway
- word_length must match actual word length

### 4. Apply to All Environments

```bash
# Local
npx wrangler d1 execute DB --local --file=/tmp/<file>.sql

# Live (pipe Y for large files)
echo "Y" | npx wrangler d1 execute DB --remote --file=/tmp/<file>.sql

# Staging
echo "Y" | npx wrangler d1 execute DB --remote --config wrangler.staging.jsonc --file=/tmp/<file>.sql
```

### 5. Validate

```bash
npx wrangler d1 execute DB --local --command "
SELECT 'wotd' as tbl, COUNT(*) as empty FROM word_of_the_day WHERE meaning = '' OR meaning IS NULL
UNION ALL SELECT 'anagram', COUNT(*) FROM daily_anagram WHERE meaning = '' OR meaning IS NULL
UNION ALL SELECT 'rack', COUNT(*) FROM daily_rack WHERE (meaning = '' OR meaning IS NULL) AND best_word != '';
" --json
```

All counts must be 0.

## Common Issues

1. **UNIQUE constraint on word_of_the_day.word** — always filter against existing words
2. **DST date generation bug** — always use `Date.UTC()` and `getUTCDate()`/`setUTCDate()` for date iteration
3. **Unsolvable racks** — ~1% of random racks have no valid word (all consonants). Mark as N/A.
4. **Remote DB already seeded differently** — live may have data from a different seeding run. Check remote state before blindly applying local SQL.
5. **Large file execution** — wrangler prompts for confirmation on files >100 statements. Pipe `echo "Y"` to auto-confirm.

## Meaning Generation for Rack Words

Many solved rack words are obscure SOWPODS entries. Strategy:
1. First, try a curated dictionary of ~400 common Scrabble words with hand-written definitions
2. Fall back to pattern-based generation (plurals, past tenses, comparatives, etc.)
3. For truly obscure words, use "A valid word in the SOWPODS Scrabble dictionary"
4. The DictionaryAPI (dictionaryapi.dev) works but is rate-limited (~450/min) and too slow for 900+ words

## Current Coverage (as of June 22, 2026)

| Table | Local | Staging | Live |
|-------|-------|---------|------|
| WOTD | Jun 15 '26 → Jun 22 '29 | Same | → Oct '53 (9993 rows) |
| Anagram | Jun 16 '26 → Jun 22 '29 | Same | Same |
| Rack | Jun 16 '26 → Jun 22 '29 | Same | Same |

## Agent Attribution

This is a **kiro** steering document, created June 22, 2026.
