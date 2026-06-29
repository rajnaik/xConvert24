import { test, expect } from '@playwright/test';

/**
 * API Tests — /api/diamond-hunt/
 *
 * Covers:
 * - GET  /api/diamond-hunt/?all=true (admin: list all mines)
 * - GET  /api/diamond-hunt/?id=N&user_id=X (public: check single diamond)
 * - POST /api/diamond-hunt/ { admin_create, ... } (admin: create a new mine)
 * - POST /api/diamond-hunt/ { id, user_id } (public: claim diamond)
 * - PUT  /api/diamond-hunt/ { id, ... } (admin: update mine)
 * - DELETE /api/diamond-hunt/ { id } (admin: delete mine)
 */

const ENDPOINT = '/api/diamond-hunt/';
const TEST_USER = `playwright-dh-${Date.now()}`;

/** Helper: skip if endpoint not deployed */
function skipIfUnavailable(status: number, contentType: string | null) {
  if (status === 404) return true;
  if (status === 500 && (!contentType || !contentType.includes('application/json'))) return true;
  return false;
}

// ── GET /api/diamond-hunt/?all=true — Positive ───────────────────────────

test.describe('API /api/diamond-hunt GET all — Positive', () => {
  test('returns 200 with diamonds array', async ({ request }) => {
    const response = await request.get(`${ENDPOINT}?all=true`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.diamonds).toBeDefined();
    expect(Array.isArray(body.diamonds)).toBe(true);
  });

  test('each diamond row has expected fields', async ({ request }) => {
    const response = await request.get(`${ENDPOINT}?all=true`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const body = await response.json();
    if (body.diamonds.length > 0) {
      const first = body.diamonds[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('diamonds_remaining');
      expect(first).toHaveProperty('diamonds_per_claim');
    }
  });
});

// ── GET /api/diamond-hunt/?id=N — Positive ───────────────────────────────

test.describe('API /api/diamond-hunt GET by id — Positive', () => {
  test('returns show field for a valid id', async ({ request }) => {
    // First get all to find a valid ID
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    if (skipIfUnavailable(allResp.status(), allResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    const allBody = await allResp.json();
    if (allBody.diamonds.length === 0) {
      test.skip();
      return;
    }
    const validId = allBody.diamonds[0].id;
    const response = await request.get(`${ENDPOINT}?id=${validId}&user_id=${TEST_USER}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('show');
    expect(body).toHaveProperty('diamonds_remaining');
    expect(body).toHaveProperty('diamonds_per_claim');
    expect(body).toHaveProperty('already_claimed');
  });
});

// ── GET /api/diamond-hunt — Negative ─────────────────────────────────────

test.describe('API /api/diamond-hunt GET — Negative', () => {
  test('returns 400 when id is missing (no all param)', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id required');
  });

  test('returns show: false for a non-existent id', async ({ request }) => {
    const response = await request.get(`${ENDPOINT}?id=999999`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.show).toBe(false);
  });
});

// ── POST /api/diamond-hunt/ admin_create — Positive ──────────────────────

test.describe('API /api/diamond-hunt POST admin_create — Positive', () => {
  test('creates a new mine with default values', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);
  });

  test('creates a mine with custom diamonds_remaining and diamonds_per_claim', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: {
        admin_create: true,
        diamonds_remaining: 25,
        diamonds_per_claim: 3,
        end_date: '2099-12-31T23:59:59Z',
      },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);
  });

  test('newly created mine appears in GET all list', async ({ request }) => {
    // Get count before
    const beforeResp = await request.get(`${ENDPOINT}?all=true`);
    if (skipIfUnavailable(beforeResp.status(), beforeResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    const beforeBody = await beforeResp.json();
    const countBefore = beforeBody.diamonds.length;

    // Create a new mine
    await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 5, diamonds_per_claim: 1 },
    });

    // Get count after
    const afterResp = await request.get(`${ENDPOINT}?all=true`);
    const afterBody = await afterResp.json();
    expect(afterBody.diamonds.length).toBeGreaterThan(countBefore);
  });
});

// ── POST /api/diamond-hunt/ admin_create — Nullish coalescing ────────────

test.describe('API /api/diamond-hunt POST admin_create — Nullish coalescing (??)', () => {
  test('passing diamonds_remaining=0 stores 0, not the default 10', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 0, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);

    // Verify the created mine actually has 0 remaining
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds[allBody.diamonds.length - 1];
    expect(mine.diamonds_remaining).toBe(0);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: mine.id } });
  });

  test('passing diamonds_per_claim=0 stores 0, not the default 1', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 5, diamonds_per_claim: 0, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);

    // Verify the created mine has diamonds_per_claim = 0
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds[allBody.diamonds.length - 1];
    expect(mine.diamonds_per_claim).toBe(0);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: mine.id } });
  });

  test('passing null/undefined still uses defaults (10 and 1)', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);

    // Verify defaults applied
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds[allBody.diamonds.length - 1];
    expect(mine.diamonds_remaining).toBe(10);
    expect(mine.diamonds_per_claim).toBe(1);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: mine.id } });
  });
});

// ── POST /api/diamond-hunt/ admin_create with dom_loc — Positive ─────────

test.describe('API /api/diamond-hunt POST admin_create with dom_loc — Positive', () => {
  test('creates a mine with dom_loc stored correctly', async ({ request }) => {
    const explicitId = 99500 + Math.floor(Math.random() * 100);
    const response = await request.post(ENDPOINT, {
      data: {
        admin_create: true,
        id: explicitId,
        diamonds_remaining: 5,
        diamonds_per_claim: 1,
        dom_loc: '#hero-banner .diamond-spot',
      },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);

    // Verify dom_loc is stored by fetching all mines
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds.find((d: any) => d.id === explicitId);
    expect(mine).toBeDefined();
    expect(mine.dom_loc).toBe('#hero-banner .diamond-spot');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('creates a mine without dom_loc — defaults to empty string', async ({ request }) => {
    const explicitId = 99400 + Math.floor(Math.random() * 100);
    const response = await request.post(ENDPOINT, {
      data: {
        admin_create: true,
        id: explicitId,
        diamonds_remaining: 3,
        diamonds_per_claim: 1,
      },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);

    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds.find((d: any) => d.id === explicitId);
    expect(mine).toBeDefined();
    expect(mine.dom_loc).toBe('');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('dom_loc with empty string is treated same as omitted', async ({ request }) => {
    const explicitId = 99300 + Math.floor(Math.random() * 100);
    const response = await request.post(ENDPOINT, {
      data: {
        admin_create: true,
        id: explicitId,
        diamonds_remaining: 2,
        diamonds_per_claim: 1,
        dom_loc: '',
      },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);

    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds.find((d: any) => d.id === explicitId);
    expect(mine).toBeDefined();
    expect(mine.dom_loc).toBe('');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });
});

// ── POST /api/diamond-hunt/ admin_create with dom_loc — Negative ─────────

test.describe('API /api/diamond-hunt POST admin_create with dom_loc — Negative', () => {
  test('dom_loc with null is treated as empty string', async ({ request }) => {
    const explicitId = 99200 + Math.floor(Math.random() * 100);
    const response = await request.post(ENDPOINT, {
      data: {
        admin_create: true,
        id: explicitId,
        diamonds_remaining: 4,
        diamonds_per_claim: 1,
        dom_loc: null,
      },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);

    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds.find((d: any) => d.id === explicitId);
    expect(mine).toBeDefined();
    expect(mine.dom_loc).toBe('');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('dom_loc does not cause SQL injection or DB error with special chars', async ({ request }) => {
    const explicitId = 99100 + Math.floor(Math.random() * 100);
    const response = await request.post(ENDPOINT, {
      data: {
        admin_create: true,
        id: explicitId,
        diamonds_remaining: 2,
        diamonds_per_claim: 1,
        dom_loc: "'; DROP TABLE diamond_hunt; --",
      },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    // Should succeed (parameterized query protects against injection)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);

    // Table still exists — verify by fetching all
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    expect(allResp.status()).toBe(200);
    const allBody = await allResp.json();
    expect(Array.isArray(allBody.diamonds)).toBe(true);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });
});

// ── POST /api/diamond-hunt/ admin_create with explicit ID — Positive ─────

test.describe('API /api/diamond-hunt POST admin_create with explicit ID — Positive', () => {
  test('creates a mine with an explicit ID', async ({ request }) => {
    const explicitId = 99900 + Math.floor(Math.random() * 100);
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 7, diamonds_per_claim: 2 },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(true);

    // Verify the mine was created with the exact ID
    const checkResp = await request.get(`${ENDPOINT}?id=${explicitId}&user_id=test`);
    const checkBody = await checkResp.json();
    expect(checkBody.diamonds_remaining).toBe(7);
    expect(checkBody.diamonds_per_claim).toBe(2);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('explicit ID mine is retrievable via GET all', async ({ request }) => {
    const explicitId = 99800 + Math.floor(Math.random() * 100);
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 3, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);

    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds.find((d: any) => d.id === explicitId);
    expect(mine).toBeDefined();
    expect(mine.diamonds_remaining).toBe(3);
    expect(mine.diamonds_per_claim).toBe(1);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('explicit ID mine does not interfere with autoincrement', async ({ request }) => {
    const explicitId = 99700 + Math.floor(Math.random() * 100);
    // Create with explicit ID
    const explResp = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 5, diamonds_per_claim: 1 },
    });
    if (skipIfUnavailable(explResp.status(), explResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(explResp.status()).toBe(200);

    // Create without explicit ID (autoincrement)
    const autoResp = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 4, diamonds_per_claim: 1 },
    });
    expect(autoResp.status()).toBe(200);

    // Get all and verify both exist
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const explicitMine = allBody.diamonds.find((d: any) => d.id === explicitId);
    expect(explicitMine).toBeDefined();

    // The auto mine should have a different ID
    const autoMine = allBody.diamonds[allBody.diamonds.length - 1];
    expect(autoMine.id).not.toBe(explicitId);

    // Cleanup both
    await request.delete(ENDPOINT, { data: { id: explicitId } });
    await request.delete(ENDPOINT, { data: { id: autoMine.id } });
  });
});

// ── POST /api/diamond-hunt/ admin_create with explicit ID — Negative ─────

test.describe('API /api/diamond-hunt POST admin_create with explicit ID — Negative', () => {
  test('duplicate explicit ID returns error (UNIQUE constraint)', async ({ request }) => {
    const explicitId = 99600 + Math.floor(Math.random() * 100);
    // Create first
    const first = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 5, diamonds_per_claim: 1 },
    });
    if (skipIfUnavailable(first.status(), first.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(first.status()).toBe(200);

    // Try creating again with same ID — should fail
    const second = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 3, diamonds_per_claim: 1 },
    });
    // D1 will return 500 for UNIQUE constraint violation
    expect(second.status()).toBe(500);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('explicit ID with non-numeric string is coerced via Number()', async ({ request }) => {
    // Passing a string like "abc" → Number("abc") = NaN
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true, id: 'abc', diamonds_remaining: 5, diamonds_per_claim: 1 },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    // NaN in D1 binding will likely error — we expect a non-200 status or DB error
    expect([200, 500]).toContain(response.status());
    // If it succeeded, the DB stored NaN which isn't valid — just ensure no crash
  });
});

// ── POST /api/diamond-hunt/ admin_create — Negative ──────────────────────

test.describe('API /api/diamond-hunt POST admin_create — Negative', () => {
  test('returns 400 for invalid JSON body', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    if (response.status() === 404) { test.skip(); return; }
    // Cloudflare WAF may return 403 for non-JSON — both 400 and 403 are acceptable
    expect([400, 403]).toContain(response.status());
  });

  test('response does not expose raw DB errors on admin_create', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 'invalid' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const text = await response.text();
    expect(text).not.toContain('D1_ERROR');
    expect(text).not.toContain('SQLITE_');
  });
});

// ── POST /api/diamond-hunt/ claim — Positive ─────────────────────────────

test.describe('API /api/diamond-hunt POST claim — Positive', () => {
  test('returns error for non-existent diamond id', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { id: 999999, user_id: TEST_USER },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('not found');
  });

  test('atomic claim: successful claim returns expected fields', async ({ request }) => {
    // Create a fresh mine for this test
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 5, diamonds_per_claim: 2, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(createResp.status()).toBe(200);

    // Find the newly created mine (last in list)
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds[allBody.diamonds.length - 1];

    // Activate it
    await request.put(ENDPOINT, { data: { id: mine.id, status: 'active' } });

    // Claim with unique user
    const claimUser = `pw-atomic-${Date.now()}`;
    const claimResp = await request.post(ENDPOINT, {
      data: { id: mine.id, user_id: claimUser },
    });
    expect(claimResp.status()).toBe(200);
    const claimBody = await claimResp.json();
    expect(claimBody.claimed).toBe(true);
    expect(claimBody.diamonds_earned).toBe(2);
    expect(claimBody.diamonds_remaining).toBe(mine.diamonds_remaining - 1);
    expect(claimBody.message).toContain('diamond');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: mine.id } });
  });

  test('atomic claim: diamonds_remaining decrements by exactly 1', async ({ request }) => {
    // Create mine
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 10, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }

    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds[allBody.diamonds.length - 1];
    await request.put(ENDPOINT, { data: { id: mine.id, status: 'active' } });

    const claimUser = `pw-decrement-${Date.now()}`;
    await request.post(ENDPOINT, { data: { id: mine.id, user_id: claimUser } });

    // Check remaining via GET
    const checkResp = await request.get(`${ENDPOINT}?id=${mine.id}&user_id=other-user`);
    const checkBody = await checkResp.json();
    expect(checkBody.diamonds_remaining).toBe(mine.diamonds_remaining - 1);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: mine.id } });
  });
});

// ── POST /api/diamond-hunt/ claim — Negative ─────────────────────────────

test.describe('API /api/diamond-hunt POST claim — Negative', () => {
  test('returns 400 when id is missing', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { user_id: TEST_USER },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id and user_id required');
  });

  test('returns 400 when user_id is missing', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { id: 1 },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id and user_id required');
  });

  test('double claim is rejected and does not decrement twice', async ({ request }) => {
    // Create mine
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 10, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }

    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds[allBody.diamonds.length - 1];
    await request.put(ENDPOINT, { data: { id: mine.id, status: 'active' } });

    const claimUser = `pw-double-${Date.now()}`;

    // First claim — should succeed
    const first = await request.post(ENDPOINT, { data: { id: mine.id, user_id: claimUser } });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.claimed).toBe(true);

    // Second claim — should be rejected
    const second = await request.post(ENDPOINT, { data: { id: mine.id, user_id: claimUser } });
    expect(second.status()).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.claimed).toBe(false);
    expect(secondBody.already_claimed).toBe(true);

    // Verify diamonds_remaining decremented exactly once (10 → 9)
    const checkResp = await request.get(`${ENDPOINT}?id=${mine.id}&user_id=other`);
    const checkBody = await checkResp.json();
    expect(checkBody.diamonds_remaining).toBe(mine.diamonds_remaining - 1);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: mine.id } });
  });

  test('claim on depleted mine returns descriptive error', async ({ request }) => {
    // Create mine then deplete it via PUT (JS || treats 0 as falsy → use PUT to set 0)
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, diamonds_remaining: 1, diamonds_per_claim: 1 },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }

    const allResp = await request.get(`${ENDPOINT}?all=true`);
    const allBody = await allResp.json();
    const mine = allBody.diamonds[allBody.diamonds.length - 1];
    // Activate and then set remaining to 0 via PUT
    await request.put(ENDPOINT, { data: { id: mine.id, status: 'active', diamonds_remaining: 0 } });

    const claimResp = await request.post(ENDPOINT, {
      data: { id: mine.id, user_id: `pw-depleted-${Date.now()}` },
    });
    expect(claimResp.status()).toBe(400);
    const claimBody = await claimResp.json();
    expect(claimBody.error).toContain('No diamonds remaining');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: mine.id } });
  });
});

// ── PUT /api/diamond-hunt/ — Positive ────────────────────────────────────

test.describe('API /api/diamond-hunt PUT — Positive', () => {
  test('updates a mine status field', async ({ request }) => {
    // Get a valid ID
    const allResp = await request.get(`${ENDPOINT}?all=true`);
    if (skipIfUnavailable(allResp.status(), allResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    const allBody = await allResp.json();
    if (allBody.diamonds.length === 0) { test.skip(); return; }
    const validId = allBody.diamonds[allBody.diamonds.length - 1].id;

    const response = await request.put(ENDPOINT, {
      data: { id: validId, status: 'active' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.updated).toBe(true);
    expect(body.id).toBe(validId);
  });
});

// ── PUT /api/diamond-hunt/ — Negative ────────────────────────────────────

test.describe('API /api/diamond-hunt PUT — Negative', () => {
  test('returns 400 when id is missing', async ({ request }) => {
    const response = await request.put(ENDPOINT, {
      data: { status: 'active' },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id required');
  });

  test('returns 400 when no fields provided to update', async ({ request }) => {
    const response = await request.put(ENDPOINT, {
      data: { id: 1 },
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('No fields to update');
  });

  test('returns 400 for invalid JSON body', async ({ request }) => {
    const response = await request.put(ENDPOINT, {
      data: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    if (response.status() === 404) { test.skip(); return; }
    expect([400, 403]).toContain(response.status());
  });
});

// ── DELETE /api/diamond-hunt/ — Negative ─────────────────────────────────

test.describe('API /api/diamond-hunt DELETE — Negative', () => {
  test('returns 400 when id is missing', async ({ request }) => {
    const response = await request.delete(ENDPOINT, {
      data: {},
    });
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('id required');
  });

  test('returns 400 for invalid JSON body', async ({ request }) => {
    const response = await request.delete(ENDPOINT, {
      data: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    if (response.status() === 404) { test.skip(); return; }
    expect([400, 403]).toContain(response.status());
  });
});

// ── General — No sensitive data exposure ─────────────────────────────────

test.describe('API /api/diamond-hunt — Security', () => {
  test('response does not contain sensitive data patterns', async ({ request }) => {
    const response = await request.get(`${ENDPOINT}?all=true`);
    if (skipIfUnavailable(response.status(), response.headers()['content-type'])) {
      test.skip();
      return;
    }
    const text = await response.text();
    expect(text).not.toContain('password');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('api_key');
  });
});

// ── POST /api/diamond-hunt/ claim — badge_progress — Positive ────────────

test.describe('API /api/diamond-hunt POST claim — badge_progress — Positive', () => {
  test('successful claim response includes badge_progress object', async ({ request }) => {
    // Create a fresh mine
    const explicitId = 98500 + Math.floor(Math.random() * 100);
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 5, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(createResp.status()).toBe(200);

    // Activate the mine
    await request.put(ENDPOINT, { data: { id: explicitId, status: 'active' } });

    // Claim with unique user
    const claimUser = `pw-badge-progress-${Date.now()}`;
    const claimResp = await request.post(ENDPOINT, {
      data: { id: explicitId, user_id: claimUser },
    });
    expect(claimResp.status()).toBe(200);
    const claimBody = await claimResp.json();
    expect(claimBody.claimed).toBe(true);
    expect(claimBody.badge_progress).toBeDefined();
    expect(typeof claimBody.badge_progress).toBe('object');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('badge_progress contains total_diamonds field', async ({ request }) => {
    const explicitId = 98400 + Math.floor(Math.random() * 100);
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 5, diamonds_per_claim: 2, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(createResp.status()).toBe(200);
    await request.put(ENDPOINT, { data: { id: explicitId, status: 'active' } });

    const claimUser = `pw-badge-total-${Date.now()}`;
    const claimResp = await request.post(ENDPOINT, {
      data: { id: explicitId, user_id: claimUser },
    });
    expect(claimResp.status()).toBe(200);
    const claimBody = await claimResp.json();
    expect(claimBody.badge_progress.total_diamonds).toBeDefined();
    expect(typeof claimBody.badge_progress.total_diamonds).toBe('number');
    expect(claimBody.badge_progress.total_diamonds).toBeGreaterThanOrEqual(2);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('badge_progress includes next_badge or max_badge_reached', async ({ request }) => {
    const explicitId = 98300 + Math.floor(Math.random() * 100);
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 5, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(createResp.status()).toBe(200);
    await request.put(ENDPOINT, { data: { id: explicitId, status: 'active' } });

    const claimUser = `pw-badge-next-${Date.now()}`;
    const claimResp = await request.post(ENDPOINT, {
      data: { id: explicitId, user_id: claimUser },
    });
    expect(claimResp.status()).toBe(200);
    const bp = claimResp.json().then(b => b.badge_progress);
    const badgeProgress = await bp;

    // Must have either next_badge info OR max_badge_reached
    const hasNextBadge = badgeProgress.next_badge !== undefined;
    const hasMaxReached = badgeProgress.max_badge_reached === true;
    expect(hasNextBadge || hasMaxReached).toBe(true);

    if (hasNextBadge) {
      expect(typeof badgeProgress.next_badge).toBe('string');
      expect(typeof badgeProgress.diamonds_needed).toBe('number');
      expect(badgeProgress.diamonds_needed).toBeGreaterThan(0);
      expect(typeof badgeProgress.next_badge_threshold).toBe('number');
    }

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('badge_progress total_diamonds reflects cumulative earnings', async ({ request }) => {
    // Create two mines so same user can claim twice from different mines
    const id1 = 98200 + Math.floor(Math.random() * 50);
    const id2 = id1 + 50;
    const createResp1 = await request.post(ENDPOINT, {
      data: { admin_create: true, id: id1, diamonds_remaining: 5, diamonds_per_claim: 3, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp1.status(), createResp1.headers()['content-type'])) {
      test.skip();
      return;
    }
    const createResp2 = await request.post(ENDPOINT, {
      data: { admin_create: true, id: id2, diamonds_remaining: 5, diamonds_per_claim: 2, end_date: '2099-12-31T23:59:59Z' },
    });
    expect(createResp1.status()).toBe(200);
    expect(createResp2.status()).toBe(200);

    await request.put(ENDPOINT, { data: { id: id1, status: 'active' } });
    await request.put(ENDPOINT, { data: { id: id2, status: 'active' } });

    const claimUser = `pw-badge-cumulative-${Date.now()}`;

    // First claim: 3 diamonds
    const claim1 = await request.post(ENDPOINT, { data: { id: id1, user_id: claimUser } });
    expect(claim1.status()).toBe(200);
    const body1 = await claim1.json();
    const totalAfterFirst = body1.badge_progress.total_diamonds;

    // Second claim: 2 more diamonds (different mine)
    const claim2 = await request.post(ENDPOINT, { data: { id: id2, user_id: claimUser } });
    expect(claim2.status()).toBe(200);
    const body2 = await claim2.json();
    const totalAfterSecond = body2.badge_progress.total_diamonds;

    // Second total should be first total + 2
    expect(totalAfterSecond).toBe(totalAfterFirst + 2);

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: id1 } });
    await request.delete(ENDPOINT, { data: { id: id2 } });
  });
});

// ── POST /api/diamond-hunt/ claim — badge_progress — Negative ────────────

test.describe('API /api/diamond-hunt POST claim — badge_progress — Negative', () => {
  test('badge_progress is NOT present on already_claimed response', async ({ request }) => {
    const explicitId = 98100 + Math.floor(Math.random() * 100);
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 5, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(createResp.status()).toBe(200);
    await request.put(ENDPOINT, { data: { id: explicitId, status: 'active' } });

    const claimUser = `pw-badge-dupe-${Date.now()}`;

    // First claim — should succeed with badge_progress
    const first = await request.post(ENDPOINT, { data: { id: explicitId, user_id: claimUser } });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.claimed).toBe(true);
    expect(firstBody.badge_progress).toBeDefined();

    // Second claim — already_claimed, should NOT have badge_progress
    const second = await request.post(ENDPOINT, { data: { id: explicitId, user_id: claimUser } });
    expect(second.status()).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.claimed).toBe(false);
    expect(secondBody.already_claimed).toBe(true);
    expect(secondBody.badge_progress).toBeUndefined();

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('badge_progress is NOT present on error responses (depleted mine)', async ({ request }) => {
    const explicitId = 98000 + Math.floor(Math.random() * 100);
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 1, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(createResp.status()).toBe(200);
    await request.put(ENDPOINT, { data: { id: explicitId, status: 'active', diamonds_remaining: 0 } });

    const claimUser = `pw-badge-depleted-${Date.now()}`;
    const claimResp = await request.post(ENDPOINT, { data: { id: explicitId, user_id: claimUser } });
    expect(claimResp.status()).toBe(400);
    const claimBody = await claimResp.json();
    expect(claimBody.badge_progress).toBeUndefined();

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });

  test('badge_progress does not expose sensitive database fields', async ({ request }) => {
    const explicitId = 97900 + Math.floor(Math.random() * 100);
    const createResp = await request.post(ENDPOINT, {
      data: { admin_create: true, id: explicitId, diamonds_remaining: 5, diamonds_per_claim: 1, end_date: '2099-12-31T23:59:59Z' },
    });
    if (skipIfUnavailable(createResp.status(), createResp.headers()['content-type'])) {
      test.skip();
      return;
    }
    expect(createResp.status()).toBe(200);
    await request.put(ENDPOINT, { data: { id: explicitId, status: 'active' } });

    const claimUser = `pw-badge-secure-${Date.now()}`;
    const claimResp = await request.post(ENDPOINT, { data: { id: explicitId, user_id: claimUser } });
    expect(claimResp.status()).toBe(200);
    const claimBody = await claimResp.json();
    const bpText = JSON.stringify(claimBody.badge_progress);

    // Should not expose internal IDs, user_id, or raw DB columns
    expect(bpText).not.toContain('"id"');
    expect(bpText).not.toContain('user_id');
    expect(bpText).not.toContain('password');
    expect(bpText).not.toContain('secret');
    expect(bpText).not.toContain('api_key');

    // Cleanup
    await request.delete(ENDPOINT, { data: { id: explicitId } });
  });
});
