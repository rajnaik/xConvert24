# Solver Lock — DO NOT MODIFY

## Rule

The Scrabble word solver logic in `scrabblewordsfinder/src/pages/index.astro` is **LOCKED**.

**NEVER** modify any of the following functions or sections in that file:
- `loadDictionary()` — dictionary fetch and merge logic
- `canMake()` — tile availability check
- `solve()` — word filtering, scoring, and display
- `wordScore()` — letter scoring
- The `textSolveBtn` click handler
- The `syncTextToTiles()` / `syncTiles()` bidirectional sync
- The debounced `input` listener on `#tiles`
- The tile rack box input/keydown handlers

## What This Means

1. Do NOT refactor, restructure, or "improve" the solver logic
2. Do NOT change the dictionary loading URLs or merge strategy
3. Do NOT alter the `maxLen`, `minLen`, or filtering logic in `solve()`
4. Do NOT change how results are rendered in `resultsEl`
5. Do NOT touch the `WORDS`, `SOWPODS`, `TWL` arrays or their construction

## Exceptions

Only the user (Raj) can unlock this by explicitly saying "unlock solver" in chat. Until then, treat any write to the solver logic as **DENIED**.

## Applies To

- `scrabblewordsfinder/src/pages/index.astro` — the `<script>` section containing solver logic
- `scrabblewordsfinder/public/data/sowpods-*.json` — dictionary data files
- `scrabblewordsfinder/public/data/twl06-*.json` — dictionary data files

## Locked Since

v1.1.0 — June 13, 2026
