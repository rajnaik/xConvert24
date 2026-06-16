# Always Test — Continuous Regression Suite Growth

## Rule

Every time a new feature, page, or UI change is built on ANY workspace, Kiro MUST also write Playwright UI tests and add them to the regression suite in the same session.

## What This Means

1. **No feature ships without tests.** If a new page, panel, API, or interaction is created — corresponding positive + negative tests MUST be written before marking the task done.
2. **Tests go in the `tests/` directory** of the relevant workspace.
3. **Follow the naming convention:** `tests/<feature>.spec.ts` (permanent) or `tests/<feature>.new.spec.ts` (pending validation).
4. **Minimum per feature:**
   - 2 positive tests (exists, works correctly)
   - 2 negative tests (handles errors, no duplicates, no crashes)
5. **After writing tests, run them** if the dev server is available. Log results to `test_results` table.
6. **Cumulative:** The regression suite grows with every session. Never remove passing tests unless the feature is intentionally deleted.

## Applies To

- SWF (`scrabblewordsfinder/tests/`)
- xConvert (`tests/`)
- Playground (`playground/tests/`)
- Coins (`coins/tests/`) — when built

## Reminder Trigger

This rule activates on EVERY feature delivery. If Kiro finishes a task and hasn't written tests, this is a failure state. The success flag (🟩) should NOT be shown until tests are written or explicitly waived by Raj.

## Current Test Counts (update after each session)

| Workspace | Test Files | Last Updated |
|-----------|-----------|--------------|
| SWF | 24+ tests (various spec files) | June 15, 2026 |
| xConvert | TBD | — |
| Playground | 22 tests (playground.spec.ts) | June 16, 2026 |
| Coins | 0 | — |
