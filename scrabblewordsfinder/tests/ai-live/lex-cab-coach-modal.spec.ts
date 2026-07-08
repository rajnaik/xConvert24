import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Lex C&B Coach Modal (Activities Page)
 *
 * Full E2E flow:
 * 1. Go to /activities/ with a real user ID that has CaB history
 * 2. Click "Lex C&B Coach" button
 * 3. Verify initial chat modal appears with "Coach me on my games" and "Diamond Hunt - Details" buttons
 * 4. Click "Coach me on my games"
 * 5. Wait for coaching analysis modal to load
 * 6. Verify stats, chart, AI sections, game-by-game, PDF buttons
 */

const BASE = 'https://www.scrabblewordsfinder.com'; // Always live — requires real CaB history
const TEST_USER_ID = '716fd02b-9d37-4a16-b2f1-4c1312ead857';

test.describe('AI Live — Lex C&B Coach Modal', () => {
  test.setTimeout(180000); // 3 min timeout

  test('full CaB coaching modal flow — chat, coach, stats, chart, AI sections, PDF', async ({ page }) => {
    // Navigate to activities page
    await page.goto(`${BASE}/activities/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Dismiss cookie consent if present
    try {
      await page.locator('button:has-text("Accept All")').click({ timeout: 3000 });
    } catch {}

    // Set user ID in localStorage
    await page.evaluate((uid) => {
      localStorage.setItem('swf-uid', uid);
      localStorage.setItem('swf-cookie-consent', 'accepted');
    }, TEST_USER_ID);

    // Reload to pick up user ID
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Dismiss diamond earned modal if it appears (blocks clicks)
    try {
      const diamondModal = page.locator('#diamond-earned-modal');
      if (await diamondModal.isVisible({ timeout: 3000 })) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        if (await diamondModal.isVisible({ timeout: 1000 })) {
          await page.evaluate(() => {
            const modal = document.getElementById('diamond-earned-modal');
            if (modal) modal.style.display = 'none';
          });
        }
      }
    } catch {}

    // Step 1: Click "Lex C&B Coach" button
    const lexBtn = page.locator('#LexCandB');
    await expect(lexBtn).toBeVisible({ timeout: 15000 });
    await lexBtn.click();

    // Step 2: Verify initial chat modal appears
    const chatModal = page.locator('#cab-lex-modal');
    await expect(chatModal).toBeVisible({ timeout: 10000 });

    // Step 3: Check "Coach me on my games" button exists
    const coachBtn = page.locator('#cab-lex-coach-btn');
    await expect(coachBtn).toBeVisible();
    await expect(coachBtn).toContainText('Coach me on my games');

    // Step 4: Check "Diamond Hunt - Details" button exists
    const diamondBtn = page.locator('#cab-lex-diamond-btn');
    await expect(diamondBtn).toBeVisible();
    await expect(diamondBtn).toContainText('Diamond Hunt - Details');

    // Step 5: Click "Coach me on my games"
    await coachBtn.click();

    // Step 6: Verify coaching analysis modal appears
    const coachModal = page.locator('#lex-cab-coach-modal');
    await expect(coachModal).toBeVisible({ timeout: 60000 });

    // Step 7: Check statistics tiles are present
    const statsBar = page.locator('#lex-cab-stats-bar');
    await expect(statsBar).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#lex-cab-stat-games')).toBeVisible();
    await expect(page.locator('#lex-cab-stat-rate')).toBeVisible();
    await expect(page.locator('#lex-cab-stat-avg')).toBeVisible();
    await expect(page.locator('#lex-cab-stat-quick')).toBeVisible();

    // Step 8: Check performance chart is present
    const graphSection = page.locator('#lex-cab-graph-section');
    await expect(graphSection).toBeVisible();
    await expect(page.locator('#lex-cab-graph')).toBeVisible(); // canvas element

    // Step 9: Check AI coaching text contains required sections
    const analysisText = page.locator('#lex-cab-analysis-text');
    await expect(analysisText).toBeVisible();
    const text = await analysisText.textContent() || '';

    // Verify required coaching sections are present
    const requiredSections = [
      'OVERALL GRADE',
      'STRENGTHS',
      'NEEDS WORK',
      'PREDICTION',
      "LEX'S CHALLENGE",
    ];

    for (const section of requiredSections) {
      expect(text.toUpperCase()).toContain(section);
    }

    // Step 10: Check Game-by-Game Analysis section
    const gamesSection = page.locator('#lex-cab-games');
    await expect(gamesSection).toBeVisible();
    const gamesCount = page.locator('#lex-cab-games-count');
    await expect(gamesCount).toBeVisible();
    // Verify at least some game entries are rendered
    const gameEntries = page.locator('#lex-cab-games-list > div');
    const entryCount = await gameEntries.count();
    expect(entryCount).toBeGreaterThan(0);

    // Step 11: Check Further Exploration / Chat link section
    const chatLink = coachModal.locator('a[href="/chat/?context=cab"]');
    await expect(chatLink).toBeVisible();

    // Step 12: Check PDF download and Save to Library buttons exist
    const downloadBtn = coachModal.locator('button', { hasText: 'Download PDF' });
    await expect(downloadBtn).toBeVisible({ timeout: 5000 });

    // Step 13: Click Download PDF and verify it triggers
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      downloadBtn.click(),
    ]);

    // Verify filename pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^lex-cab-report-\d{4}-\d{2}-\d{2}\.pdf$/);

    // Step 14: Save to Library button should appear after download
    const saveBtn = coachModal.locator('button', { hasText: 'Save to Library' });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });
});
