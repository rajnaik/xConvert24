import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── DRC Server-Side 409 Duplicate Handling — Positive ───────────────────

test.describe('DRC Server 409 Duplicate — Positive', () => {
  test('shows duplicate error when server returns 409', async ({ page }) => {
    // Mock GET to return rack with empty userScores (simulates stale cache scenario)
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [],
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          }),
        });
      } else if (route.request().method() === 'POST') {
        // Server rejects as duplicate
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'duplicate', message: 'You already submitted this word today' }),
        });
      }
    });
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    // Mock dictionary API
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'test' }] }] }]) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-409-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // Submit a word that the server says is already submitted
    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    // Wait for feedback (async due to fetchMeaning wrapping the POST)
    const fb = page.locator('#drc-feedback');
    await expect(fb).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(fb).toContainText("You already submitted");
    await expect(fb).toContainText('CAT');
  });

  test('after 409, same word is caught client-side on second attempt', async ({ page }) => {
    let postCount = 0;
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [],
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          }),
        });
      } else if (route.request().method() === 'POST') {
        postCount++;
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'duplicate' }),
        });
      }
    });
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'test' }] }] }]) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-409-retry-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // First attempt — server returns 409
    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');
    const fb = page.locator('#drc-feedback');
    await expect(fb).toContainText("You already submitted", { timeout: 5000 });

    // Second attempt — should be caught client-side (no new POST)
    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');
    await expect(fb).toContainText("You already submitted");
    // Only 1 POST should have been made (second was caught client-side)
    expect(postCount).toBe(1);
  });
});

// ── DRC Server 409 Duplicate — Negative ─────────────────────────────────

test.describe('DRC Server 409 Duplicate — Negative', () => {
  test('successful submission (200) still adds word and shows success', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [],
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          }),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'a feline' }] }] }]) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-success-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    const fb = page.locator('#drc-feedback');
    await expect(fb).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(fb).toContainText('CAT');
    await expect(fb).toContainText('pts');
    // Should show green success styling
    await expect(fb).toHaveClass(/bg-green-900/);
  });

  test('server error (500) shows failure message, not duplicate message', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [],
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          }),
        });
      } else if (route.request().method() === 'POST') {
        route.abort('failed');
      }
    });
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'test' }] }] }]) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-error-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    const fb = page.locator('#drc-feedback');
    await expect(fb).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(fb).toContainText('Failed to submit');
    await expect(fb).not.toContainText('already submitted');
  });
});
