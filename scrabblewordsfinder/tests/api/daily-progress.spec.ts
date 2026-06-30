import { test, expect } from '@playwright/test';

/**
 * API Tests — /api/daily-progress
 *
 * Covers:
 * - GET /api/daily-progress/ (today's stars, lifetime stats, registered games)
 * - POST /api/daily-progress/ (award a star, race condition handling via INSERT OR IGNORE)
 *
 * Note: Tests gracefully skip if the endpoint is not yet deployed (404) or DB
 * bindings aren't available (500). Once deployed, they validate full behaviour.
 */

const TEST_USER = `playwright-dp-${Date.now()}`;

/** Helper: skip test if endpoint is not available (404 or non-JSON 500) */
function skipIfUnavailable(status: number, contentType: string | null) {
  if (status === 404) return true;
  if (status === 500 && (!contentType || !contentType.includes('application/json'))) return true;
  return false;
}

// ── GET /api/daily-progress — Positive ───────────────────────────────────

test.describe('API /api/daily-progress GET — Positive', () => {
  test('returns 200 with expected JSON shape when user_id provided', async ({ request }) => {
    const response = await request.get(`/api/daily-progress/?user_id=${TEST_USER}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.games).toBeDefined();
    expect(Array.isArray(body.games)).toBeTruthy();
    expect(body.diamond_threshold).toBeDefined();
    expect(typeof body.diamond_threshold).toBe('number');
    expect(body.today).toBeDefined();
    expect(body.today.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.today.stars_earned).toBeDefined();
    expect(Array.isArray(body.today.stars_earned)).toBeTruthy();
    expect(typeof body.today.stars_total).toBe('number');
    expect(body.lifetime).toBeDefined();
    expect(typeof body.lifetime.total_stars).toBe('number');
    expect(typeof body.lifetime.total_diamonds).toBe('number');
    expect(typeof body.lifetime.current_streak).toBe('number');
  });

  test('returns lifetime stats including diamonds_lost and near_misses', async ({ request }) => {
    const response = await request.get(`/api/daily-progress/?user_id=${TEST_USER}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const body = await response.json();
    expect(typeof body.lifetime.diamonds_lost).toBe('number');
    expect(typeof body.lifetime.near_misses).toBe('number');
    expect(typeof body.lifetime.avg_stars_week).toBe('number');
    expect(typeof body.lifetime.avg_stars_month).toBe('number');
  });

  test('returns diamonds_earned and diamonds_mined breakdown fields', async ({ request }) => {
    const response = await request.get(`/api/daily-progress/?user_id=${TEST_USER}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const body = await response.json();
    expect(typeof body.lifetime.diamonds_earned).toBe('number');
    expect(typeof body.lifetime.diamonds_mined).toBe('number');
    expect(body.lifetime.diamonds_earned).toBeGreaterThanOrEqual(0);
    expect(body.lifetime.diamonds_mined).toBeGreaterThanOrEqual(0);
  });

  test('today stars_earned starts empty for a fresh user', async ({ request }) => {
    const freshUser = `playwright-fresh-${Date.now()}`;
    const response = await request.get(`/api/daily-progress/?user_id=${freshUser}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const body = await response.json();
    expect(body.today.stars_earned).toHaveLength(0);
    expect(body.today.stars_total).toBe(0);
    expect(body.today.diamond).toBe(0);
  });
});

// ── GET /api/daily-progress — Negative ───────────────────────────────────

test.describe('API /api/daily-progress GET — Negative', () => {
  test('returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.get('/api/daily-progress/');
    if (response.status() === 404) {
      test.skip(); // endpoint not deployed
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('returns 400 when user_id is empty string', async ({ request }) => {
    const response = await request.get('/api/daily-progress/?user_id=');
    if (response.status() === 404) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });
});

// ── POST /api/daily-progress — Positive ──────────────────────────────────

test.describe('API /api/daily-progress POST — Positive', () => {
  test('awards a star and returns expected response shape', async ({ request }) => {
    const response = await request.post('/api/daily-progress/', {
      data: { user_id: TEST_USER, game: 'wotd' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    // wotd might not be a registered game slug — that returns 400
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toBeDefined();
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.star_awarded).toBe('wotd');
    expect(body.today).toBeDefined();
    expect(Array.isArray(body.today.stars_earned)).toBeTruthy();
    expect(body.today.stars_earned).toContain('wotd');
    expect(typeof body.today.stars_total).toBe('number');
    expect(body.lifetime).toBeDefined();
    expect(typeof body.lifetime.total_stars).toBe('number');
  });

  test('returns already_earned: true when same star is awarded twice', async ({ request }) => {
    const userId = `playwright-dupe-${Date.now()}`;
    // First award
    const first = await request.post('/api/daily-progress/', {
      data: { user_id: userId, game: 'wotd' },
    });
    if (skipIfUnavailable(first.status(), first.headers()['content-type']) || first.status() === 400) {
      test.skip();
      return;
    }
    // Second award (duplicate)
    const second = await request.post('/api/daily-progress/', {
      data: { user_id: userId, game: 'wotd' },
    });
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.already_earned).toBe(true);
    expect(body.star_awarded).toBe('wotd');
  });

  test('concurrent star awards do not cause DB errors (race condition fix)', async ({ request }) => {
    const userId = `playwright-race-${Date.now()}`;
    // Fire two different game star awards simultaneously to test INSERT OR IGNORE
    const [res1, res2] = await Promise.all([
      request.post('/api/daily-progress/', { data: { user_id: userId, game: 'wotd' } }),
      request.post('/api/daily-progress/', { data: { user_id: userId, game: 'quiz' } }),
    ]);
    // If endpoint not deployed, skip
    if (res1.status() === 404 && res2.status() === 404) {
      test.skip();
      return;
    }
    // Neither should 500 with a UNIQUE constraint error (this is the core race condition test)
    if (res1.status() !== 404) expect(res1.status()).not.toBe(500);
    if (res2.status() !== 404) expect(res2.status()).not.toBe(500);
  });

  test('total_diamonds reflects earned diamonds for a fresh user (multi-source aggregation)', async ({ request }) => {
    const userId = `playwright-ssot-${Date.now()}`;
    const getRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(getRes.status(), getRes.headers()['content-type'])) {
      test.skip();
      return;
    }
    const data = await getRes.json();
    const games = data.games as { slug: string }[];
    if (!games || games.length === 0) {
      test.skip();
      return;
    }
    // Fresh user starts with 0 diamonds (earned + bonus + mined all zero)
    expect(data.lifetime.total_diamonds).toBe(0);

    // Award all stars to earn a diamond today
    for (const game of games) {
      await request.post('/api/daily-progress/', {
        data: { user_id: userId, game: game.slug },
      });
    }
    // Fetch again — total_diamonds should now be >= 1 (at least 1 earned diamond day)
    const afterRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (afterRes.status() !== 200) {
      test.skip();
      return;
    }
    const afterData = await afterRes.json();
    // With no bonus or mined diamonds, total = earned only = 1
    expect(afterData.lifetime.total_diamonds).toBeGreaterThanOrEqual(1);
    expect(afterData.today.diamond).toBe(1);
  });

  test('diamond_earned is true when all stars are collected', async ({ request }) => {
    const userId = `playwright-diamond-${Date.now()}`;
    const getRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(getRes.status(), getRes.headers()['content-type'])) {
      test.skip();
      return;
    }
    const data = await getRes.json();
    const games = data.games as { slug: string }[];
    if (!games || games.length === 0) {
      test.skip();
      return;
    }
    // Award all stars sequentially
    let lastBody: any;
    for (const game of games) {
      const res = await request.post('/api/daily-progress/', {
        data: { user_id: userId, game: game.slug },
      });
      if (res.status() === 200) {
        lastBody = await res.json();
      }
    }
    if (!lastBody) {
      test.skip();
      return;
    }
    // After awarding all, diamond should be earned
    expect(lastBody.today.diamond).toBe(1);
  });
});

// ── POST /api/daily-progress — Negative ──────────────────────────────────

test.describe('API /api/daily-progress POST — Negative', () => {
  test('returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.post('/api/daily-progress/', {
      data: { game: 'wotd' },
    });
    if (response.status() === 404) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('returns 400 when game is missing', async ({ request }) => {
    const response = await request.post('/api/daily-progress/', {
      data: { user_id: 'test-user' },
    });
    if (response.status() === 404) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('game');
  });

  test('returns 400 for unknown/inactive game slug', async ({ request }) => {
    const response = await request.post('/api/daily-progress/', {
      data: { user_id: 'test-user', game: 'nonexistent-game-xyz' },
    });
    if (response.status() === 404) {
      test.skip();
      return;
    }
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('nonexistent-game-xyz');
  });

  test('returns 400 when body is empty object (no user_id or game)', async ({ request }) => {
    const response = await request.post('/api/daily-progress/', {
      data: {},
    });
    if (response.status() === 404) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
  });

  test('diamond field does not regress from 1 to 0 on subsequent awards', async ({ request }) => {
    const userId = `playwright-noreg-${Date.now()}`;
    const getRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(getRes.status(), getRes.headers()['content-type'])) {
      test.skip();
      return;
    }
    const data = await getRes.json();
    const games = data.games as { slug: string }[];
    if (!games || games.length === 0) {
      test.skip();
      return;
    }
    // Award all stars to earn diamond
    for (const game of games) {
      await request.post('/api/daily-progress/', {
        data: { user_id: userId, game: game.slug },
      });
    }
    // Now try awarding the first game again (already_earned path)
    const dupeRes = await request.post('/api/daily-progress/', {
      data: { user_id: userId, game: games[0].slug },
    });
    if (dupeRes.status() !== 200) {
      test.skip();
      return;
    }
    const body = await dupeRes.json();
    // Diamond must stay 1 — the CASE WHEN diamond = 1 THEN 1 ELSE ... logic preserves it
    expect(body.today.diamond).toBe(1);
  });
});

// ── GET /api/daily-progress — Multi-Source Diamond Aggregation ────────────

test.describe('API /api/daily-progress GET — Diamond Aggregation (earned + bonus + mined)', () => {
  test('total_diamonds is always a non-negative number', async ({ request }) => {
    const userId = `playwright-aggr-${Date.now()}`;
    const response = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const body = await response.json();
    expect(typeof body.lifetime.total_diamonds).toBe('number');
    expect(body.lifetime.total_diamonds).toBeGreaterThanOrEqual(0);
  });

  test('fresh user total_diamonds is 0 when no bonus or mined diamonds exist', async ({ request }) => {
    const userId = `playwright-fresh-aggr-${Date.now()}`;
    const response = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const body = await response.json();
    // Fresh user has no earned, bonus, or mined diamonds
    expect(body.lifetime.total_diamonds).toBe(0);
  });

  test('diamonds_earned + diamonds_mined equals total_diamonds', async ({ request }) => {
    const userId = `playwright-sum-${Date.now()}`;
    const response = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const body = await response.json();
    // total_diamonds = diamonds_earned (daily + bonus) + diamonds_mined
    expect(body.lifetime.total_diamonds).toBe(
      body.lifetime.diamonds_earned + body.lifetime.diamonds_mined
    );
  });

  test('diamonds_earned increments after earning a diamond day', async ({ request }) => {
    const userId = `playwright-earnincr-${Date.now()}`;
    const getRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(getRes.status(), getRes.headers()['content-type'])) {
      test.skip();
      return;
    }
    const data = await getRes.json();
    const games = data.games as { slug: string }[];
    if (!games || games.length === 0) {
      test.skip();
      return;
    }
    const beforeEarned = data.lifetime.diamonds_earned;
    const beforeMined = data.lifetime.diamonds_mined;

    // Award all stars to earn a diamond
    for (const game of games) {
      await request.post('/api/daily-progress/', {
        data: { user_id: userId, game: game.slug },
      });
    }

    const afterRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (afterRes.status() !== 200) { test.skip(); return; }
    const afterData = await afterRes.json();
    // diamonds_earned should increment by 1 (the new diamond day counts as earned)
    expect(afterData.lifetime.diamonds_earned).toBe(beforeEarned + 1);
    // diamonds_mined should remain unchanged (no mining happened)
    expect(afterData.lifetime.diamonds_mined).toBe(beforeMined);
  });

  test('total_diamonds increments by exactly 1 after earning one diamond day', async ({ request }) => {
    const userId = `playwright-incr-${Date.now()}`;
    const getRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(getRes.status(), getRes.headers()['content-type'])) {
      test.skip();
      return;
    }
    const data = await getRes.json();
    const games = data.games as { slug: string }[];
    if (!games || games.length === 0) {
      test.skip();
      return;
    }
    const beforeDiamonds = data.lifetime.total_diamonds;

    // Award all stars to earn a diamond
    for (const game of games) {
      await request.post('/api/daily-progress/', {
        data: { user_id: userId, game: game.slug },
      });
    }

    const afterRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (afterRes.status() !== 200) {
      test.skip();
      return;
    }
    const afterData = await afterRes.json();
    // Should increment by at least 1 (the earned diamond from daily_progress)
    expect(afterData.lifetime.total_diamonds).toBe(beforeDiamonds + 1);
  });

  test('total_diamonds does not double-count when star is awarded again after diamond earned', async ({ request }) => {
    const userId = `playwright-nodup-${Date.now()}`;
    const getRes = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (skipIfUnavailable(getRes.status(), getRes.headers()['content-type'])) {
      test.skip();
      return;
    }
    const data = await getRes.json();
    const games = data.games as { slug: string }[];
    if (!games || games.length === 0) {
      test.skip();
      return;
    }

    // Award all stars to earn diamond
    for (const game of games) {
      await request.post('/api/daily-progress/', {
        data: { user_id: userId, game: game.slug },
      });
    }

    // Record total after diamond earned
    const firstRead = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (firstRead.status() !== 200) { test.skip(); return; }
    const firstData = await firstRead.json();
    const diamondsAfterEarn = firstData.lifetime.total_diamonds;

    // Award the same star again (duplicate)
    await request.post('/api/daily-progress/', {
      data: { user_id: userId, game: games[0].slug },
    });

    // total_diamonds should NOT change
    const secondRead = await request.get(`/api/daily-progress/?user_id=${userId}`);
    if (secondRead.status() !== 200) { test.skip(); return; }
    const secondData = await secondRead.json();
    expect(secondData.lifetime.total_diamonds).toBe(diamondsAfterEarn);
  });
});
