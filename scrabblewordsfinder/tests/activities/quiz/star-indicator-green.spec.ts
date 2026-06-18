import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Star Indicator Green State — Positive ────────────────────────────────
// When a star is earned, .star-indicator turns green permanently:
// - gets text-green-400 class
// - title changes to "⭐ Star earned!"
// - opacity-40 removed, opacity-100 added

test.describe('Star Indicator Green State — Positive', () => {
  test('earned star indicator gets text-green-400 class from localStorage stars', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.addInitScript((dateStr) => {
      localStorage.setItem('swf-uid', 'test-user-star-green');
      localStorage.setItem('swf-stars-earned-' + dateStr, JSON.stringify(['quiz']));
    }, today);

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.star-indicator[data-game="quiz"]', { timeout: 8000 });
    await page.waitForTimeout(500);

    const indicator = page.locator('.star-indicator[data-game="quiz"]');
    await expect(indicator).toHaveClass(/text-green-400/);
  });

  test('earned star indicator retains its original emoji (no text change)', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.addInitScript((dateStr) => {
      localStorage.setItem('swf-uid', 'test-user-star-green');
      localStorage.setItem('swf-stars-earned-' + dateStr, JSON.stringify(['rack']));
    }, today);

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.star-indicator[data-game="rack"]', { timeout: 8000 });
    await page.waitForTimeout(500);

    const indicator = page.locator('.star-indicator[data-game="rack"]');
    // After earning, the text stays as the original emoji (not replaced with ✅)
    await expect(indicator).not.toHaveText('✅');
  });

  test('earned star indicator has opacity-100 and no opacity-40', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.addInitScript((dateStr) => {
      localStorage.setItem('swf-uid', 'test-user-star-green');
      localStorage.setItem('swf-stars-earned-' + dateStr, JSON.stringify(['anagram']));
    }, today);

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.star-indicator[data-game="anagram"]', { timeout: 8000 });
    await page.waitForTimeout(500);

    const indicator = page.locator('.star-indicator[data-game="anagram"]');
    await expect(indicator).toHaveClass(/opacity-100/);
    await expect(indicator).not.toHaveClass(/opacity-40/);
  });

  test('earned star indicator title shows "⭐ Star earned!"', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.addInitScript((dateStr) => {
      localStorage.setItem('swf-uid', 'test-user-star-green');
      localStorage.setItem('swf-stars-earned-' + dateStr, JSON.stringify(['sixty']));
    }, today);

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.star-indicator[data-game="sixty"]', { timeout: 8000 });
    await page.waitForTimeout(500);

    const indicator = page.locator('.star-indicator[data-game="sixty"]');
    await expect(indicator).toHaveAttribute('title', '⭐ Star earned!');
  });

  test('multiple earned stars all turn green simultaneously', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.addInitScript((dateStr) => {
      localStorage.setItem('swf-uid', 'test-user-star-green');
      localStorage.setItem('swf-stars-earned-' + dateStr, JSON.stringify(['wotd', 'quiz', 'rack']));
    }, today);

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(800);

    for (const game of ['wotd', 'quiz', 'rack']) {
      const indicator = page.locator(`.star-indicator[data-game="${game}"]`);
      await expect(indicator).toHaveClass(/text-green-400/);
      await expect(indicator).not.toHaveText('✅');
    }
  });

  test('swf-star-earned event also turns indicator green dynamically', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    await page.addInitScript((dateStr) => {
      localStorage.setItem('swf-uid', 'test-user-star-green');
      localStorage.setItem('swf-stars-earned-' + dateStr, JSON.stringify([]));
    }, today);

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.star-indicator[data-game="wordbench"]', { timeout: 8000 });

    // Dispatch the event as the game logic would
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('swf-star-earned', { detail: { game: 'wordbench' } }));
    });
    await page.waitForTimeout(300);

    const indicator = page.locator('.star-indicator[data-game="wordbench"]');
    await expect(indicator).toHaveClass(/text-green-400/);
    await expect(indicator).not.toHaveText('✅');
  });
});

// ── Star Indicator Green State — Negative ────────────────────────────────

test.describe('Star Indicator Green State — Negative', () => {
  test('unearned star indicators remain in default state when no user logged in', async ({ page }) => {
    // With no uid, the renderStarBar function returns early — no API call, no stars
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      // Clear all star keys
      const keys = Object.keys(localStorage).filter(k => k.startsWith('swf-stars-earned'));
      keys.forEach(k => localStorage.removeItem(k));
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(800);

    // All indicators should remain in default state (no user = no stars from API)
    const rackIndicator = page.locator('.star-indicator[data-game="rack"]');
    await expect(rackIndicator).toHaveClass(/opacity-40/);
    await expect(rackIndicator).not.toHaveClass(/text-green-400/);
    // Default emoji stays (not replaced)
    await expect(rackIndicator).toHaveText('⭐');
  });

  test('no JS errors when star is earned via event', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    const today = new Date().toISOString().split('T')[0];
    await page.addInitScript((dateStr) => {
      localStorage.setItem('swf-uid', 'test-user-star-green');
      localStorage.setItem('swf-stars-earned-' + dateStr, JSON.stringify([]));
    }, today);

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('swf-star-earned', { detail: { game: 'anagram' } }));
    });
    await page.waitForTimeout(300);

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('earning a star for unknown game does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(500);

    // Dispatch event with a game name that has no matching DOM element
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('swf-star-earned', { detail: { game: 'nonexistent-game' } }));
    });
    await page.waitForTimeout(300);

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no indicators turn green when no user is logged in (no uid)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      // Clear all star keys
      const keys = Object.keys(localStorage).filter(k => k.startsWith('swf-stars-earned'));
      keys.forEach(k => localStorage.removeItem(k));
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(800);

    // Without a uid, no API fetch happens and no localStorage stars apply
    const greenIndicators = page.locator('.star-indicator.text-green-400');
    await expect(greenIndicators).toHaveCount(0);
  });
});
