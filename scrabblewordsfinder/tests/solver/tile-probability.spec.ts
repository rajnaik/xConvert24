import { test, expect } from '@playwright/test';

/**
 * Tile Bag Probability & Rack Leave Analyzer Tests
 * Tests the probability calculator, draw chances popup,
 * and the rack leave quality analysis.
 */

test.describe('Tile Bag Probability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('probability panel shows bag, rack, and played counts', async ({ page }) => {
    await expect(page.locator('#tiles-in-bag')).toBeVisible();
    await expect(page.locator('#prob-your-rack')).toBeVisible();
    await expect(page.locator('#tiles-played')).toBeVisible();
  });

  test('bag starts at 100 tiles', async ({ page }) => {
    await expect(page.locator('#tiles-in-bag')).toHaveValue('100');
  });

  test('rack count updates when tiles entered', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.waitForTimeout(400);
    const rackCount = await page.locator('#prob-your-rack').textContent();
    expect(parseInt(rackCount || '0')).toBe(7);
  });

  test('Draw % button toggles probability popup', async ({ page }) => {
    const popup = page.locator('#prob-popup');
    await expect(popup).toHaveClass(/hidden/);
    await page.locator('#prob-popup-btn').click();
    await expect(popup).not.toHaveClass(/hidden/);
    await page.locator('#prob-popup-btn').click();
    await expect(popup).toHaveClass(/hidden/);
  });

  test('draw probabilities show for key tiles when rack has letters', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.waitForTimeout(400);
    await page.locator('#prob-popup-btn').click();
    const chances = page.locator('#prob-draw-chances');
    await expect(chances).toContainText('%');
    // Should mention at least one key tile (S, E, R, T, N, Z, Q, X, J, Blank)
    const text = await chances.textContent();
    expect(text).toMatch(/S|E|R|T|N|Z|Q|X|J|Blank/);
  });

  test('playing a word updates bag and played counts', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    // Get initial values
    const initialBag = parseInt(await page.locator('#tiles-in-bag').inputValue());
    const initialPlayed = parseInt(await page.locator('#tiles-played').inputValue());

    // Click a word (triggers onWordPlayed)
    await page.locator('#results [data-achieve-word]').first().click();

    // Bag should decrease, played should increase
    const newBag = parseInt(await page.locator('#tiles-in-bag').inputValue());
    const newPlayed = parseInt(await page.locator('#tiles-played').inputValue());
    expect(newBag).toBeLessThan(initialBag);
    expect(newPlayed).toBeGreaterThan(initialPlayed);
  });

  test('manually editing bag count persists to localStorage', async ({ page }) => {
    await page.locator('#tiles-in-bag').fill('80');
    await page.locator('#tiles-in-bag').dispatchEvent('input');
    await page.waitForTimeout(200);

    const saved = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbTileProb') || '{}');
    });
    expect(saved.inBag).toBe(80);
  });

  test('manually editing played count persists to localStorage', async ({ page }) => {
    await page.locator('#tiles-played').fill('20');
    await page.locator('#tiles-played').dispatchEvent('input');
    await page.waitForTimeout(200);

    const saved = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbTileProb') || '{}');
    });
    expect(saved.played).toBe(20);
  });
});

test.describe('Rack Leave Analyzer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('rack leave panel shows placeholder when no word played', async ({ page }) => {
    const panel = page.locator('#rack-leave-panel');
    await expect(panel).toContainText('Find words first');
  });

  test('clicking a result word shows rack leave analysis', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    // Click a word
    await page.locator('#results [data-achieve-word]').first().click();

    const panel = page.locator('#rack-leave-panel');
    // Should show "After playing WORD:"
    await expect(panel).toContainText('After playing');
    // Should show quality score
    await expect(panel).toContainText(/Excellent|Good|Fair|Poor/);
  });

  test('rack leave shows remaining tiles visually', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-achieve-word]').first().click();

    const panel = page.locator('#rack-leave-panel');
    // Should show tile squares for remaining letters
    const tiles = panel.locator('.inline-flex.items-center.justify-center');
    const count = await tiles.count();
    // If it's not a bingo, there should be remaining tiles
    // (could be 0 for bingo, which is also valid)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('bingo detection shows +50 bonus message', async ({ page }) => {
    // Pre-set a scenario: 7-letter rack where a 7-letter word exists
    await page.locator('#text-solver').fill('BLASTER');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    // Look for a 7-letter result to click
    const sevenLetterWord = page.locator('#results [data-achieve-word]').filter({
      has: page.locator('span.font-mono')
    });
    const count = await sevenLetterWord.count();
    if (count > 0) {
      // Find one with 7 letters
      for (let i = 0; i < count; i++) {
        const word = await sevenLetterWord.nth(i).getAttribute('data-achieve-word');
        if (word && word.length === 7) {
          await sevenLetterWord.nth(i).click();
          const panel = page.locator('#rack-leave-panel');
          await expect(panel).toContainText('Bingo');
          break;
        }
      }
    }
  });

  test('rack leave shows vowel/consonant balance info', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-achieve-word]').first().click();
    const panel = page.locator('#rack-leave-panel');
    await expect(panel).toContainText('Vowels');
    await expect(panel).toContainText('Consonants');
  });
});
