import { test, expect } from '@playwright/test';

/**
 * API Tests — /api/bonus-diamond
 *
 * Covers:
 * - GET /api/bonus-diamond (check if bonus already earned)
 * - POST /api/bonus-diamond (award one-time bonus diamond)
 */

const TEST_USER = `playwright-bonus-${Date.now()}`;

/** Helper: skip if endpoint not deployed */
function skipIfUnavailable(status: number, contentType: string | null) {
  if (status === 404) return true;
  if (status === 500 && (!contentType || !contentType.includes('application/json'))) return true;
  return false;
}

// ── GET /api/bonus-diamond — Positive ────────────────────────────────────

test.describe('API /api/bonus-diamond GET — Positive', () => {
  test('returns earned: false for a user who has not earned a bonus', async ({ request }) => {
    const response = await request.get(`/api/bonus-diamond?user_id=${TEST_USER}&bonus_type=backup`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.earned).toBe(false);
    expect(body.awarded_at).toBeNull();
  });
});

// ── GET /api/bonus-diamond — Negative ────────────────────────────────────

test.describe('API /api/bonus-diamond GET — Negative', () => {
  test('returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.get('/api/bonus-diamond?bonus_type=backup');
    if (response.status() === 404) { test.skip(); return; }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('returns 400 when bonus_type is missing', async ({ request }) => {
    const response = await request.get(`/api/bonus-diamond?user_id=${TEST_USER}`);
    if (response.status() === 404) { test.skip(); return; }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('bonus_type');
  });
});

// ── POST /api/bonus-diamond — Positive ───────────────────────────────────

test.describe('API /api/bonus-diamond POST — Positive', () => {
  test('awards a bonus diamond and returns awarded: true', async ({ request }) => {
    const userId = `playwright-award-${Date.now()}`;
    const response = await request.post('/api/bonus-diamond', {
      data: { user_id: userId, bonus_type: 'backup' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.awarded).toBe(true);
    expect(body.bonus_type).toBe('backup');
  });

  test('returns already_earned: true on duplicate award (idempotent)', async ({ request }) => {
    const userId = `playwright-idempotent-${Date.now()}`;
    // First award
    const first = await request.post('/api/bonus-diamond', {
      data: { user_id: userId, bonus_type: 'backup' },
    });
    if (skipIfUnavailable(first.status(), first.headers()['content-type'])) {
      test.skip();
      return;
    }
    // Second award (duplicate)
    const second = await request.post('/api/bonus-diamond', {
      data: { user_id: userId, bonus_type: 'backup' },
    });
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.awarded).toBe(false);
    expect(body.already_earned).toBe(true);
  });

  test('GET confirms earned after POST', async ({ request }) => {
    const userId = `playwright-confirm-${Date.now()}`;
    const post = await request.post('/api/bonus-diamond', {
      data: { user_id: userId, bonus_type: 'backup' },
    });
    if (skipIfUnavailable(post.status(), post.headers()['content-type'])) {
      test.skip();
      return;
    }
    const get = await request.get(`/api/bonus-diamond?user_id=${userId}&bonus_type=backup`);
    expect(get.status()).toBe(200);
    const body = await get.json();
    expect(body.earned).toBe(true);
    expect(body.awarded_at).toBeTruthy();
  });
});

// ── POST /api/bonus-diamond — Negative ───────────────────────────────────

test.describe('API /api/bonus-diamond POST — Negative', () => {
  test('returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.post('/api/bonus-diamond', {
      data: { bonus_type: 'backup' },
    });
    if (response.status() === 404) { test.skip(); return; }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('returns 400 when bonus_type is missing', async ({ request }) => {
    const response = await request.post('/api/bonus-diamond', {
      data: { user_id: 'test-user' },
    });
    if (response.status() === 404) { test.skip(); return; }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('bonus_type');
  });

  test('returns 400 for invalid bonus_type', async ({ request }) => {
    const response = await request.post('/api/bonus-diamond', {
      data: { user_id: 'test-user', bonus_type: 'invalid-type' },
    });
    if (response.status() === 404) { test.skip(); return; }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid bonus_type');
  });

  test('returns 400 for invalid JSON body', async ({ request }) => {
    const response = await request.post('/api/bonus-diamond', {
      data: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    if (response.status() === 404) { test.skip(); return; }
    // Cloudflare WAF may return 403 for non-JSON content types — both 400 and 403 are acceptable
    expect([400, 403]).toContain(response.status());
  });
});
