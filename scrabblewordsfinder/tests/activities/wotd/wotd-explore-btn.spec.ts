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

// Mock WOTD API response without enriched content
const WOTD_WITHOUT_ENRICHED = {
  word: {
    word: 'HELLO',
    meaning: 'A greeting.',
    date: '2026-06-23',
  },
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
};

// ── Explore WOTD Button — Positive ───────────────────────────────────────

test.describe('Explore WOTD Button — Positive', () => {
  test('Explore button becomes visible when enriched data exists', async ({ page }) => {
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

    await expect(page.locator('#wotd-explore-btn')).toBeVisible();
  });

  test('Explore button contains correct label text', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-explore-btn:not(.hidden)', { timeout: 8000 });

    await expect(page.locator('#wotd-explore-btn')).toContainText('Explore WOTD');
  });

  test('clicking Explore button reveals the enriched content section', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-explore-btn:not(.hidden)', { timeout: 8000 });

    // Enriched content should be hidden before clicking
    await expect(page.locator('#wotd-enriched')).not.toBeVisible();

    await page.locator('#wotd-explore-btn').click();

    // Enriched content should now be visible
    await expect(page.locator('#wotd-enriched')).toBeVisible();
  });

  test('clicking Explore button hides the button itself', async ({ page }) => {
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

    await expect(page.locator('#wotd-explore-btn')).not.toBeVisible();
  });

  test('enriched content shows fun fact, origin, example, spelling tip, and cultural note', async ({ page }) => {
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

    await expect(page.locator('#wotd-enriched')).toBeVisible();
    await expect(page.locator('.wotd-fact-text')).toContainText('Don Quixote');
    await expect(page.locator('.wotd-origin-text')).toContainText('Spanish');
    await expect(page.locator('.wotd-usage-text')).toContainText('quixotic quest');
    await expect(page.locator('.wotd-spelling-text')).toContainText('QUI + X + OTIC');
    await expect(page.locator('.wotd-cultural-text')).toContainText('Cervantes');
  });
});

// ── Explore WOTD Button — Persistence ────────────────────────────────────

test.describe('Explore WOTD Button — Persistence', () => {
  test('after clicking Explore, reloading the page shows enriched content directly (no button)', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-explore-btn:not(.hidden)', { timeout: 8000 });

    // Click Explore
    await page.locator('#wotd-explore-btn').click();
    await expect(page.locator('#wotd-enriched')).toBeVisible();

    // Reload the page — button should stay hidden, enriched shows directly
    await page.reload();
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#wotd-explore-btn')).not.toBeVisible();
    await expect(page.locator('#wotd-enriched')).toBeVisible();
  });

  test('Explore button reappears for a new day (different WOTD date)', async ({ page }) => {
    // Pre-seed localStorage with yesterday's explored date (URL-keyed)
    await page.addInitScript(() => {
      localStorage.setItem('swf-wotd-explored:/activities/', '2026-06-22');
    });

    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITH_ENRICHED), // date is 2026-06-23
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Button should be visible because the explored date (22nd) != today's WOTD date (23rd)
    await expect(page.locator('#wotd-explore-btn')).toBeVisible();
  });

  test('clicking Explore stores the WOTD date in localStorage keyed by URL', async ({ page }) => {
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

    const stored = await page.evaluate(() => localStorage.getItem('swf-wotd-explored:/activities/'));
    expect(stored).toBe('2026-06-23');
  });
});

// ── Explore WOTD Button — Negative ───────────────────────────────────────

test.describe('Explore WOTD Button — Negative', () => {
  test('Explore button stays hidden when no enriched data exists', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITHOUT_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#wotd-explore-btn')).not.toBeVisible();
  });

  test('enriched content section stays hidden when no enriched data exists', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WOTD_WITHOUT_ENRICHED),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#wotd-enriched')).not.toBeVisible();
  });

  test('no duplicate #wotd-explore-btn elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-explore-btn')).toHaveCount(1);
  });

  test('no JavaScript errors when clicking Explore button', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

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

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
