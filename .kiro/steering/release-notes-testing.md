# Release Notes Testing — Last 2 Versions Only

## Rule

When writing or updating Playwright tests for the release notes page (`tests/pages/releases.spec.ts`), **only test the last 2 versions** in the version-specific assertions. Do NOT write positional tests for older versions.

## What This Means

1. **Version-specific tests** (checking exact content, item counts, feature names) should only cover the **latest** and **second-latest** release entries.
2. **General structure tests** (total article count, schema, no duplicates, no sensitive data) remain and test the whole page.
3. When a new version is released, update the test file to:
   - Add tests for the new version (now the latest)
   - Keep tests for the previous version (now second-latest)
   - Remove tests that referenced the old second-latest version by name/position

## Why

- Testing every historical version by position (`.nth(3)`, `.nth(4)`, etc.) makes the test file brittle
- Every new release shifts all positions, breaking all older tests
- Historical versions don't change — testing them repeatedly adds no value
- The last 2 versions cover the most recent deploy and its immediate predecessor (regression safety)

## Test Structure Template

```typescript
// --- General tests (all versions, structure only) ---
test('has release articles with version headings', ...);
test('no duplicate release articles', ...);
test('no sensitive information exposed', ...);
test('FAQPage schema present', ...);

// --- Last 2 versions only (version-specific) ---
test('v{LATEST} release entry is present and is the latest', ...);
test('v{LATEST} lists all feature items', ...);
test('v{LATEST} has correct border styling', ...);

test('v{PREVIOUS} release entry is present as second entry', ...);
test('v{PREVIOUS} lists key features', ...);

// --- Negative tests (latest + second latest only) ---
test('latest version does not expose internal admin details', ...);
test('second latest version does not expose internal admin details', ...);
```

## When Updating

After every version bump + release notes update:
1. Update `v{LATEST}` tests to match the new version
2. Update `v{PREVIOUS}` tests to match what was previously the latest
3. Remove any tests that referenced versions older than the new second-latest

## Applies To

- `scrabblewordsfinder/tests/pages/releases.spec.ts`
- Any future workspace release notes test files

## Agent Attribution

This is a **kiro** steering rule, created June 28, 2026.
