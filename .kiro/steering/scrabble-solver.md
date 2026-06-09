---
inclusion: fileMatch
fileMatchPattern: '**/scrabble*'
---

# Scrabble Solver — Page Logic Reference

This documents all interactive features, data flows, and localStorage keys on `/tools/scrabble`.

---

## Architecture

- **Single page**: `src/pages/tools/scrabble.astro`
- **Dictionary**: `/public/data/sowpods-2-7.json` (SOWPODS, 2-7 letter words)
- **All logic is client-side** — no API calls except word definitions (Free Dictionary API)
- **Backups**: `scrabble.astro.bak` (pre-features), `scrabble.astro.bak-instant-search-copy-btn-2letter-3letter-qwithoutu` (checkpoint)

---

## localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `scbWords` | JSON array of `ScbWord` | Saved words (max 10) with score, star rating, comment, datetime |
| `scbScoredWords` | JSON string array | Words the user has "scored" in the challenge table |
| `scbTileProb` | JSON `{ inBag, played }` | Tile probability panel state — persists between sessions |

### ScbWord Interface
```ts
interface ScbWord {
  word: string;
  score: number;
  star: number;       // 1-5 rating
  comment: string;
  datetime: string;   // ISO datetime-local format
}
```

---

## Features & How They Work

### 1. Word Solver (core)
- Input: tiles field (up to 15 chars, `?` = blank/wildcard)
- Filters: min length (2-5), sort by (score/length/alpha)
- Output: grid of matching words from SOWPODS dictionary
- Algorithm: brute-force `canMake()` check against all dictionary words

### 2. Instant Search
- Debounced 300ms on input event
- Fires `solve()` automatically when ≥2 tiles entered
- "Find Words" button still works for manual trigger

### 3. Copy Word Button (📋)
- On each result word, copies uppercase word to clipboard
- Shows ✓ green check for 1 second as feedback

### 4. SOWPODS Legality Badge (✓)
- Green checkmark on every result (all words come from SOWPODS dictionary)
- Tooltip: "Valid in SOWPODS dictionary"

### 5. Save Word (💾)
- Max 10 saved words
- Opens edit modal for star rating (1-5), comment, datetime
- When saved: triggers `onWordPlayed(word.length)` → updates probability panel
- "List full" prompt if at 10 words — asks user to delete one

### 6. Word Definitions (click)
- Click any result word → fetches from `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- Shows tooltip with part of speech + definition
- Auto-dismisses after 8 seconds
- Graceful fallback: "No definition found"

### 7. Tile Bag Probability Panel
- **In bag**: editable number (default 100), decrements when word is clicked/saved
- **Your rack**: auto-counted from tiles input
- **Played**: editable number (default 0), increments when word is clicked/saved
- Both values persist in localStorage (`scbTileProb`)
- Shows draw probability for key tiles: S, E, R, T, N, Blank, Z, Q, X, J
- Updates on: tile input change, in-bag change, played change, word click, word save

### 8. Clicking a Result Word
- Highlights tiles used in that word (in the Tile Scores section)
- Increments "played" by word length
- Decrements "in bag" by word length
- Toggle: click again to unhighlight (but counts don't revert)

### 9. High-Scoring Words Table
- Shows on page load (before any search)
- Top 5 words for lengths 2, 3, 4, 5
- Disappears once user performs a search
- "Scored" challenge: user can checkmark words they've used in real games (persists in `scbScoredWords`)

### 10. Hint Bubble
- Orange "Enter your letters here" bubble appears after 1 second
- Disappears permanently on first input focus

### 11. Reference Panels (populated after dictionary loads)
- **Two-Letter Words**: all valid 2-letter words, colour-coded amber, with scores
- **Top 3-Letter Words**: top 30 by score, blue-coded
- **Q Without U**: all Q-no-U words, purple-coded, sorted by score
- **Words with Rare Letters**: tabbed (Q/Z/X/J), top 40 each, colour-coded per letter

### 12. Download Saved Words
- Button `#download-saved-btn` (greyed out when no words, active when words exist)
- Downloads JSON with `{ version: 1, userId, exportedAt, savedWords, scoredWords }`
- Filename: `scrabble-words-{uid-prefix}-{date}.json`

### 13. Edit Saved Word Modal
- Star rating (1-5 with emoji icons)
- Comment field
- Datetime picker
- Delete button per word in saved list

---

## Event Flow

```
User types tiles → debounce 300ms → solve() → render results
                                                    ↓
User clicks result word → highlightTiles() + onWordPlayed(len)
                                                    ↓
                                          updateProbability() + saveProbState()
                                                    ↓
User clicks 💾 → saveWord() → push to scbWords + onWordPlayed(len)
                                                    ↓
                                          renderSavedWords() + solve() (refresh buttons)
```

---

## Future Features (not yet built)

- **Rack Leave Analyzer** — after solving, show leave quality (vowel/consonant balance)
- **Best Opening Moves** — highest-scoring 7-letter words for opening play
- **Endgame Tile Tracker** — separate page `/tools/scrabble/tile-tracker`
- **Board Analyzer** — separate page `/tools/scrabble/board` (major project)

---

## Testing

- Test file: `tests/scrabble-features.spec.ts` (14 tests)
- Tests run against production by default (`TEST_BASE_URL`)
- Covers: download button, high-scoring table, hint bubble, blog links, bug report link
