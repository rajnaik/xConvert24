import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB (Cows and Bulls) — Star Award on Solve
 * Tests that window.__awardStar('cab') is called when the player wins.
 */

test.describe('CaB Star Award on Solve — Positive', () => {
  test('cab star is saved to localStorage when game is won', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-star');
    });

    // Mock CaB API: start game returns a 4-letter word (ID: 1)
    await page.route('**/api/cab/', async (route, request) => {
      const method = request.method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 99, wordId: 1, length: 4 }),
        });
      } else if (method === 'PUT') {
        // Always return a winning guess (4 bulls)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            bulls: 4,
            cows: 0,
            feedback: ['bull', 'bull', 'bull', 'bull'],
            word: 'TEST',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock daily-progress API to prevent real DB calls
    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto(ACTIVITIES_URL);

    // Start a 4-letter game
    await page.locator('.cab-len-btn[data-len="4"]').click();

    // Wait for input boxes to appear
    await page.waitForSelector('.cab-letter-input');

    // Type a 4-letter guess
    const inputs = page.locator('.cab-letter-input');
    await inputs.nth(0).fill('T');
    await inputs.nth(1).fill('E');
    await inputs.nth(2).fill('S');
    await inputs.nth(3).fill('T');

    // Submit guess
    await page.locator('#cab-submit').click();

    // Wait for result to show
    await page.waitForSelector('#cab-result:not(.hidden)', { timeout: 5000 });

    // Verify 'cab' was saved to the stars localStorage key
    const today = new Date().toISOString().split('T')[0];
    const starsKey = 'swf-stars-earned-' + today;
    const stars = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) || '[]');
    }, starsKey);
    expect(stars).toContain('cab');
  });

  test('star bar receives swf-star-earned event with game=cab on win', async ({ page }) => {
    // Track custom event dispatches
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-event');
      (window as any).__starEvents = [] as string[];
      window.addEventListener('swf-star-earned', (e: any) => {
        (window as any).__starEvents.push(e.detail.game);
      });
    });

    await page.route('**/api/cab/', async (route, request) => {
      const method = request.method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 100, wordId: 2, length: 4 }),
        });
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            bulls: 4,
            cows: 0,
            feedback: ['bull', 'bull', 'bull', 'bull'],
            word: 'WORD',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto(ACTIVITIES_URL);

    // Start game
    await page.locator('.cab-len-btn[data-len="4"]').click();
    await page.waitForSelector('.cab-letter-input');

    // Guess
    const inputs = page.locator('.cab-letter-input');
    await inputs.nth(0).fill('W');
    await inputs.nth(1).fill('O');
    await inputs.nth(2).fill('R');
    await inputs.nth(3).fill('D');
    await page.locator('#cab-submit').click();

    await page.waitForSelector('#cab-result:not(.hidden)', { timeout: 5000 });

    // Verify custom event fired
    const events = await page.evaluate(() => (window as any).__starEvents);
    expect(events).toContain('cab');
  });
});

test.describe('CaB Star Award on Solve — Negative', () => {
  test('cab star is NOT saved to localStorage when guess is incorrect', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-nostar');
    });

    await page.route('**/api/cab/', async (route, request) => {
      const method = request.method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 101, wordId: 3, length: 4 }),
        });
      } else if (method === 'PUT') {
        // Partial match — NOT a win
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            bulls: 2,
            cows: 1,
            feedback: ['bull', 'cow', 'bull', 'miss'],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto(ACTIVITIES_URL);

    // Start game
    await page.locator('.cab-len-btn[data-len="4"]').click();
    await page.waitForSelector('.cab-letter-input');

    // Submit a wrong guess
    const inputs = page.locator('.cab-letter-input');
    await inputs.nth(0).fill('A');
    await inputs.nth(1).fill('B');
    await inputs.nth(2).fill('C');
    await inputs.nth(3).fill('D');
    await page.locator('#cab-submit').click();

    // Wait for history row to appear (confirms guess processed)
    await page.waitForSelector('#cab-history > div', { timeout: 5000 });

    // 'cab' should NOT be in localStorage stars
    const today = new Date().toISOString().split('T')[0];
    const starsKey = 'swf-stars-earned-' + today;
    const stars = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) || '[]');
    }, starsKey);
    expect(stars).not.toContain('cab');
  });

  test('no JavaScript errors during CaB star award flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-noerr');
    });

    await page.route('**/api/cab/', async (route, request) => {
      const method = request.method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 102, wordId: 4, length: 4 }),
        });
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            bulls: 4,
            cows: 0,
            feedback: ['bull', 'bull', 'bull', 'bull'],
            word: 'GAME',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto(ACTIVITIES_URL);

    // Play through a winning game
    await page.locator('.cab-len-btn[data-len="4"]').click();
    await page.waitForSelector('.cab-letter-input');

    const inputs = page.locator('.cab-letter-input');
    await inputs.nth(0).fill('G');
    await inputs.nth(1).fill('A');
    await inputs.nth(2).fill('M');
    await inputs.nth(3).fill('E');
    await page.locator('#cab-submit').click();

    await page.waitForSelector('#cab-result:not(.hidden)', { timeout: 5000 });

    // No critical JS errors
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
