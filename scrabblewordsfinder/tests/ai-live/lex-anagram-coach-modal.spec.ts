import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Lex Anagram Coach Modal (Activities Page)
 *
 * Full E2E flow:
 * 1. Go to /activities/ with a real user ID that has anagram history
 * 2. Click "Lex Anagram Coach" button
 * 3. Wait for modal to load with AI analysis
 * 4. Verify modal structure: title, stats, chart, time insights
 * 5. Verify AI coaching sections present
 * 6. Verify game-by-game analysis
 * 7. Verify PDF download + save buttons exist
 * 8. Verify Further Exploration section has links
 * 9. Click Download PDF and verify filename
 */

const BASE = 'https://www.scrabblewordsfinder.com'; // Always live — requires real anagram history
const TEST_USER_ID = '716fd02b-9d37-4a16-b2f1-4c1312ead857';

test.describe('AI Live — Lex Anagram Coach Modal', () => {
  test.setTimeout(180000); // 3 min timeout

  test('full anagram coaching modal flow — stats, chart, AI sections, PDF', async ({ page }) => {
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

    // Step 1: Click "Lex Anagram Coach" button
    const lexBtn = page.locator('#LexAnagram');
    await expect(lexBtn).toBeVisible({ timeout: 15000 });
    await lexBtn.click();

    // Step 2: Verify modal appears
    const modal = page.locator('#lex-anagram-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Step 3: Check modal title
    await expect(page.locator('#lex-modal-title')).toContainText('Lex Anagram Coach');

    // Step 4: Wait for AI analysis to load (loading spinner disappears, result shows)
    await expect(page.locator('#lex-anagram-loading')).toBeHidden({ timeout: 60000 });
    await expect(page.locator('#lex-anagram-result')).toBeVisible({ timeout: 5000 });

    // Step 5: Check statistics tiles are present
    const statsBar = page.locator('#lex-stats-bar');
    await expect(statsBar).toBeVisible();
    await expect(page.locator('#lex-stat-games')).toBeVisible();
    await expect(page.locator('#lex-stat-rate')).toBeVisible();
    await expect(page.locator('#lex-stat-streak')).toBeVisible();
    await expect(page.locator('#lex-stat-avg-attempts')).toBeVisible();

    // Step 6: Check performance chart is present
    const graphSection = page.locator('#lex-anagram-graph-section');
    await expect(graphSection).toBeVisible();
    await expect(page.locator('#lex-anagram-graph')).toBeVisible(); // canvas element

    // Step 7: Check AI coaching text contains required sections
    const analysisText = page.locator('#lex-analysis-text');
    await expect(analysisText).toBeVisible();
    const text = await analysisText.textContent() || '';

    // Verify all required coaching sections are present
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

    // Step 8: Check Game-by-Game Analysis section
    const gamesSection = page.locator('#lex-anagram-games');
    await expect(gamesSection).toBeVisible();
    const gamesCount = page.locator('#lex-anagram-games-count');
    await expect(gamesCount).toBeVisible();
    // Verify at least some game entries are rendered
    const gameEntries = page.locator('#lex-anagram-games-list > div');
    const entryCount = await gameEntries.count();
    expect(entryCount).toBeGreaterThan(0);

    // Step 9: Check Further Exploration section has at least one link
    const linksSection = page.locator('#lex-anagram-links');
    await expect(linksSection).toBeVisible();
    const explorationLinks = linksSection.locator('a');
    const linkCount = await explorationLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Step 10: Check PDF download and Save to Library buttons exist
    const modalBody = page.locator('#lex-anagram-modal');
    const downloadBtn = modalBody.locator('button', { hasText: 'Download PDF' });
    await expect(downloadBtn).toBeVisible({ timeout: 5000 });

    // Step 11: Click Download PDF and verify it triggers
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      downloadBtn.click(),
    ]);

    // Verify filename pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^lex-anagram-report-\d{4}-\d{2}-\d{2}\.pdf$/);

    // Step 12: Save to Library button should appear after download
    const saveBtn = modalBody.locator('button', { hasText: 'Save to Library' });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });
});
