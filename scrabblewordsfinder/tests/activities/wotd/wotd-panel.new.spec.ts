import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── WOTD Panel Structure — Positive ──────────────────────────────────────

test.describe('WOTD Panel Structure — Positive', () => {
  test('WOTD panel container is visible on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-panel')).toBeVisible();
  });

  test('WOTD heading shows "Word of the Day" with emoji', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const heading = page.locator('h2').filter({ hasText: 'Word of the Day' });
    await expect(heading).toBeVisible();
  });

  test('WOTD word element displays a word or placeholder', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    const text = await page.locator('#wotd-word').textContent();
    expect(text).toBeTruthy();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('WOTD meaning element is visible', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-meaning')).toBeVisible();
  });

  test('WOTD countdown timer is visible', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-countdown', { timeout: 8000 });
    await page.waitForTimeout(1500); // Allow interval to fire
    const countdownText = await page.locator('#wotd-countdown').textContent();
    expect(countdownText).toMatch(/Next WOTD in \d+h \d+m \d+s|New word!/);
  });

  test('Lookup button is visible and clickable', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-fetch-meaning', { timeout: 8000 });
    await expect(page.locator('#wotd-fetch-meaning')).toBeVisible();
    await expect(page.locator('#wotd-fetch-meaning')).toContainText('Lookup');
  });

  test('WOTD star indicator is present in the heading', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const starIndicator = page.locator('.star-indicator[data-game="wotd"]');
    await expect(starIndicator).toBeVisible();
  });
});

// ── WOTD Panel Structure — Negative ──────────────────────────────────────

test.describe('WOTD Panel Structure — Negative', () => {
  test('no duplicate #wotd-panel elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-panel')).toHaveCount(1);
  });

  test('no duplicate #wotd-word elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-word')).toHaveCount(1);
  });

  test('no duplicate #wotd-fetch-meaning buttons exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-fetch-meaning')).toHaveCount(1);
  });

  test('no JS errors on page load with WOTD panel', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(3000);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('WOTD panel does not crash when localStorage is empty', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    await expect(page.locator('#wotd-panel')).toBeVisible();
    expect(errors.filter(e => e.includes('TypeError'))).toHaveLength(0);
  });
});

// ── WOTD Lookup Button — Positive ────────────────────────────────────────

test.describe('WOTD Lookup Button — Positive', () => {
  test('clicking Lookup fetches and displays a definition', async ({ page }) => {
    // Mock the dictionary API to return a known definition
    await page.route('**/api.dictionaryapi.dev/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          meanings: [{
            definitions: [{ definition: 'A test definition for the word' }]
          }]
        }])
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    await page.locator('#wotd-fetch-meaning').click();
    await page.waitForTimeout(1000);

    const meaning = await page.locator('#wotd-meaning').textContent();
    expect(meaning).toContain('A test definition for the word');
  });

  test('Lookup button shows loading state while fetching', async ({ page }) => {
    // Delay the dictionary API response to observe loading state
    await page.route('**/api.dictionaryapi.dev/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          meanings: [{
            definitions: [{ definition: 'Delayed definition' }]
          }]
        }])
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    await page.locator('#wotd-fetch-meaning').click();
    // Should show "..." while loading
    await expect(page.locator('#wotd-fetch-meaning')).toContainText('...');
  });

  test('Lookup button text resets to "📖 Lookup" after fetch completes', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          meanings: [{
            definitions: [{ definition: 'Some definition' }]
          }]
        }])
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    await page.locator('#wotd-fetch-meaning').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('#wotd-fetch-meaning')).toContainText('Lookup');
  });
});

// ── WOTD Lookup Button — Negative ────────────────────────────────────────

test.describe('WOTD Lookup Button — Negative', () => {
  test('Lookup does nothing when word is placeholder dash', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-fetch-meaning', { timeout: 8000 });

    // Force the placeholder
    await page.evaluate(() => {
      const el = document.getElementById('wotd-word');
      if (el) el.textContent = '—';
    });

    const meaningBefore = await page.locator('#wotd-meaning').textContent();
    await page.locator('#wotd-fetch-meaning').click();
    await page.waitForTimeout(500);

    const meaningAfter = await page.locator('#wotd-meaning').textContent();
    expect(meaningAfter).toBe(meaningBefore);
  });

  test('Lookup handles dictionary API failure gracefully', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', async route => {
      await route.fulfill({ status: 404, body: '{}' });
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    await page.locator('#wotd-fetch-meaning').click();
    await page.waitForTimeout(1000);

    // No crash — button resets and page remains usable
    await expect(page.locator('#wotd-fetch-meaning')).toContainText('Lookup');
    expect(errors.filter(e => e.includes('Uncaught'))).toHaveLength(0);
  });

  test('Lookup handles network timeout gracefully', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', async route => {
      await route.abort('timedout');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    await page.locator('#wotd-fetch-meaning').click();
    await page.waitForTimeout(1500);

    // Button should reset — no crash
    await expect(page.locator('#wotd-fetch-meaning')).toContainText('Lookup');
    expect(errors.filter(e => e.includes('Uncaught'))).toHaveLength(0);
  });
});

// ── WOTD Countdown Timer — Positive ──────────────────────────────────────

test.describe('WOTD Countdown Timer — Positive', () => {
  test('countdown updates every second (value changes within 2s)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-countdown', { timeout: 8000 });
    await page.waitForTimeout(1200); // Let first update fire

    const firstValue = await page.locator('#wotd-countdown').textContent();
    await page.waitForTimeout(1100);
    const secondValue = await page.locator('#wotd-countdown').textContent();

    // If both are "New word!" that's fine — but otherwise they must differ
    if (firstValue !== 'New word!') {
      expect(secondValue).not.toBe(firstValue);
    }
  });

  test('countdown format matches expected pattern', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-countdown', { timeout: 8000 });
    await page.waitForTimeout(1500);

    const text = await page.locator('#wotd-countdown').textContent();
    // Should be "Next WOTD in Xh XXm XXs" or "New word!"
    expect(text).toMatch(/Next WOTD in \d+h \d{2}m \d{2}s|New word!/);
  });
});

// ── WOTD Countdown Timer — Negative ──────────────────────────────────────

test.describe('WOTD Countdown Timer — Negative', () => {
  test('countdown does not show NaN or undefined', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-countdown', { timeout: 8000 });
    await page.waitForTimeout(1500);

    const text = await page.locator('#wotd-countdown').textContent();
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
  });

  test('countdown element is unique (no duplicates)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-countdown')).toHaveCount(1);
  });
});
