import { test, expect } from '@playwright/test';

/**
 * AI_Tests — Lex Quiz Coach (Live, Test User)
 *
 * Uses Raj's live UID (716fd02b-9d37-4a16-b2f1-4c1312ead857) to impersonate
 * the Test User and verify that the Lex Quiz Coach returns real coaching data
 * from existing quiz history on the live database.
 *
 * This test runs against LIVE (www.scrabblewordsfinder.com) and is READ-ONLY —
 * it does NOT play new quiz rounds, only opens the coach modal to verify the response.
 *
 * PASS = graph, time commentary, and game-by-game analysis are all present
 * FAIL = any of those elements are missing (indicates API failure or no history)
 */

const LIVE_URL = 'https://www.scrabblewordsfinder.com';
const TEST_USER_UID = '716fd02b-9d37-4a16-b2f1-4c1312ead857';

test.describe('AI_Tests — Lex Quiz Coach (Live Test User)', () => {

  test.describe('Positive Tests', () => {

    test('Lex Quiz Coach shows graph, time commentary, and game-by-game analysis for Test User', async ({ page }) => {
      test.setTimeout(60000);

      // Navigate to activities page on live
      await page.goto(`${LIVE_URL}/activities/`);
      await page.waitForTimeout(1000);

      // Inject the Test User UID into localStorage
      await page.evaluate((uid) => {
        localStorage.setItem('swf-uid', uid);
      }, TEST_USER_UID);

      // Reload so scripts pick up the UID
      await page.reload();
      await page.waitForTimeout(1500);

      // Click Lex Quiz Coach button
      const lexBtn = page.locator('#LexQuiz');
      await lexBtn.waitFor({ state: 'visible', timeout: 10000 });
      await lexBtn.click();

      // Wait for modal to appear
      await page.locator('#lex-quiz-modal').waitFor({ state: 'visible', timeout: 5000 });

      // Wait for loading to complete
      await page.locator('#lex-quiz-loading').waitFor({ state: 'hidden', timeout: 30000 });
      await page.locator('#lex-quiz-result').waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(1000);

      // CHECK 1: Performance graph section is visible
      const graphSection = page.locator('#lex-quiz-graph-section');
      await expect(graphSection, 'Performance graph should be visible for Test User').toBeVisible();

      // CHECK 2: Time commentary is visible with content
      const timeCommentary = page.locator('#lex-quiz-time-commentary');
      await expect(timeCommentary, 'Time commentary should be visible').toBeVisible();
      const timeText = await page.locator('#lex-quiz-time-commentary-text').textContent();
      expect(timeText!.length, 'Time commentary should have meaningful content').toBeGreaterThan(10);

      // CHECK 3: Game-by-game analysis is visible with cards
      const gamesSection = page.locator('#lex-quiz-games');
      await expect(gamesSection, 'Game-by-game analysis should be visible').toBeVisible();
      const cardCount = await page.locator('#lex-quiz-games-list > div').count();
      expect(cardCount, 'Should have game analysis cards').toBeGreaterThanOrEqual(1);
    });

    test('Lex Quiz Coach stats bar shows accurate data for Test User', async ({ page }) => {
      test.setTimeout(60000);

      await page.goto(`${LIVE_URL}/activities/`);
      await page.waitForTimeout(1000);

      // Inject Test User UID
      await page.evaluate((uid) => {
        localStorage.setItem('swf-uid', uid);
      }, TEST_USER_UID);
      await page.reload();
      await page.waitForTimeout(1500);

      // Open coach
      await page.locator('#LexQuiz').click();
      await page.locator('#lex-quiz-modal').waitFor({ state: 'visible', timeout: 5000 });
      await page.locator('#lex-quiz-loading').waitFor({ state: 'hidden', timeout: 30000 });
      await page.locator('#lex-quiz-result').waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(1000);

      // Stats bar visible with real data
      await expect(page.locator('#lex-quiz-stats-bar')).toBeVisible();

      // Games count should be > 0 (Test User has history)
      const countText = await page.locator('#lex-quiz-stat-games').textContent();
      expect(parseInt(countText!), 'Test User should have quiz games').toBeGreaterThan(0);

      // Accuracy is a percentage
      const accText = await page.locator('#lex-quiz-stat-accuracy').textContent();
      expect(accText, 'Accuracy should show percentage').toMatch(/\d+%/);

      // Perfect count is a number
      const perfectText = await page.locator('#lex-quiz-stat-perfect').textContent();
      expect(parseInt(perfectText!)).toBeGreaterThanOrEqual(0);

      // Timing stats populated
      const fastest = await page.locator('#lex-quiz-stat-fastest').textContent();
      expect(fastest, 'Fastest time should show seconds').toMatch(/\d+s/);

      const slowest = await page.locator('#lex-quiz-stat-slowest').textContent();
      expect(slowest, 'Slowest time should show seconds').toMatch(/\d+s/);

      const avgTime = await page.locator('#lex-quiz-stat-avgtime').textContent();
      expect(avgTime, 'Average time should show seconds').toMatch(/\d+s/);
    });

    test('Lex Quiz Coach AI analysis text is non-empty for Test User', async ({ page }) => {
      test.setTimeout(60000);

      await page.goto(`${LIVE_URL}/activities/`);
      await page.waitForTimeout(1000);

      await page.evaluate((uid) => {
        localStorage.setItem('swf-uid', uid);
      }, TEST_USER_UID);
      await page.reload();
      await page.waitForTimeout(1500);

      await page.locator('#LexQuiz').click();
      await page.locator('#lex-quiz-modal').waitFor({ state: 'visible', timeout: 5000 });
      await page.locator('#lex-quiz-loading').waitFor({ state: 'hidden', timeout: 30000 });
      await page.locator('#lex-quiz-result').waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(1000);

      // AI analysis text should have meaningful coaching content
      const analysisText = await page.locator('#lex-quiz-analysis-text').textContent();
      expect(analysisText!.length, 'AI analysis should be substantial').toBeGreaterThan(50);

      // Should not be an error message
      expect(analysisText).not.toContain('error');
      expect(analysisText).not.toContain('unavailable');
    });

  });

  test.describe('Negative Tests', () => {

    test('Lex Quiz Coach does not show error state for Test User', async ({ page }) => {
      test.setTimeout(60000);

      await page.goto(`${LIVE_URL}/activities/`);
      await page.waitForTimeout(1000);

      await page.evaluate((uid) => {
        localStorage.setItem('swf-uid', uid);
      }, TEST_USER_UID);
      await page.reload();
      await page.waitForTimeout(1500);

      await page.locator('#LexQuiz').click();
      await page.locator('#lex-quiz-modal').waitFor({ state: 'visible', timeout: 5000 });
      await page.locator('#lex-quiz-loading').waitFor({ state: 'hidden', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Error state should NOT be visible
      const isErrorVisible = await page.locator('#lex-quiz-error').isVisible();
      expect(isErrorVisible, 'Error panel should not be visible for valid user').toBe(false);
    });

    test('no console errors when loading Quiz Coach for Test User', async ({ page }) => {
      test.setTimeout(60000);
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(`${LIVE_URL}/activities/`);
      await page.waitForTimeout(1000);

      await page.evaluate((uid) => {
        localStorage.setItem('swf-uid', uid);
      }, TEST_USER_UID);
      await page.reload();
      await page.waitForTimeout(1500);

      await page.locator('#LexQuiz').click();
      await page.locator('#lex-quiz-modal').waitFor({ state: 'visible', timeout: 5000 });
      await page.locator('#lex-quiz-loading').waitFor({ state: 'hidden', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Filter non-critical errors
      const criticalErrors = errors.filter(e =>
        !e.includes('net::') &&
        !e.includes('adsbygoogle') &&
        !e.includes('Failed to fetch') &&
        !e.includes('ResizeObserver') &&
        !e.includes('googletag')
      );
      expect(criticalErrors, 'No critical console errors').toHaveLength(0);
    });

  });

});
