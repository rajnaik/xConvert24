import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB (Cows and Bulls) — Timer Feature Tests
 * Tests the timer toggle, countdown options, localStorage persistence,
 * Start Game button, and timer display during gameplay.
 */

test.describe('CaB Timer — Positive', () => {
  test('timer toggle switch exists and defaults to off', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const toggle = page.locator('#cab-timer-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Timer options should be hidden
    const options = page.locator('#cab-timer-options');
    await expect(options).toHaveClass(/hidden/);
  });

  test('clicking timer toggle shows countdown options and start button', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-timer-toggle').click();

    // Timer options visible
    await expect(page.locator('#cab-timer-options')).not.toHaveClass(/hidden/);

    // Start button wrap visible
    await expect(page.locator('#cab-start-wrap')).not.toHaveClass(/hidden/);

    // All 5 timer buttons exist
    const timerBtns = page.locator('.cab-timer-btn');
    await expect(timerBtns).toHaveCount(5);

    // aria-checked updated
    await expect(page.locator('#cab-timer-toggle')).toHaveAttribute('aria-checked', 'true');
  });

  test('selecting a timer value highlights it and persists to localStorage', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-timer-toggle').click();
    await page.locator('.cab-timer-btn[data-timer="60"]').click();

    // Button should be highlighted
    const btn = page.locator('.cab-timer-btn[data-timer="60"]');
    await expect(btn).toHaveClass(/!bg-orange-600/);

    // localStorage should have the value
    const stored = await page.evaluate(() => localStorage.getItem('cab-timer-secs'));
    expect(stored).toBe('60');
  });

  test('selecting a word length in timer mode highlights it and persists to localStorage', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-timer-toggle').click();
    await page.locator('.cab-len-btn[data-len="5"]').click();

    // Button should be highlighted
    const btn = page.locator('.cab-len-btn[data-len="5"]');
    await expect(btn).toHaveClass(/!bg-orange-600/);

    // localStorage should have the value
    const stored = await page.evaluate(() => localStorage.getItem('cab-word-length'));
    expect(stored).toBe('5');
  });

  test('Start Game button enables when both timer and length are selected', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-timer-toggle').click();

    // Start button should be disabled initially
    const startBtn = page.locator('#cab-start-btn');
    await expect(startBtn).toBeDisabled();

    // Select timer
    await page.locator('.cab-timer-btn[data-timer="45"]').click();
    await expect(startBtn).toBeDisabled(); // still needs length

    // Select length
    await page.locator('.cab-len-btn[data-len="4"]').click();
    await expect(startBtn).toBeEnabled();

    // Hint text should reflect selections
    await expect(page.locator('#cab-start-hint')).toHaveText('4 letters, 45s countdown');
  });

  test('timer state restores from localStorage on page reload', async ({ page }) => {
    // Pre-set localStorage
    await page.addInitScript(() => {
      localStorage.setItem('cab-timer-enabled', '1');
      localStorage.setItem('cab-timer-secs', '75');
      localStorage.setItem('cab-word-length', '6');
    });

    await page.goto(ACTIVITIES_URL);

    // Toggle should be on
    await expect(page.locator('#cab-timer-toggle')).toHaveAttribute('aria-checked', 'true');

    // Timer options visible
    await expect(page.locator('#cab-timer-options')).not.toHaveClass(/hidden/);

    // 75s button highlighted
    await expect(page.locator('.cab-timer-btn[data-timer="75"]')).toHaveClass(/!bg-orange-600/);

    // 6 letters button highlighted
    await expect(page.locator('.cab-len-btn[data-len="6"]')).toHaveClass(/!bg-orange-600/);

    // Start button should be enabled
    await expect(page.locator('#cab-start-btn')).toBeEnabled();
  });

  test('timer display shows during gameplay when timer mode is active', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timer-user');
      localStorage.setItem('cab-timer-enabled', '1');
      localStorage.setItem('cab-timer-secs', '30');
      localStorage.setItem('cab-word-length', '4');
    });

    // Mock the POST to start game
    await page.route('**/api/cab/', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 50, wordId: 10, length: 4 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(ACTIVITIES_URL);

    // Click start
    await page.locator('#cab-start-btn').click();

    // Timer display should be visible
    const timerDisplay = page.locator('#cab-timer-display');
    await expect(timerDisplay).toBeVisible({ timeout: 3000 });

    // Should show the countdown value (30s or slightly less due to timing)
    const text = await timerDisplay.textContent();
    expect(text).toMatch(/⏱️ \d+s/);
  });

  test('timer stops when game is solved', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timer-solve');
      localStorage.setItem('cab-timer-enabled', '1');
      localStorage.setItem('cab-timer-secs', '60');
      localStorage.setItem('cab-word-length', '4');
    });

    await page.route('**/api/cab/', async (route, request) => {
      const method = request.method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 51, wordId: 11, length: 4 }),
        });
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ bulls: 4, cows: 0, feedback: ['bull', 'bull', 'bull', 'bull'], word: 'TEST' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto(ACTIVITIES_URL);
    await page.locator('#cab-start-btn').click();

    // Timer should be visible
    await expect(page.locator('#cab-timer-display')).toBeVisible({ timeout: 3000 });

    // Submit winning guess
    const inputs = page.locator('.cab-letter-input');
    await inputs.nth(0).fill('T');
    await inputs.nth(1).fill('E');
    await inputs.nth(2).fill('S');
    await inputs.nth(3).fill('T');
    await page.locator('#cab-submit').click();

    // Result should show
    await expect(page.locator('#cab-result')).not.toHaveClass(/hidden/, { timeout: 5000 });

    // Timer display should be hidden (stopped)
    await expect(page.locator('#cab-timer-display')).toHaveClass(/hidden/);
  });
});

