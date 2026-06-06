import { test, expect } from '@playwright/test';

/**
 * Pre-deployment test: Verify that a new user adding 5 favourites gets the favourite_5 reward.
 * Tests the full dependency chain: add favourite → count check → award coins.
 */

test.describe('Favourites Reward: favourite_5 milestone', () => {
  test('new user with 5 favourites receives the +10 coin reward', async ({ page }) => {
    // Start with a clean slate (new user — no localStorage)
    await page.goto('/convert/weight');
    
    // Clear any existing state to simulate new user
    await page.evaluate(() => {
      localStorage.clear();
      // Set a fresh UID
      localStorage.setItem('xconvert24-uid', 'test_fav5_' + Date.now());
    });

    // Add 5 different pages to favourites via localStorage directly
    // (simulating clicking the heart button on 5 different pages)
    await page.evaluate(() => {
      const favs = [
        { name: 'Weight Converter', href: '/convert/weight', category: 'Converters', addedAt: Date.now() },
        { name: 'Length Converter', href: '/convert/length', category: 'Converters', addedAt: Date.now() - 1000 },
        { name: 'Temperature Converter', href: '/convert/temperature', category: 'Converters', addedAt: Date.now() - 2000 },
        { name: 'BMI Calculator', href: '/tools/bmi', category: 'Tools', addedAt: Date.now() - 3000 },
        { name: 'Calculator', href: '/tools/calculator', category: 'Tools', addedAt: Date.now() - 4000 },
      ];
      localStorage.setItem('xconvert24-favourites', JSON.stringify(favs));
    });

    // Navigate to favourites page (which triggers the favourite_5 check)
    await page.goto('/favourites');
    await page.waitForTimeout(2000);

    // Verify the favourite_5 reward was granted
    const rewardGranted = await page.evaluate(() => {
      return !!localStorage.getItem('xc-coin-favourite_5');
    });
    expect(rewardGranted, 'favourite_5 reward should be granted when user has 5+ favourites').toBe(true);

    // Verify it was logged in the rewards log
    const rewardLogged = await page.evaluate(() => {
      try {
        const rewards = JSON.parse(localStorage.getItem('xconvert24-rewards-log') || '[]');
        return rewards.some((r: any) => r.activity === 'favourite_5');
      } catch { return false; }
    });
    expect(rewardLogged, 'favourite_5 should appear in rewards log').toBe(true);
  });

  test('user with fewer than 5 favourites does NOT get the reward', async ({ page }) => {
    await page.goto('/convert/weight');
    
    // Clear state
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('xconvert24-uid', 'test_fav3_' + Date.now());
    });

    // Add only 3 favourites
    await page.evaluate(() => {
      const favs = [
        { name: 'Weight Converter', href: '/convert/weight', category: 'Converters', addedAt: Date.now() },
        { name: 'Length Converter', href: '/convert/length', category: 'Converters', addedAt: Date.now() - 1000 },
        { name: 'Temperature Converter', href: '/convert/temperature', category: 'Converters', addedAt: Date.now() - 2000 },
      ];
      localStorage.setItem('xconvert24-favourites', JSON.stringify(favs));
    });

    // Navigate to favourites page
    await page.goto('/favourites');
    await page.waitForTimeout(2000);

    // Verify the favourite_5 reward was NOT granted
    const rewardGranted = await page.evaluate(() => {
      return !!localStorage.getItem('xc-coin-favourite_5');
    });
    expect(rewardGranted, 'favourite_5 reward should NOT be granted with only 3 favourites').toBe(false);
  });

  test('reward is only granted once (idempotent)', async ({ page }) => {
    await page.goto('/convert/weight');
    
    // Set up user with 5 favourites AND already-granted reward
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('xconvert24-uid', 'test_fav5_repeat_' + Date.now());
      const favs = [
        { name: 'Weight', href: '/convert/weight', category: '', addedAt: Date.now() },
        { name: 'Length', href: '/convert/length', category: '', addedAt: Date.now() },
        { name: 'Temp', href: '/convert/temperature', category: '', addedAt: Date.now() },
        { name: 'BMI', href: '/tools/bmi', category: '', addedAt: Date.now() },
        { name: 'Calc', href: '/tools/calculator', category: '', addedAt: Date.now() },
      ];
      localStorage.setItem('xconvert24-favourites', JSON.stringify(favs));
      // Pre-set the reward as already granted
      localStorage.setItem('xc-coin-favourite_5', '2025-06-06');
      localStorage.setItem('xconvert24-rewards-log', JSON.stringify([
        { activity: 'favourite_5', description: 'Added 5 items to favourites', coins: 10, date: '2025-06-06T10:00:00Z' }
      ]));
    });

    // Visit favourites page again
    await page.goto('/favourites');
    await page.waitForTimeout(2000);

    // Verify reward log still has only 1 entry for favourite_5
    const rewardCount = await page.evaluate(() => {
      try {
        const rewards = JSON.parse(localStorage.getItem('xconvert24-rewards-log') || '[]');
        return rewards.filter((r: any) => r.activity === 'favourite_5').length;
      } catch { return 0; }
    });
    expect(rewardCount, 'favourite_5 should only appear once in rewards log (not duplicated)').toBe(1);
  });
});
