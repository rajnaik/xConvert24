import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB (Cows and Bulls) — timer_duration API Payload Tests
 * Verifies the POST /api/cab/ body includes/excludes `timer_duration`
 * depending on whether timer mode is active.
 */

test.describe('CaB timer_duration Payload — Positive', () => {
  test('POST body includes timer_duration when timer mode is active', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timer-payload');
      localStorage.setItem('cab-timer-enabled', '1');
      localStorage.setItem('cab-timer-secs', '45');
      localStorage.setItem('cab-word-length', '5');
    });

    let capturedBody: any = null;

    await page.route('**/api/cab/', async (route, request) => {
      if (request.method() === 'POST') {
        capturedBody = JSON.parse(request.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 100, wordId: 20, length: 5 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(ACTIVITIES_URL);

    // Start game via the Start button (timer mode pre-loaded from localStorage)
    await page.locator('#cab-start-btn').click();

    // Verify captured request body
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.length).toBe(5);
    expect(capturedBody.user_id).toBe('test-timer-payload');
    expect(capturedBody.timer_duration).toBe(45);
  });

  test('POST body has timer_duration matching selected countdown value', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timer-30s');
      localStorage.setItem('cab-timer-enabled', '1');
      localStorage.setItem('cab-timer-secs', '30');
      localStorage.setItem('cab-word-length', '4');
    });

    let capturedBody: any = null;

    await page.route('**/api/cab/', async (route, request) => {
      if (request.method() === 'POST') {
        capturedBody = JSON.parse(request.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 101, wordId: 21, length: 4 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(ACTIVITIES_URL);
    await page.locator('#cab-start-btn').click();

    expect(capturedBody).not.toBeNull();
    expect(capturedBody.timer_duration).toBe(30);
  });
});

test.describe('CaB timer_duration Payload — Negative', () => {
  test('POST body has timer_duration as null when timer mode is off', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-timer-payload');
    });

    let capturedBody: any = null;

    await page.route('**/api/cab/', async (route, request) => {
      if (request.method() === 'POST') {
        capturedBody = JSON.parse(request.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 102, wordId: 22, length: 5 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(ACTIVITIES_URL);

    // Timer is off by default — click word length to start game directly
    await page.locator('.cab-len-btn[data-len="5"]').click();

    // Wait for request to have been captured
    await expect(page.locator('#cab-game')).not.toHaveClass(/hidden/, { timeout: 5000 });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody.length).toBe(5);
    expect(capturedBody.user_id).toBe('test-no-timer-payload');
    expect(capturedBody.timer_duration).toBeNull();
  });

  test('POST body does not include unexpected timer fields', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-clean-payload');
      localStorage.setItem('cab-timer-enabled', '1');
      localStorage.setItem('cab-timer-secs', '60');
      localStorage.setItem('cab-word-length', '6');
    });

    let capturedBody: any = null;

    await page.route('**/api/cab/', async (route, request) => {
      if (request.method() === 'POST') {
        capturedBody = JSON.parse(request.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 103, wordId: 23, length: 6 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(ACTIVITIES_URL);
    await page.locator('#cab-start-btn').click();

    expect(capturedBody).not.toBeNull();
    // Only expected keys should exist
    const keys = Object.keys(capturedBody).sort();
    expect(keys).toEqual(['length', 'timer_duration', 'user_id']);
  });
});