test.describe('CaB Timer — Negative', () => {
  test('timer toggle off hides options and start button', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    // Turn on
    await page.locator('#cab-timer-toggle').click();
    await expect(page.locator('#cab-timer-options')).not.toHaveClass(/hidden/);

    // Turn off
    await page.locator('#cab-timer-toggle').click();
    await expect(page.locator('#cab-timer-options')).toHaveClass(/hidden/);
    await expect(page.locator('#cab-start-wrap')).toHaveClass(/hidden/);
    await expect(page.locator('#cab-timer-toggle')).toHaveAttribute('aria-checked', 'false');
  });

  test('word length click starts game immediately when timer is off', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-timer');
    });

    await page.route('**/api/cab/', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gameId: 52, wordId: 12, length: 5 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(ACTIVITIES_URL);

    // Ensure timer is off (default)
    await expect(page.locator('#cab-timer-toggle')).toHaveAttribute('aria-checked', 'false');

    // Click a length button — should start the game directly
    await page.locator('.cab-len-btn[data-len="5"]').click();

    // Game view should appear
    await expect(page.locator('#cab-game')).not.toHaveClass(/hidden/, { timeout: 5000 });

    // Timer display should NOT be visible (no timer mode)
    await expect(page.locator('#cab-timer-display')).toHaveClass(/hidden/);
  });

  test('Start button stays disabled with only timer selected (no length)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-timer-toggle').click();
    await page.locator('.cab-timer-btn[data-timer="90"]').click();

    // Start button should still be disabled (no length selected)
    await expect(page.locator('#cab-start-btn')).toBeDisabled();
    await expect(page.locator('#cab-start-hint')).toHaveText('Select a timer and word length to start');
  });

  test('toggling timer off clears word-length selection', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    // Turn on timer mode
    await page.locator('#cab-timer-toggle').click();

    // Select a length
    await page.locator('.cab-len-btn[data-len="7"]').click();
    await expect(page.locator('.cab-len-btn[data-len="7"]')).toHaveClass(/!bg-orange-600/);

    // Turn off timer mode
    await page.locator('#cab-timer-toggle').click();

    // Length button should lose its highlight
    await expect(page.locator('.cab-len-btn[data-len="7"]')).not.toHaveClass(/!bg-orange-600/);

    // localStorage for word-length should be cleared
    const stored = await page.evaluate(() => localStorage.getItem('cab-word-length'));
    expect(stored).toBeNull();
  });

  test('no duplicate timer toggle or start buttons exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    await expect(page.locator('#cab-timer-toggle')).toHaveCount(1);
    await expect(page.locator('#cab-start-btn')).toHaveCount(1);
    await expect(page.locator('#cab-timer-display')).toHaveCount(1);
  });
});
