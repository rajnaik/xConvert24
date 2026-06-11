import { test, expect } from '@playwright/test';

/**
 * localStorage Persistence Tests
 * Tests that all localStorage keys persist correctly across
 * page reloads and navigation, and that filter preferences
 * are restored on return visits.
 */

test.describe('Filter Preferences Persistence', () => {
  test('dictionary selection persists across reloads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });

    // Change dictionary to TWL
    await page.locator('#dictionary').selectOption('twl');
    await page.waitForTimeout(200);

    // Reload page
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });

    // Dictionary should still be TWL
    const dict = await page.locator('#dictionary').inputValue();
    expect(dict).toBe('twl');
  });

  test('sort preference persists', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });

    await page.locator('#sort-by').selectOption('alpha');
    await page.waitForTimeout(200);

    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
    const sort = await page.locator('#sort-by').inputValue();
    expect(sort).toBe('alpha');
  });

  test('min length preference persists', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });

    await page.locator('#min-len').selectOption('4');
    await page.waitForTimeout(200);

    await page.reload();
    const minLen = await page.locator('#min-len').inputValue();
    expect(minLen).toBe('4');
  });
});

test.describe('Achievements Persistence', () => {
  test('saved words persist across page reloads', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'quiz', meaning: '(noun) a test' },
        { word: 'zone', meaning: '(noun) an area' },
      ]));
    });
    await page.reload();

    // Saved count should be 2
    const count = await page.locator('#saved-count').textContent();
    expect(parseInt(count || '0')).toBe(2);
  });

  test('saved words persist across navigation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'test', meaning: '' },
      ]));
    });

    // Navigate away and back
    await page.goto('/settings');
    await page.goto('/');

    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(achievements.length).toBe(1);
    expect(achievements[0].word).toBe('test');
  });

  test('achievements show crowns on matching words after reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'qi', meaning: '' },
      ]));
    });
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });

    // The word "qi" in reference panels should have emerald ring
    const qiWord = page.locator('#two-letter-words [data-achieve-word="qi"]');
    if (await qiWord.count() > 0) {
      await expect(qiWord).toHaveClass(/ring-emerald-500/);
    }
  });
});

test.describe('Tile Probability State Persistence', () => {
  test('tile bag count persists across reloads', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('scbTileProb', JSON.stringify({ inBag: 75, played: 25 }));
    });
    await page.reload();

    const inBag = await page.locator('#tiles-in-bag').inputValue();
    const played = await page.locator('#tiles-played').inputValue();
    expect(inBag).toBe('75');
    expect(played).toBe('25');
  });
});

test.describe('UID Persistence', () => {
  test('UID persists across page loads', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'persistent-test-uid'));
    await page.reload();

    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBe('persistent-test-uid');
  });

  test('UID is consistent between homepage and settings', async ({ page }) => {
    await page.goto('/');
    const homeUid = await page.evaluate(() => localStorage.getItem('swf-uid'));

    await page.goto('/settings');
    const settingsUid = await page.evaluate(() => localStorage.getItem('swf-uid'));

    expect(homeUid).toBe(settingsUid);
  });

  test('new UID is generated when none exists', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    await page.waitForTimeout(500);

    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBeTruthy();
    expect(uid!.length).toBeGreaterThan(8);
  });
});
