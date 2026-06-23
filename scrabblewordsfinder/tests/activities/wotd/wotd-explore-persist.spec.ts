import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Mock WOTD API response with enriched content
const WOTD_WITH_ENRICHED = {
  word: {
    word: 'QUIXOTIC',
    meaning: 'Exceedingly idealistic; unrealistic and impractical.',
    fun_fact: 'From the character Don Quixote.',
    date: '2026-06-23',
    origin: 'Spanish, from Don Quixote (1605)',
    usage_example: 'His quixotic quest to reform the entire system was admirable but doomed.',
    spelling_tip: 'Remember: QUI + X + OTIC (like exotic without the e)',
    cultural_note: 'Cervantes\' novel inspired the English adjective over 400 years ago.',
  },
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
};

// ── WOTD Explore State Persistence — Positive ────────────────────────────

test.describe('WOTD Explore State Persistence — Positive', () => {
  test('enriched content shows immediately when localStorage has matching explored date (keyed by pathname)', async ({ page }) => {
    // Pre-seed localStorage with the explored date keyed by the page pathname
    await page.addInitScript(() => {
      localStorage.setItem('swf-wotd-explored:/activities/', '2026-06-23');
    });

    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Enriched content should be visible without clicking the button
    await expect(page.locator('#wotd-enriched')).toBeVisible();
  });

  test('Explore button is hidden when localStorage has matching explored date (keyed by pathname)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-wotd-explored:/activities/', '2026-06-23');
    });

    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Button should be hidden since already explored
    await expect(page.locator('#wotd-explore-btn')).not.toBeVisible();
  });

  test('clicking Explore saves the date to localStorage keyed by current pathname', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-explore-btn:not(.hidden)', { timeout: 8000 });

    await page.locator('#wotd-explore-btn').click();
    await page.waitForTimeout(300);

    // Verify localStorage was set with pathname-keyed key
    const stored = await page.evaluate(() => localStorage.getItem('swf-wotd-explored:/activities/'));
    expect(stored).toBe('2026-06-23');
  });

  test('fun fact is hidden before Explore and visible after', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-explore-btn:not(.hidden)', { timeout: 8000 });

    // Fun fact should be inside enriched section (hidden)
    await expect(page.locator('.wotd-fact-text')).not.toBeVisible();

    await page.locator('#wotd-explore-btn').click();

    // Fun fact should now be visible inside the enriched section
    await expect(page.locator('.wotd-fact-text')).toBeVisible();
    await expect(page.locator('.wotd-fact-text')).toContainText('Don Quixote');
  });
});

// ── WOTD Explore State Persistence — Negative ────────────────────────────

test.describe('WOTD Explore State Persistence — Negative', () => {
  test('Explore button shows when localStorage has a different (old) date for this pathname', async ({ page }) => {
    // Pre-seed localStorage with yesterday's date — should NOT auto-show enriched
    await page.addInitScript(() => {
      localStorage.setItem('swf-wotd-explored:/activities/', '2026-06-22');
    });

    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Button should be visible (old date doesn't count)
    await expect(page.locator('#wotd-explore-btn')).toBeVisible();
    // Enriched content should be hidden
    await expect(page.locator('#wotd-enriched')).not.toBeVisible();
  });

  test('enriched content stays hidden when localStorage is empty', async ({ page }) => {
    // No localStorage set at all
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Button should be visible, enriched hidden
    await expect(page.locator('#wotd-explore-btn')).toBeVisible();
    await expect(page.locator('#wotd-enriched')).not.toBeVisible();
  });

  test('explored state from a different pathname does NOT affect this page', async ({ page }) => {
    // Pre-seed localStorage with a DIFFERENT page's explored date
    await page.addInitScript(() => {
      localStorage.setItem('swf-wotd-explored:/some-other-page/', '2026-06-23');
    });

    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Explore button should still be visible — the other page's key doesn't apply here
    await expect(page.locator('#wotd-explore-btn')).toBeVisible();
    await expect(page.locator('#wotd-enriched')).not.toBeVisible();
  });
});
