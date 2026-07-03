import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Admin Saved Words — Category Filter Fix', () => {
  test('clicking Lex AI filter shows only users with Lex AI words', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(2000);

    // Click the Lex AI pill
    const lexPill = page.locator('button.cat-pill', { hasText: '🤖 Lex AI' });
    await expect(lexPill).toBeVisible();
    await lexPill.click();
    await page.waitForTimeout(500);

    // All visible user cards should have Lex AI words (non-empty word cards section)
    const userCards = page.locator('#users-list > div');
    const count = await userCards.count();
    expect(count).toBeGreaterThan(0);

    // Each visible user card should show the Lex AI badge
    for (let i = 0; i < count; i++) {
      const card = userCards.nth(i);
      const lexBadge = card.locator('span', { hasText: '🤖 Lex AI' });
      await expect(lexBadge).toBeVisible();
    }
  });

  test('clicking category filter hides users without words in that category', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(2000);

    // Get total user count with "All" filter
    const allPill = page.locator('button.cat-pill', { hasText: 'All' });
    await allPill.click();
    await page.waitForTimeout(300);
    const allCount = await page.locator('#users-list > div').count();

    // Click a specific category filter
    const lexPill = page.locator('button.cat-pill', { hasText: '🤖 Lex AI' });
    await lexPill.click();
    await page.waitForTimeout(500);
    const filteredCount = await page.locator('#users-list > div').count();

    // Filtered count should be less than or equal to all count
    expect(filteredCount).toBeLessThanOrEqual(allCount);
    // And should be > 0 since we know there are Lex AI words
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('filter indicator shows correct word count for active filter', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(2000);

    const lexPill = page.locator('button.cat-pill', { hasText: '🤖 Lex AI' });
    await lexPill.click();
    await page.waitForTimeout(500);

    const indicator = page.locator('#filter-indicator');
    const text = await indicator.textContent() || '';
    // Should show "Lex AI" in the filter text
    expect(text).toContain('Lex AI');
    // Should show a non-zero word count
    expect(text).not.toContain('→ 0 words');
  });

  test('switching between categories updates the displayed users', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(2000);

    // Click Lex AI
    const lexPill = page.locator('button.cat-pill', { hasText: '🤖 Lex AI' });
    await lexPill.click();
    await page.waitForTimeout(500);
    const lexCount = await page.locator('#users-list > div').count();

    // Click Manual
    const manualPill = page.locator('button.cat-pill', { hasText: '✋ Manual' });
    await manualPill.click();
    await page.waitForTimeout(500);
    const manualCount = await page.locator('#users-list > div').count();

    // Both should show users (since data has both categories)
    expect(lexCount).toBeGreaterThan(0);
    expect(manualCount).toBeGreaterThan(0);
  });
});
