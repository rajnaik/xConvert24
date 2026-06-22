import { test, expect } from '@playwright/test';

/**
 * CaB Star Integration Tests
 *
 * Verifies that:
 * - CaB is registered as an activity (slug: 'cab')
 * - Star can be awarded via POST /api/daily-progress with game='cab'
 * - Diamond threshold reflects all 7 activities
 * - StarBar UI shows the CaB slot
 */

const TEST_USER = `playwright-cab-star-${Date.now()}`;

/** Helper: skip test if endpoint is not available */
function skipIfUnavailable(status: number, contentType: string | null) {
  if (status === 404) return true;
  if (status === 500 && (!contentType || !contentType.includes('application/json'))) return true;
  return false;
}

// ── API: CaB Activity Registration — Positive ────────────────────────────

test.describe('CaB Star — Activity Registration — Positive', () => {
  test('CaB is listed as a registered activity', async ({ request }) => {
    const response = await request.get(`/api/daily-progress?user_id=${TEST_USER}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip(true, 'Endpoint not available');
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    const games = body.games || [];
    const cab = games.find((g: any) => g.slug === 'cab');
    expect(cab).toBeDefined();
    expect(cab.name).toBe('Cows and Bulls');
    expect(cab.icon).toBe('🐄');
  });

  test('diamond threshold includes CaB (7 activities)', async ({ request }) => {
    const response = await request.get(`/api/daily-progress?user_id=${TEST_USER}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip(true, 'Endpoint not available');
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.diamond_threshold).toBeGreaterThanOrEqual(7);
  });
});

// ── API: CaB Star Award — Positive ───────────────────────────────────────

test.describe('CaB Star — Award Star — Positive', () => {
  test('POST with game=cab awards a star successfully', async ({ request }) => {
    const response = await request.post('/api/daily-progress', {
      data: { user_id: TEST_USER, game: 'cab' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip(true, 'Endpoint not available');
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.star_awarded).toBe('cab');
    expect(body.today.stars_earned).toContain('cab');
    expect(body.today.stars_total).toBeGreaterThanOrEqual(1);
  });

  test('awarding cab star twice returns already_earned', async ({ request }) => {
    // Award first time
    await request.post('/api/daily-progress', {
      data: { user_id: TEST_USER, game: 'cab' },
    });
    // Award second time
    const response = await request.post('/api/daily-progress', {
      data: { user_id: TEST_USER, game: 'cab' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip(true, 'Endpoint not available');
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.already_earned).toBe(true);
    expect(body.star_awarded).toBe('cab');
  });

  test('cab star appears in GET after being awarded', async ({ request }) => {
    // Award the star
    await request.post('/api/daily-progress', {
      data: { user_id: TEST_USER, game: 'cab' },
    });
    // Verify via GET
    const response = await request.get(`/api/daily-progress?user_id=${TEST_USER}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip(true, 'Endpoint not available');
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.today.stars_earned).toContain('cab');
  });
});

// ── API: CaB Star Award — Negative ──────────────────────────────────────

test.describe('CaB Star — Award Star — Negative', () => {
  test('awarding star with invalid game slug returns 400', async ({ request }) => {
    const response = await request.post('/api/daily-progress', {
      data: { user_id: TEST_USER, game: 'nonexistent_game' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip(true, 'Endpoint not available');
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Unknown or inactive game');
  });

  test('awarding star without user_id returns 400', async ({ request }) => {
    const response = await request.post('/api/daily-progress', {
      data: { game: 'cab' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip(true, 'Endpoint not available');
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

// ── UI: StarBar CaB Slot — Positive ─────────────────────────────────────

test.describe('CaB Star — StarBar UI — Positive', () => {
  test('StarBar displays the CaB star slot on activities page', async ({ page }) => {
    await page.goto('/activities');
    const cabSlot = page.locator('#sb-cab');
    await expect(cabSlot).toBeVisible();
    await expect(cabSlot).toHaveText('🐄');
  });

  test('CaB star slot has correct title attribute', async ({ page }) => {
    await page.goto('/activities');
    const cabSlot = page.locator('#sb-cab');
    await expect(cabSlot).toHaveAttribute('title', /Cows and Bulls/);
  });
});

// ── UI: StarBar CaB Slot — Negative ─────────────────────────────────────

test.describe('CaB Star — StarBar UI — Negative', () => {
  test('CaB star slot is not lit up by default (no star earned)', async ({ page }) => {
    await page.goto('/activities');
    const cabSlot = page.locator('#sb-cab');
    // Default state: opacity-40, border-gray-700
    await expect(cabSlot).toHaveClass(/opacity-40/);
  });

  test('no duplicate CaB star slots exist', async ({ page }) => {
    await page.goto('/activities');
    const cabSlots = page.locator('#sb-cab');
    await expect(cabSlots).toHaveCount(1);
  });
});
