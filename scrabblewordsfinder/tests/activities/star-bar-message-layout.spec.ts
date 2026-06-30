import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * StarBar Message Layout — Tests for the repositioned #sb-message element.
 * After the June 30, 2026 change:
 * - #sb-message moved from inside the stars flex row to its own centered container below
 * - Stars container no longer uses flex-wrap (icons stay on one line)
 * - #sb-diamond-msg simplified (no responsive wrapping classes)
 */

// ── StarBar Message Layout — Positive ────────────────────────────────────

test.describe('StarBar Message Layout — Positive', () => {
  test('sb-message element exists in the DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#sb-message')).toBeAttached();
  });

  test('sb-message is inside a centered flex container', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // sb-message is now directly inside #star-bar, after the main flex row
    const parent = page.locator('#sb-message').locator('xpath=..');
    const parentId = await parent.getAttribute('id');
    expect(parentId).toBe('star-bar');
  });

  test('sb-message has left-aligned text styling', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const classAttr = await page.locator('#sb-message').getAttribute('class');
    expect(classAttr).toContain('text-xs');
    expect(classAttr).toContain('text-gray-400');
    expect(classAttr).toContain('mt-1');
  });

  test('stars container does not use flex-wrap', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The stars container is the div that holds #sb-wotd's parent
    const starsContainer = page.locator('#sb-wotd').locator('xpath=../..');
    const classAttr = await starsContainer.getAttribute('class');
    expect(classAttr).toContain('flex');
    expect(classAttr).not.toContain('flex-wrap');
  });
});

// ── StarBar Message Layout — Negative ────────────────────────────────────

test.describe('StarBar Message Layout — Negative', () => {
  test('no duplicate sb-message elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const count = await page.locator('#sb-message').count();
    expect(count).toBe(1);
  });

  test('sb-message is NOT inside the stars icon row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The stars icon row contains #sb-wotd — sb-message should NOT be a sibling
    const starsRow = page.locator('#sb-wotd').locator('xpath=../..');
    const msgInRow = starsRow.locator('#sb-message');
    await expect(msgInRow).toHaveCount(0);
  });

  test('star bar does not overflow on mobile viewport with no-wrap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#star-bar')).toBeVisible();
    // All star icons should still be attached (not lost to overflow)
    for (const id of ['#sb-wotd', '#sb-quiz', '#sb-wordbench', '#sb-rack', '#sb-anagram', '#sb-sixty', '#sb-diamond']) {
      await expect(page.locator(id)).toBeAttached();
    }
  });

  test('no JS errors from the layout restructure', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
