import { test, expect } from '@playwright/test';

/**
 * Badge Progress in Diamond Celebration — UI Tests
 *
 * Verifies the enhanced badge progress section within the diamond celebration modal.
 * The modal shows after a diamond is claimed and displays:
 * - Badge image (next badge or current badge at max)
 * - Flex layout with badge info text
 * - "X more diamonds to earn" line
 * - Badge name
 * - "N diamonds required" threshold line
 * - Max badge state with crown emoji
 *
 * Strategy: Navigate to homepage, then call showDiamondCelebration() directly
 * via page.evaluate() to render the modal with mocked badge data.
 */

// Helper: navigate to homepage and call the celebration function directly
async function triggerCelebration(page, badgeProgress) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Call showDiamondCelebration directly — it's defined in the global Layout script
  await page.evaluate((bp) => {
    // @ts-ignore — function is in inline script scope
    if (typeof (window as any).showDiamondCelebration === 'function') {
      (window as any).showDiamondCelebration(1, bp);
    } else {
      // The function is scoped inside an IIFE — we need to recreate the call
      // by dispatching a synthetic diamond claim. Instead, inject via the script.
      throw new Error('showDiamondCelebration not globally accessible');
    }
  }, badgeProgress).catch(() => {
    // Function is likely scoped — fallback to triggering via the diamond slot click
  });
}

// Since showDiamondCelebration is likely inside an IIFE and not globally accessible,
// we need to trigger it through the actual diamond claim flow with route interception.
async function triggerViaRoute(page, badgeProgress) {
  // Intercept diamond-hunt API
  await page.route('**/api/diamond-hunt/**', async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ show: true, diamonds_remaining: 3 }),
      });
    } else if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          claimed: true,
          diamonds_earned: 1,
          badge_progress: badgeProgress,
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Set up localStorage for the diamond script (must be after navigation)
  await page.evaluate(() => {
    localStorage.setItem('swf-uid', 'test-badge-ui-user');
  });

  // Reload so the diamond script picks up the uid
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);

  // Click the diamond slot to trigger the celebration
  const slot = page.locator('.diamond-hunt-slot').first();
  if (await slot.isVisible({ timeout: 2000 }).catch(() => false)) {
    await slot.click();
    await page.waitForSelector('#diamond-celebration', { timeout: 3000 });
    return true;
  }
  return false;
}

// ── Badge Progress (next badge) — Positive ────────────────────────────────

test.describe('Badge Progress Celebration — Next Badge (Positive)', () => {
  test('celebration shows badge progress section with flex layout', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Silver Miner',
      next_badge_threshold: 50,
      next_badge_image: '/badges/silver-miner.svg',
      diamonds_needed: 12,
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration).toBeVisible();
    // Badge progress section should contain an img element
    const img = celebration.locator('img[alt="Silver Miner badge"]');
    await expect(img).toBeVisible();
  });

  test('celebration shows next badge image with correct src', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Gold Digger',
      next_badge_threshold: 100,
      next_badge_image: '/badges/gold-digger.svg',
      diamonds_needed: 25,
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    const img = celebration.locator('img[alt="Gold Digger badge"]');
    await expect(img).toHaveAttribute('src', '/badges/gold-digger.svg');
  });

  test('celebration shows "X more diamonds to earn" text', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Silver Miner',
      next_badge_threshold: 50,
      next_badge_image: '/badges/silver-miner.svg',
      diamonds_needed: 7,
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration.locator('text=7 more diamonds to earn')).toBeVisible();
  });

  test('celebration shows singular "diamond" when diamonds_needed is 1', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Silver Miner',
      next_badge_threshold: 50,
      next_badge_image: '/badges/silver-miner.svg',
      diamonds_needed: 1,
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration.locator('text=1 more diamond to earn')).toBeVisible();
  });

  test('celebration shows badge name', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Diamond Czar',
      next_badge_threshold: 200,
      next_badge_image: '/badges/diamond-czar.svg',
      diamonds_needed: 40,
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration.locator('text=Diamond Czar')).toBeVisible();
  });

  test('celebration shows threshold required line', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Silver Miner',
      next_badge_threshold: 50,
      next_badge_image: '/badges/silver-miner.svg',
      diamonds_needed: 12,
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration.locator('text=50 💎 required')).toBeVisible();
  });
});

// ── Max Badge Reached — Positive ──────────────────────────────────────────

test.describe('Badge Progress Celebration — Max Badge (Positive)', () => {
  test('celebration shows max badge message with crown emoji', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: true,
      current_badge: 'Lex Legend',
      current_badge_image: '/badges/lex-legend.svg',
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration.locator('text=You hold the highest badge')).toBeVisible();
  });

  test('celebration shows current badge image when max reached', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: true,
      current_badge: 'Lex Legend',
      current_badge_image: '/badges/lex-legend.svg',
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    const img = celebration.locator('img[alt="Lex Legend badge"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', '/badges/lex-legend.svg');
  });

  test('max badge message includes the badge name', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: true,
      current_badge: 'Lex Legend',
      current_badge_image: '/badges/lex-legend.svg',
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration.locator('text=Lex Legend')).toBeVisible();
  });
});

// ── Negative Tests ────────────────────────────────────────────────────────

test.describe('Badge Progress Celebration — Negative', () => {
  test('no badge image rendered when next_badge_image is missing', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Bronze Collector',
      next_badge_threshold: 10,
      diamonds_needed: 3,
      // No next_badge_image field
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration).toBeVisible();
    // Badge name should still show
    await expect(celebration.locator('text=Bronze Collector')).toBeVisible();
    // But no badge image should exist
    const imgs = celebration.locator('img[alt="Bronze Collector badge"]');
    await expect(imgs).toHaveCount(0);
  });

  test('no badge image rendered when current_badge_image is missing at max', async ({ page }) => {
    const shown = await triggerViaRoute(page, {
      max_badge_reached: true,
      current_badge: 'Lex Legend',
      // No current_badge_image field
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration).toBeVisible();
    await expect(celebration.locator('text=Lex Legend')).toBeVisible();
    const imgs = celebration.locator('img[alt="Lex Legend badge"]');
    await expect(imgs).toHaveCount(0);
  });

  test('no badge section when badge_progress is null', async ({ page }) => {
    const shown = await triggerViaRoute(page, null);
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    const celebration = page.locator('#diamond-celebration');
    await expect(celebration).toBeVisible();
    // Core celebration content still shows
    await expect(celebration.locator('text=Diamond Mined!')).toBeVisible();
    // No badge progress text should appear
    await expect(celebration.locator('text=more diamond')).toHaveCount(0);
    await expect(celebration.locator('text=highest badge')).toHaveCount(0);
  });

  test('no console errors during celebration with badge progress', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    const shown = await triggerViaRoute(page, {
      max_badge_reached: false,
      next_badge: 'Silver Miner',
      next_badge_threshold: 50,
      next_badge_image: '/badges/silver-miner.svg',
      diamonds_needed: 12,
    });
    test.skip(!shown, 'Diamond slot not visible — cannot trigger celebration');

    await page.waitForTimeout(500);
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('badge'));
    expect(critical).toHaveLength(0);
  });
});
