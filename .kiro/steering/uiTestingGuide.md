# UI Testing Guide — Standards & Best Practices

Guidelines for writing automated UI tests across all projects (SWF, xConvert, Chrome Extensions).

## Test Categories

Every UI feature must have BOTH:

### 1. Positive Tests (Happy Path)
- Feature exists and is visible
- Feature responds to user interaction
- Feature produces expected output
- State persists correctly
- UI updates reflect data changes

### 2. Negative Tests (Failure Paths)
- What happens with empty/invalid input
- What happens on restricted pages (chrome://, about:)
- What happens when API/network fails
- What happens when required element is missing
- What happens with duplicate data
- Error messages display correctly
- UI recovers gracefully (no crash, no ghost elements)

## Test Structure Rules

1. **One assertion per test** where possible — makes failures easy to diagnose
2. **Descriptive test names** — read like sentences: "detach button does not crash on chrome:// page"
3. **Group by feature** — use `test.describe('Feature Name — Positive/Negative')`
4. **Clean up after** — close pages, clear storage, reset state
5. **No flaky waits** — use `waitForSelector` over `waitForTimeout` where possible
6. **Skip gracefully** — if a precondition fails, `test.skip()` instead of crashing

## What to Test for Every UI Change

| Change Type | Positive Test | Negative Test |
|-------------|--------------|---------------|
| New button | Visible, clickable, correct label | Does nothing harmful when clicked in wrong context |
| New input | Accepts valid values, saves | Rejects/handles empty, too-long, special chars |
| New link | Correct href, opens correctly | Has ref param, doesn't 404 |
| New modal | Opens, shows content, closes | Closes on escape, closes on backdrop click |
| New API call | Returns expected data | Handles 500, timeout, empty response |
| Style change | Correct class applied | Doesn't break on mobile viewport |

## Naming Convention

```
tests/
├── <feature>.spec.ts          — permanent (passed validation)
├── <feature>.new.spec.ts      — temporary (awaiting validation)
```

## Test Lifecycle

1. UI change detected (hook or manual)
2. Write test as `.new.spec.ts`
3. Run test
4. PASS → rename to `.spec.ts`, log to `test_results` table
5. FAIL → delete `.new.spec.ts`, log failure, report

## Playwright Patterns

### Extension testing (requires headed mode)
```typescript
const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: ['--load-extension=/path/to/ext'],
});
```

### Website testing
```typescript
test('feature works', async ({ page }) => {
  await page.goto('/page');
  await expect(page.locator('#element')).toBeVisible();
});
```

### Error listening (negative tests)
```typescript
const errors: string[] = [];
page.on('pageerror', err => errors.push(err.message));
// ... do action ...
expect(errors.filter(e => e.includes('critical'))).toHaveLength(0);
```

## Pre-Write Check

Before any UI file write, check:
```sql
SELECT * FROM test_results WHERE status = 'fail' ORDER BY run_at DESC LIMIT 5;
```
Fix failures before adding new features.

## Tools

- **Playwright** — primary test framework
- **D1 test_results table** — tracks pass/fail history
- **ui-test-watcher hook** — auto-triggers on .astro/.html edits
- **run-tests.sh** — displays green/red banner on pass/fail
