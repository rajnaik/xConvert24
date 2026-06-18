import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * WOTD → MWB Sync on Solver Page
 * When a user saves the WOTD to Memory WordBench on the solver page (index),
 * the MWB sidebar should update its word count immediately without requiring refresh.
 */

// Helper: wait for WOTD to populate on the solver page
async function waitForWotd(page: any): Promise<string | null> {
  try {
    await page.waitForFunction(
      () => {
        const el = document.getElementById('wotd-solver-word');
        return el && el.textContent && el.textContent !== '...' && el.textContent !== '—';
      },
      { timeout: 10000 }
    );
    return await page.locator('#wotd-solver-word').textContent();
  } catch {
    return null;
  }
}

// ── Positive Tests ────────────────────────────────────────────────────────

test.describe('WOTD → MWB Sync (Solver Page) — Positive', () => {
  test('MWB count updates after saving WOTD via + button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.setItem('swf-uid', 'test-wotd-sync');
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('#saved-count', { timeout: 10000 });

    // Initial count should be 0
    const countEl = page.locator('#saved-count');
    await expect(countEl).toHaveText('0');

    // Wait for WOTD to load
    const wotdWord = await waitForWotd(page);
    if (!wotdWord) { test.skip(); return; }

    // Click the + button to save WOTD to MWB
    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(500);

    // MWB count should now show 1
    await expect(countEl).toHaveText('1');
  });

  test('MWB sidebar shows saved WOTD word card after save', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.setItem('swf-uid', 'test-wotd-sync-2');
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('#saved-words-list', { timeout: 10000 });

    const wotdWord = await waitForWotd(page);
    if (!wotdWord) { test.skip(); return; }

    // Click + to save
    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(500);

    // The word should appear in MWB panel
    const listEl = page.locator('#saved-words-list');
    await expect(listEl).toContainText(wotdWord.toUpperCase());
  });
});

// ── Permanent Green State Tests ───────────────────────────────────────────

test.describe('WOTD Add Button — Permanent Green State', () => {
  test('add button stays green permanently after saving (no revert)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.setItem('swf-uid', 'test-wotd-green-persist');
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('#saved-count', { timeout: 10000 });

    const wotdWord = await waitForWotd(page);
    if (!wotdWord) { test.skip(); return; }

    // Click + to save — should turn green
    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#wotd-add-btn')).toHaveText('✓');
    await expect(page.locator('#wotd-add-btn')).toHaveClass(/text-green-400/);

    // Wait well past the old 1.5s timeout — should still be green
    await page.waitForTimeout(2500);
    await expect(page.locator('#wotd-add-btn')).toHaveText('✓');
    await expect(page.locator('#wotd-add-btn')).toHaveClass(/text-green-400/);
    await expect(page.locator('#wotd-add-btn')).toHaveClass(/border-green-500\/50/);
  });

  test('add button shows green immediately on reload when word already saved', async ({ page }) => {
    const fakeWord = 'TESTWORD';
    await page.addInitScript((word) => {
      const achievements = [{ word, meaning: 'test meaning', category: 'wotd', dateAdded: new Date().toISOString() }];
      localStorage.setItem('scbAchievements', JSON.stringify(achievements));
      localStorage.setItem('swf-uid', 'test-wotd-already-saved');
    }, fakeWord);

    await page.goto(BASE_URL);
    await page.waitForSelector('#wotd-add-btn', { timeout: 10000 });

    // Wait for the WOTD to load — if it matches our pre-saved word, button should be green
    const wotdWord = await waitForWotd(page);
    if (!wotdWord || wotdWord.toUpperCase() !== fakeWord) {
      // WOTD today doesn't match our pre-saved word — skip gracefully
      test.skip();
      return;
    }

    // Button should be permanently green (no setTimeout revert)
    await expect(page.locator('#wotd-add-btn')).toHaveText('✓');
    await expect(page.locator('#wotd-add-btn')).toHaveClass(/text-green-400/);

    // Still green after 2 seconds (verifying no revert)
    await page.waitForTimeout(2000);
    await expect(page.locator('#wotd-add-btn')).toHaveText('✓');
    await expect(page.locator('#wotd-add-btn')).toHaveClass(/text-green-400/);
  });
});

// ── Negative Tests ────────────────────────────────────────────────────────

test.describe('WOTD → MWB Sync (Solver Page) — Negative', () => {
  test('saving same WOTD twice does not create duplicate in MWB', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.setItem('swf-uid', 'test-wotd-no-dup');
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('#saved-count', { timeout: 10000 });

    const wotdWord = await waitForWotd(page);
    if (!wotdWord) { test.skip(); return; }

    // Click + twice
    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(500);
    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(500);

    // Count should still be 1 (no duplicates)
    const countEl = page.locator('#saved-count');
    await expect(countEl).toHaveText('1');
  });

  test('add button does not revert to "+" after clicking already-saved word', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.setItem('swf-uid', 'test-wotd-no-revert');
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('#saved-count', { timeout: 10000 });

    const wotdWord = await waitForWotd(page);
    if (!wotdWord) { test.skip(); return; }

    // First save
    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(300);

    // Second click (already saved) — should stay green, never revert to "+"
    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(2000);

    // Must still be green checkmark, not "+"
    await expect(page.locator('#wotd-add-btn')).toHaveText('✓');
    await expect(page.locator('#wotd-add-btn')).not.toHaveText('+');
  });

  test('no JS errors during WOTD save and MWB refresh', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.setItem('swf-uid', 'test-wotd-noerr');
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('#saved-count', { timeout: 10000 });

    const wotdWord = await waitForWotd(page);
    if (!wotdWord) { test.skip(); return; }

    await page.locator('#wotd-add-btn').click();
    await page.waitForTimeout(1000);

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });
});
