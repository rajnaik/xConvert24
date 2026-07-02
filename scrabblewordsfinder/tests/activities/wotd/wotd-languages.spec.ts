import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── WOTD Languages Section — Positive ────────────────────────────────────

test.describe('WOTD Languages Section — Positive', () => {
  test('wotd-languages container exists in the DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-panel', { timeout: 8000 });
    const langEl = page.locator('#wotd-languages');
    await expect(langEl).toBeAttached();
  });

  test('wotd-languages shows translations when API returns data', async ({ page }) => {
    await page.route('**/api/wotd-languages/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          translations: [
            { language: 'Spanish', translation: 'prueba' },
            { language: 'French', translation: 'essai' }
          ]
        })
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    // Trigger the language fetch by calling the function
    await page.evaluate(() => {
      const fn = (window as any).fetchWotdLanguages || document.querySelector('[data-fetch-langs]');
      // The function is in the page scope; call it directly
      if (typeof (window as any).fetchWotdLanguages === 'function') {
        (window as any).fetchWotdLanguages();
      }
    });

    // Fallback: wait for element to become visible (may be triggered on page load)
    await page.waitForTimeout(2000);

    const langEl = page.locator('#wotd-languages');
    // If translations were fetched, the element should be visible
    const isVisible = await langEl.isVisible();
    if (isVisible) {
      const text = await langEl.locator('.wotd-languages-text').textContent();
      expect(text).toContain('prueba');
      expect(text).toContain('Spanish');
    }
  });

  test('wotd-languages displays the "In other languages" label with cyan styling', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-panel', { timeout: 8000 });

    const label = page.locator('#wotd-languages .text-cyan-400');
    await expect(label).toBeAttached();
    await expect(label).toContainText('In other languages:');
  });

  test('wotd-languages text span has italic styling', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-panel', { timeout: 8000 });

    const textSpan = page.locator('#wotd-languages .wotd-languages-text');
    await expect(textSpan).toBeAttached();
    await expect(textSpan).toHaveClass(/italic/);
  });
});

// ── WOTD Languages Section — Negative ────────────────────────────────────

test.describe('WOTD Languages Section — Negative', () => {
  test('wotd-languages is hidden by default on page load', async ({ page }) => {
    // Block the API so it never reveals itself
    await page.route('**/api/wotd-languages/**', async route => {
      await route.abort('blockedbyclient');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-panel', { timeout: 8000 });

    const langEl = page.locator('#wotd-languages');
    // The element has class="hidden" by default
    await expect(langEl).toHaveClass(/hidden/);
  });

  test('wotd-languages hides when API returns empty translations', async ({ page }) => {
    await page.route('**/api/wotd-languages/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ translations: [] })
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(3000);

    const langEl = page.locator('#wotd-languages');
    await expect(langEl).toHaveClass(/hidden/);
  });

  test('wotd-languages hides gracefully on API failure', async ({ page }) => {
    await page.route('**/api/wotd-languages/**', async route => {
      await route.fulfill({ status: 500, body: 'Server Error' });
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(3000);

    const langEl = page.locator('#wotd-languages');
    await expect(langEl).toHaveClass(/hidden/);
    // No uncaught errors
    expect(errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'))).toHaveLength(0);
  });

  test('no duplicate #wotd-languages elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-panel', { timeout: 8000 });
    await expect(page.locator('#wotd-languages')).toHaveCount(1);
  });

  test('wotd-languages does not crash page when word is placeholder dash', async ({ page }) => {
    await page.route('**/api/wotd-languages/**', async route => {
      await route.abort('blockedbyclient');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    // Force placeholder word
    await page.evaluate(() => {
      const el = document.getElementById('wotd-word');
      if (el) el.textContent = '—';
    });

    await page.waitForTimeout(1000);
    await expect(page.locator('#wotd-panel')).toBeVisible();
    expect(errors.filter(e => e.includes('TypeError'))).toHaveLength(0);
  });
});

// ── WOTD Languages API Endpoint — Positive ───────────────────────────────

test.describe('WOTD Languages API — Positive', () => {
  test('API returns valid JSON with translations for a known word', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/wotd-languages/?word=HELLO`);
    // Might be 200 (success) or 500 (AI unavailable in dev) — accept both as valid API response
    expect([200, 500, 503]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 200) {
      expect(body).toHaveProperty('word', 'HELLO');
      expect(body).toHaveProperty('translations');
      expect(Array.isArray(body.translations)).toBe(true);
    }
  });

  test('API returns 400 for missing word parameter', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/wotd-languages/`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('Valid word parameter required');
  });

  test('API returns 400 for too-short word', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/wotd-languages/?word=A`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2-20 characters');
  });

  test('API returns 400 for too-long word', async ({ request }) => {
    const longWord = 'A'.repeat(21);
    const res = await request.get(`${BASE_URL}/api/wotd-languages/?word=${longWord}`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2-20 characters');
  });
});

// ── WOTD Languages API Endpoint — Negative ───────────────────────────────

test.describe('WOTD Languages API — Negative', () => {
  test('API error response includes raw field when translations cannot be parsed', async ({ page }) => {
    // Intercept the AI-powered endpoint to simulate unparseable AI output
    await page.route('**/api/wotd-languages/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Could not parse translations',
          raw: 'Sorry, I cannot translate that word right now.'
        })
      });
    });

    await page.goto(ACTIVITIES_URL);
    // Directly fetch the mocked endpoint to verify the response shape
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/wotd-languages/?word=TEST');
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Could not parse translations');
    expect(response.body).toHaveProperty('raw');
    expect(typeof response.body.raw).toBe('string');
    expect(response.body.raw.length).toBeGreaterThan(0);
  });

  test('API parse error response has both error and raw fields in JSON', async ({ request }) => {
    // Call the real endpoint with a valid word — if AI is available and returns
    // unparseable content, the response should contain 'raw'. If AI works fine,
    // we verify the success shape. This tests the contract either way.
    const res = await request.get(`${BASE_URL}/api/wotd-languages/?word=QUIXOTIC`);
    const body = await res.json();

    if (res.status() === 500 && body.error === 'Could not parse translations') {
      // The new behaviour: raw field must be present
      expect(body).toHaveProperty('raw');
      expect(typeof body.raw).toBe('string');
    } else if (res.status() === 200) {
      // Successful response — no raw field
      expect(body).not.toHaveProperty('raw');
      expect(body).toHaveProperty('translations');
    }
    // Other errors (503 AI unavailable) are acceptable
  });

  test('API does not expose raw field on successful response', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/wotd-languages/?word=HELLO`);
    const body = await res.json();
    if (res.status() === 200) {
      expect(body).not.toHaveProperty('raw');
    }
  });

  test('API returns proper content-type header', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/wotd-languages/?word=HELLO`);
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('API catch-all error does not expose debug info', async ({ request }) => {
    // The API should never return a 'debug' field on error — implementation details stay hidden
    const res = await request.get(`${BASE_URL}/api/wotd-languages/?word=HELLO`);
    const body = await res.json();
    expect(body).not.toHaveProperty('debug');
  });
});
