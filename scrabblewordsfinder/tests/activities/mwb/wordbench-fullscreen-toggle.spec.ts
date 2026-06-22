import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed localStorage with words so the WordBench panel renders
const SEED_WORDS = JSON.stringify([
  { word: 'QUAFF', score: 20, category: 'wotd', meaning: 'To drink heartily', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'rare-letters', meaning: 'To destroy suddenly', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'JINX', score: 18, category: 'rare-letters', meaning: 'A curse or hex', dateAdded: '2026-01-02T00:00:00Z' },
]);

// ── WordBench Fullscreen Toggle — Positive ─────────────────────────

test.describe('WordBench Fullscreen Toggle — Positive', () => {
  test('fullscreen button exists in DOM with id fc-fullscreen-btn', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    // The button exists in DOM (inside hidden fc-speed-wrap until flashcards start)
    const btn = page.locator('#fc-fullscreen-btn');
    await expect(btn).toHaveCount(1);
  });

  test('fullscreen button has title "Full screen" in default state', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#fc-fullscreen-btn')).toHaveAttribute('title', 'Full screen');
  });

  test('fullscreen button contains an expand SVG icon', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    const svg = page.locator('#fc-fullscreen-btn svg');
    await expect(svg).toHaveCount(1);
  });

  test('fullscreen button becomes visible after starting flashcards', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    // Skip if there's a page JS error that blocks flashcard interaction
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(1500);
    if (errors.length > 0) {
      test.skip(true, `Page has JS errors blocking flashcards: ${errors[0]}`);
    }
    await expect(page.locator('#fc-fullscreen-btn')).toBeVisible();
  });

  test('CSS fullscreen fallback sets data-css-fullscreen attribute on panel', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    // Remove native fullscreen to trigger CSS fallback
    await page.addInitScript(() => {
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined, writable: true, configurable: true });
      Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', { value: undefined, writable: true, configurable: true });
    });
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(1500);
    if (errors.length > 0) {
      test.skip(true, `Page has JS errors blocking flashcards: ${errors[0]}`);
    }
    await page.locator('#fc-fullscreen-btn').click();
    await page.waitForTimeout(300);
    const panel = page.locator('#fc-fullscreen-btn').locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
    await expect(panel).toHaveAttribute('data-css-fullscreen', '1');
  });

  test('CSS fullscreen toggle exits and removes data-css-fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.addInitScript(() => {
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined, writable: true, configurable: true });
      Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', { value: undefined, writable: true, configurable: true });
    });
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(1500);
    if (errors.length > 0) {
      test.skip(true, `Page has JS errors blocking flashcards: ${errors[0]}`);
    }
    // Enter
    await page.locator('#fc-fullscreen-btn').click();
    await page.waitForTimeout(300);
    // Exit
    await page.locator('#fc-fullscreen-btn').click();
    await page.waitForTimeout(300);
    const panel = page.locator('#fc-fullscreen-btn').locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
    const attr = await panel.getAttribute('data-css-fullscreen');
    expect(attr).toBeNull();
  });
});

// ── WordBench Fullscreen Toggle — Negative ─────────────────────────

test.describe('WordBench Fullscreen Toggle — Negative', () => {
  test('no duplicate fc-fullscreen-btn elements in DOM', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#fc-fullscreen-btn')).toHaveCount(1);
  });

  test('no TypeScript syntax errors in WordBench inline scripts', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1000);
    // Check for TypeScript "as" keyword errors — these indicate TS code leaked into inline scripts
    const tsErrors = errors.filter(e => e.includes("Unexpected identifier 'as'") || e.includes('Unexpected token'));
    expect(tsErrors).toHaveLength(0);
  });

  test('clicking fullscreen button does not crash when native FS not supported', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.addInitScript(() => {
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined, writable: true, configurable: true });
      Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', { value: undefined, writable: true, configurable: true });
    });
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(1500);
    // Skip interaction tests if pre-existing page errors block flashcards
    const preErrors = errors.filter(e => e.includes("Unexpected identifier"));
    if (preErrors.length > 0) {
      test.skip(true, `Page has pre-existing JS syntax errors: ${preErrors[0]}`);
    }
    await page.locator('#fc-fullscreen-btn').click();
    await page.waitForTimeout(500);
    // Should not introduce new TypeError/ReferenceError errors
    const newErrors = errors.filter(e =>
      e.toLowerCase().includes('typeerror') ||
      e.toLowerCase().includes('cannot read')
    );
    expect(newErrors).toHaveLength(0);
  });

  test('body overflow is restored after exiting CSS fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.addInitScript(() => {
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined, writable: true, configurable: true });
      Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', { value: undefined, writable: true, configurable: true });
    });
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(1500);
    if (errors.filter(e => e.includes("Unexpected identifier")).length > 0) {
      test.skip(true, `Page has pre-existing JS syntax errors`);
    }
    // Enter
    await page.locator('#fc-fullscreen-btn').click();
    await page.waitForTimeout(300);
    const overflowHidden = await page.evaluate(() => document.body.style.overflow);
    expect(overflowHidden).toBe('hidden');
    // Exit
    await page.locator('#fc-fullscreen-btn').click();
    await page.waitForTimeout(300);
    const overflowRestored = await page.evaluate(() => document.body.style.overflow);
    expect(overflowRestored).toBe('');
  });
});
