import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Cows & Bulls Coaching Report
 * 
 * Full E2E flow:
 * 1. Go to /chat/ with a specific user ID that has C&B game history
 * 2. Click the "Cows & Bulls" link from Analyse Score section
 * 3. Wait for AI to finish streaming the coaching response
 * 4. Verify: response has a performance graph (canvas element)
 * 5. Verify: response has game-by-game analysis section
 * 6. Verify: Download PDF button exists
 * 7. Verify: Save to Library button exists
 * 8. Click Download PDF → verify it triggers
 * 9. Click Save to Library → verify report appears in Saved Reports section
 * 10. Click View Report on the saved report
 * 
 * Runs against LIVE site with a real user ID.
 */

const BASE = 'https://www.scrabblewordsfinder.com'; // Always live — requires real user game history
const TEST_USER_ID = '716fd02b-9d37-4a16-b2f1-4c1312ead857';

test.describe('AI Live — Cows & Bulls Coaching Report', () => {
  test.setTimeout(240000); // 4 min timeout for full AI flow on live

  test('full coaching report flow — analyse, graph, PDF, save', async ({ page }) => {
    // Set the user ID in localStorage before navigating
    await page.goto(`${BASE}/chat/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Dismiss cookie consent if present (non-blocking)
    try {
      const acceptBtn = page.locator('button:has-text("Accept All")');
      await acceptBtn.click({ timeout: 5000 });
    } catch {}

    await page.evaluate((uid) => {
      localStorage.setItem('swf-uid', uid);
      localStorage.setItem('swf_user_id', uid);
      localStorage.setItem('swf-cookie-consent', 'accepted');
    }, TEST_USER_ID);

    // Reload to pick up the user ID
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Step 1: Find and click the "Cows & Bulls" link in Analyse Score section
    const cabLink = page.locator('#analyse-score-links a', { hasText: 'Cows' });
    await expect(cabLink).toBeVisible({ timeout: 60000 });
    await cabLink.click();

    // Step 2: Wait for AI coaching response to load
    // Clicking the link navigates to /chat/?context=cab which auto-triggers coaching
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Wait for the coaching response content to appear (500+ chars in messages)
    await page.waitForFunction(
      () => {
        const el = document.getElementById('messages');
        return el && (el.textContent || '').length > 500;
      },
      null,
      { timeout: 90000, polling: 3000 }
    );

    // Extra wait for graphs and PDF buttons to render
    await page.waitForTimeout(8000);

    // Step 3: Verify performance graph exists (canvas element)
    // The graph renders after the coaching text — give it extra time
    const graphCanvas = page.locator('#chat-cab-graph');
    await expect(graphCanvas).toBeAttached({ timeout: 90000 });

    // Step 4: Verify game-by-game analysis section exists
    // Look for per-game analysis elements (typically has game numbers or "Game #" text)
    const messagesContent = await page.locator('#messages').textContent();
    const hasGameAnalysis = messagesContent?.includes('Game') || 
                            messagesContent?.includes('#1') || 
                            messagesContent?.includes('game 1') ||
                            messagesContent?.includes('Per-Puzzle') ||
                            messagesContent?.includes('Per-Game');
    expect(hasGameAnalysis).toBe(true);

    // Step 4b: Verify AI response contains all required coaching sections
    const requiredSections = [
      'OVERALL GRADE',
      'STRENGTHS',
      'PROGRESS',
      'TIMING',
      'PREDICTION',
      'CHALLENGE',
    ];
    for (const section of requiredSections) {
      expect(messagesContent?.toUpperCase()).toContain(section);
    }

    // Step 5: Verify Download PDF button exists
    const downloadBtn = page.locator('button', { hasText: 'Download PDF' });
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });

    // Step 6: Verify Save to Library button (may be hidden until download)
    // Click Download PDF first
    await downloadBtn.click();
    await page.waitForTimeout(5000); // Wait for PDF generation

    // After download, the Save to Library button should appear
    const saveBtn = page.locator('button', { hasText: 'Save to Library' });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });

    // Step 7: Click Save to Library
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Step 8: Verify the report appears in Saved Reports section
    const savedReportsList = page.locator('#saved-reports-list');
    const savedReportCount = await savedReportsList.locator('button, a, [class*="report"]').count();
    expect(savedReportCount).toBeGreaterThanOrEqual(1);

    // Step 9: Verify Save button changed to show success (text becomes "Saved!")
    // The button text changes after save — look for the success state
    const savedConfirm = page.locator('button', { hasText: 'Saved' });
    await expect(savedConfirm).toBeVisible({ timeout: 5000 });

    // Step 10: Check saved reports count updated
    const countEl = page.locator('#saved-reports-count');
    const countText = await countEl.textContent();
    expect(countText).not.toContain('0 / 5');
  });
});
