import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Lex Rack Coach Modal (Activities Page)
 *
 * Full E2E flow:
 * 1. Go to /activities/ with a real user ID that has rack history
 * 2. Click "Lex Rack Coach" button
 * 3. Wait for modal to load with AI analysis
 * 4. Verify modal structure: title, stats, chart
 * 5. Verify AI coaching sections present
 * 6. Verify game-by-game analysis
 * 7. Verify PDF download + save buttons exist
 * 8. Click Download PDF and verify filename
 */

const BASE = 'https://www.scrabblewordsfinder.com'; // Always live — requires real rack history
const TEST_USER_ID = '716fd02b-9d37-4a16-b2f1-4c1312ead857';

test.describe('AI Live — Lex Rack Coach Modal', () => {
  test.setTimeout(180000); // 3 min timeout

  test('full rack coaching modal flow — stats, chart, AI sections, PDF', async ({ page }) => {
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

    // Step 1: Click "Lex Rack Coach" button
    const lexBtn = page.locator('#LexRack');
    await expect(lexBtn).toBeVisible({ timeout: 15000 });
    await lexBtn.click();

    // Step 2: Verify modal appears
    const modal = page.locator('#lex-rack-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Step 3: Check modal title
    await expect(page.locator('#lex-rack-modal-title')).toContainText('Lex Rack Coach');

    // Step 4: Wait for AI analysis to load (loading spinner disappears, result shows)
    await expect(page.locator('#lex-rack-loading')).toBeHidden({ timeout: 60000 });
    await expect(page.locator('#lex-rack-result')).toBeVisible({ timeout: 5000 });

    // Step 5: Check statistics tiles are present
    const statsBar = page.locator('#lex-rack-stats-bar');
    await expect(statsBar).toBeVisible();
    await expect(page.locator('#lex-rack-stat-words')).toBeVisible();
    await expect(page.locator('#lex-rack-stat-avg')).toBeVisible();
    await expect(page.locator('#lex-rack-stat-bingos')).toBeVisible();
    await expect(page.locator('#lex-rack-stat-best')).toBeVisible();

    // Step 6: Check performance chart is present
    const graphSection = page.locator('#lex-rack-graph-section');
    await expect(graphSection).toBeVisible();
    await expect(page.locator('#lex-rack-graph')).toBeVisible(); // canvas element

    // Step 7: Check AI coaching text contains required sections
    const analysisText = page.locator('#lex-rack-analysis-text');
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
    const gamesSection = page.locator('#lex-rack-games');
    await expect(gamesSection).toBeVisible();
    const gamesCount = page.locator('#lex-rack-games-count');
    await expect(gamesCount).toBeVisible();
    // Verify at least some game entries are rendered
    const gameEntries = page.locator('#lex-rack-games-list > div');
    const entryCount = await gameEntries.count();
    expect(entryCount).toBeGreaterThan(0);

    // Step 9: Check PDF download and Save to Library buttons exist
    // Look for the PDF buttons container within the modal body
    const downloadBtn = page.locator('#lex-rack-body button', { hasText: 'Download PDF' });
    await expect(downloadBtn).toBeVisible({ timeout: 5000 });

    // Step 10: Click Download PDF and verify it triggers
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      downloadBtn.click(),
    ]);

    // Verify filename pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^lex-rack-report-\d{4}-\d{2}-\d{2}\.pdf$/);

    // Step 11: Save to Library button should appear after download
    const saveBtn = page.locator('#lex-rack-body button', { hasText: 'Save to Library' });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
  });
});
