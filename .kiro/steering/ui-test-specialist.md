# UI Test Specialist — Automated Test Generation & Validation

When a UI file is edited (.astro, .html, popup.html, popup.js), the UI Test Specialist process runs automatically:

## Process

1. **Analyse the change** — determine what UI behaviour was added/modified
2. **Write the test** — create a Playwright test covering the new behaviour
3. **Run the test** — execute it against the target (live site or extension)
4. **If PASSES** — add to the test suite permanently, log success
5. **If FAILS** — DO NOT add to suite, log failure, report the issue

## How to Trigger

Triggered automatically by the `ui-test-watcher` hook on `.astro` and `.html` file edits.

Can also be triggered manually: say "UI Test Specialist Run"

## Steps (executed by agent)

### Step 1: Write Test
- Identify the file changed and what's new/different
- Write a Playwright test in the appropriate `tests/` folder
- Name it with `.new.spec.ts` suffix (temporary until validated)

### Step 2: Run Test
```bash
# For SWF pages:
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder
SWF_TEST_URL=https://scrabblewordsfinder.com npx playwright test tests/<new-test>.new.spec.ts --reporter=list

# For Chrome extensions:
cd /Users/rajeevnaik/Code/xConvert.com/admin/ChromeExt/ABC/tests
npx playwright test abc.spec.ts --reporter=list
```

### Step 3: Log Result
```bash
# Log to local DB
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder
npx wrangler d1 execute DB --local --command "INSERT INTO test_results (test_name, status, run_at, file_changed) VALUES ('<test_name>', '<pass|fail>', datetime('now'), '<file_path>');"
```

### Step 4: Add to Suite (only if passed)
- If PASSED: rename from `.new.spec.ts` to `.spec.ts` (permanent)
- If FAILED: delete the `.new.spec.ts` file, report the failure in chat

### Step 5: Report
- On PASS: "UI Test Specialist: ✅ New test added — <test description>"
- On FAIL: "UI Test Specialist: ❌ Test failed — <reason>. Fix needed before this change ships."

## Test Results Table

Create if not exists:
```sql
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  run_at TEXT DEFAULT (datetime('now')),
  file_changed TEXT DEFAULT '',
  error_message TEXT DEFAULT ''
);
```

## Pre-Write Check

Before making UI changes, check if previous tests are passing:
```sql
SELECT * FROM test_results WHERE status = 'fail' ORDER BY run_at DESC LIMIT 5;
```
If there are recent failures, warn before proceeding.

## Agent Attribution

This is a **kiro** automated process.
