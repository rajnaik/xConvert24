import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const QUIZ_HISTORY_URL = `${BASE_URL}/quiz-history/`;

// ── Quiz History Page — Positive ─────────────────────────────────────────

test.describe('Quiz History Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    await expect(page).toHaveTitle(/Quiz History/);
  });

  test('page heading is visible', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    const heading = page.locator('main h1');
    await expect(heading).toContainText('Quiz History');
  });

  test('table has all 7 column headers including Track', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    const table = page.locator('table');
    await expect(table).toHaveCount(1);

    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(7);

    await expect(headers.nth(0)).toHaveText('#');
    await expect(headers.nth(1)).toHaveText('Score');
    await expect(headers.nth(2)).toHaveText('Time Used');
    await expect(headers.nth(3)).toHaveText('Timer');
    await expect(headers.nth(4)).toHaveText('Result');
    await expect(headers.nth(5)).toHaveText('Date');
    await expect(headers.nth(6)).toHaveText('Track');
  });

  test('Track column header is center-aligned', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    const trackHeader = page.locator('table thead th:nth-child(7)');
    await expect(trackHeader).toHaveClass(/text-center/);
  });

  test('back link to activities exists', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    const backLink = page.locator('main a.text-blue-400[href="/activities/"]');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Back to Activities');
  });

  test('shows empty state when no user ID in localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(QUIZ_HISTORY_URL);
    const emptyState = page.locator('#qh-empty');
    await expect(emptyState).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(emptyState).toContainText('No Quiz History Yet');
  });

  test('empty state has link to activities page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-empty:not(.hidden)', { timeout: 5000 });
    const playLink = page.locator('#qh-empty a[href="/activities/"]');
    await expect(playLink).toBeVisible();
    await expect(playLink).toContainText('Play Word Quiz');
  });
});

// ── Quiz History Page — Negative ─────────────────────────────────────────

test.describe('Quiz History Page — Negative', () => {
  test('no duplicate table elements on page', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    const tables = page.locator('table');
    await expect(tables).toHaveCount(1);
  });

  test('no JS errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e =>
      e.toLowerCase().includes('typeerror') ||
      e.toLowerCase().includes('referenceerror')
    )).toHaveLength(0);
  });

  test('loading state disappears after data loads or empty state shows', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(QUIZ_HISTORY_URL);
    const loading = page.locator('#qh-loading');
    // Loading should be hidden after page finishes init
    await expect(loading).toHaveClass(/hidden/, { timeout: 5000 });
  });

  test('content and empty states are mutually exclusive', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForTimeout(2000);
    const contentHidden = await page.locator('#qh-content').evaluate(el => el.classList.contains('hidden'));
    const emptyHidden = await page.locator('#qh-empty').evaluate(el => el.classList.contains('hidden'));
    // Exactly one should be visible (not both, not neither)
    expect(contentHidden !== emptyHidden).toBe(true);
  });

  test('Track column header does not appear more than once', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    const trackHeaders = page.locator('table thead th', { hasText: 'Track' });
    await expect(trackHeaders).toHaveCount(1);
  });
});
