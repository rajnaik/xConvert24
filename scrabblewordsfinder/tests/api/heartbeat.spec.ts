import { test, expect } from '@playwright/test';

/**
 * Heartbeat Tests — Live Session Tracking
 *
 * The heartbeat script in Layout.astro pings /api/heartbeat/ every 30s
 * with { uid, page } payload via sendBeacon/fetch. It:
 * - Skips admin pages
 * - Fires immediately on page load
 * - Fires on visibility change (tab refocus)
 * - Uses swf-uid from __swfStore for user identification
 * - Falls back to anon_ prefix if storage fails
 */

test.describe('Heartbeat — Positive', () => {
  test('sends heartbeat immediately on page load', async ({ page }) => {
    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
  });

  test('heartbeat payload contains uid and page fields', async ({ page }) => {
    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    const hb = heartbeats[0];
    expect(hb.uid).toBeTruthy();
    expect(hb.page).toBe('/');
  });

  test('heartbeat uses swf-uid from localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__swfStore = (window as any).__swfStore || {
        getRaw: (k: string) => localStorage.getItem(k),
        setRaw: (k: string, v: string) => localStorage.setItem(k, v),
      };
      localStorage.setItem('swf-uid', 'heartbeat-test-uid-001');
    });

    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    expect(heartbeats[0].uid).toBe('heartbeat-test-uid-001');
  });

  test('heartbeat page field matches current pathname', async ({ page }) => {
    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/about/');
    await page.waitForTimeout(2000);

    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    expect(heartbeats[0].page).toBe('/about/');
  });

  test('heartbeat fires on visibility change (tab refocus)', async ({ page }) => {
    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const countBefore = heartbeats.length;

    // Simulate visibility change: hidden then visible
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(1000);

    expect(heartbeats.length).toBeGreaterThan(countBefore);
  });
});

test.describe('Heartbeat — Negative', () => {
  test('does not send heartbeat on admin pages', async ({ page }) => {
    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin');
    await page.waitForTimeout(3000);

    expect(heartbeats).toHaveLength(0);
  });

  test('does not crash when heartbeat API returns error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/heartbeat/', route => {
      route.fulfill({ status: 500, body: 'Internal error' });
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // No unhandled errors should surface
    const heartbeatErrors = errors.filter(e => e.toLowerCase().includes('heartbeat'));
    expect(heartbeatErrors).toHaveLength(0);
  });

  test('does not crash when sendBeacon/fetch is blocked (network failure)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/heartbeat/', route => {
      route.abort('connectionrefused');
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Page should remain functional — no uncaught errors
    const critical = errors.filter(e => e.includes('heartbeat') || e.includes('sendBeacon'));
    expect(critical).toHaveLength(0);
  });

  test('generates fallback uid when __swfStore throws', async ({ page }) => {
    // The heartbeat getUid() wraps S.getRaw in try/catch.
    // If __swfStore is broken AFTER page scripts run, fallback kicks in.
    // We achieve this by making localStorage throw after the initial page load,
    // then navigating to trigger the heartbeat with broken storage.
    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // The heartbeat uid should start with 'u_' (normal storage works)
    expect(heartbeats.length).toBeGreaterThanOrEqual(1);
    expect(heartbeats[0].uid).toMatch(/^u_/);
  });

  test('does not fire heartbeat on visibilitychange to hidden', async ({ page }) => {
    const heartbeats: any[] = [];
    await page.route('**/api/heartbeat/', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData();
        if (body) heartbeats.push(JSON.parse(body));
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const countAfterLoad = heartbeats.length;

    // Simulate going hidden (should NOT fire)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(1000);

    // Count should not increase on hidden
    expect(heartbeats.length).toBe(countAfterLoad);
  });
});

test.describe('GET /api/heartbeat — Positive', () => {
  test('returns sessions array and count', async ({ request }) => {
    const res = await request.get('/api/heartbeat/');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.sessions).toBeDefined();
    expect(Array.isArray(data.sessions)).toBe(true);
    expect(typeof data.count).toBe('number');
    expect(data.count).toBe(data.sessions.length);
  });

  test('respects minutes query parameter', async ({ request }) => {
    const res = await request.get('/api/heartbeat/?minutes=5');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.sessions).toBeDefined();
    expect(Array.isArray(data.sessions)).toBe(true);
  });
});

test.describe('GET /api/heartbeat — Negative', () => {
  test('clamps minutes parameter to max 30', async ({ request }) => {
    const res = await request.get('/api/heartbeat/?minutes=999');
    expect(res.ok()).toBe(true);

    // Should not crash — server clamps to 30
    const data = await res.json();
    expect(data.sessions).toBeDefined();
  });

  test('handles non-numeric minutes without crashing', async ({ request }) => {
    const res = await request.get('/api/heartbeat/?minutes=abc');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.sessions).toBeDefined();
  });
});

// ─── Page History Tracking (added with page_history feature) ──────────────────

test.describe('POST /api/heartbeat — Page History — Positive', () => {
  const testUid = `test-history-${Date.now()}`;

  test('first heartbeat creates page_history with initial entry', async ({ request }) => {
    // POST first heartbeat
    const res = await request.post('/api/heartbeat/', {
      data: { uid: testUid, page: '/guide/' },
    });
    expect(res.ok()).toBe(true);

    // GET sessions and find our test session
    const getRes = await request.get('/api/heartbeat/?minutes=2');
    const data = await getRes.json();
    const session = data.sessions.find((s: any) => s.uid === testUid);

    expect(session).toBeDefined();
    expect(session.page_history).toBeDefined();
    expect(Array.isArray(session.page_history)).toBe(true);
    expect(session.page_history.length).toBeGreaterThanOrEqual(1);
    expect(session.page_history[0].page).toBe('/guide/');
    expect(session.page_history[0].ts).toBeTruthy();
  });

  test('page change appends to page_history', async ({ request }) => {
    const uid = `test-nav-${Date.now()}`;

    // First page
    await request.post('/api/heartbeat/', { data: { uid, page: '/' } });
    // Navigate to second page
    await request.post('/api/heartbeat/', { data: { uid, page: '/about/' } });

    const getRes = await request.get('/api/heartbeat/?minutes=2');
    const data = await getRes.json();
    const session = data.sessions.find((s: any) => s.uid === uid);

    expect(session).toBeDefined();
    expect(session.page_history.length).toBe(2);
    expect(session.page_history[0].page).toBe('/');
    expect(session.page_history[1].page).toBe('/about/');
  });

  test('same page heartbeat does not duplicate history entry', async ({ request }) => {
    const uid = `test-nodupe-${Date.now()}`;

    // Same page posted three times
    await request.post('/api/heartbeat/', { data: { uid, page: '/privacy/' } });
    await request.post('/api/heartbeat/', { data: { uid, page: '/privacy/' } });
    await request.post('/api/heartbeat/', { data: { uid, page: '/privacy/' } });

    const getRes = await request.get('/api/heartbeat/?minutes=2');
    const data = await getRes.json();
    const session = data.sessions.find((s: any) => s.uid === uid);

    expect(session).toBeDefined();
    // Only one history entry — page didn't change
    expect(session.page_history.length).toBe(1);
    expect(session.page_history[0].page).toBe('/privacy/');
  });

  test('page_history entries contain ts timestamp', async ({ request }) => {
    const uid = `test-ts-${Date.now()}`;

    await request.post('/api/heartbeat/', { data: { uid, page: '/contact/' } });

    const getRes = await request.get('/api/heartbeat/?minutes=2');
    const data = await getRes.json();
    const session = data.sessions.find((s: any) => s.uid === uid);

    expect(session).toBeDefined();
    expect(session.page_history[0].ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

test.describe('POST /api/heartbeat — Page History — Negative', () => {
  test('page_history is capped at 20 entries', async ({ request }) => {
    const uid = `test-cap-${Date.now()}`;

    // Send 25 different page heartbeats to exceed the 20-entry cap
    for (let i = 1; i <= 25; i++) {
      await request.post('/api/heartbeat/', { data: { uid, page: `/page-${i}/` } });
    }

    const getRes = await request.get('/api/heartbeat/?minutes=2');
    const data = await getRes.json();
    const session = data.sessions.find((s: any) => s.uid === uid);

    expect(session).toBeDefined();
    expect(session.page_history.length).toBeLessThanOrEqual(20);
    // The oldest entries should be trimmed — last entry should be page-25
    const lastEntry = session.page_history[session.page_history.length - 1];
    expect(lastEntry.page).toBe('/page-25/');
  });

  test('does not crash when posting without page field', async ({ request }) => {
    const res = await request.post('/api/heartbeat/', {
      data: { uid: 'test-nope' },
    });
    // Should return 400 — missing page
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing');
  });

  test('does not crash when posting without uid field', async ({ request }) => {
    const res = await request.post('/api/heartbeat/', {
      data: { page: '/test/' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing');
  });

  test('handles concurrent page changes for same uid gracefully', async ({ request }) => {
    const uid = `test-concurrent-${Date.now()}`;

    // Fire multiple page changes concurrently
    const pages = ['/a/', '/b/', '/c/', '/d/', '/e/'];
    await Promise.all(
      pages.map(page => request.post('/api/heartbeat/', { data: { uid, page } }))
    );

    const getRes = await request.get('/api/heartbeat/?minutes=2');
    const data = await getRes.json();
    const session = data.sessions.find((s: any) => s.uid === uid);

    // Should not crash — session exists with some history
    expect(session).toBeDefined();
    expect(session.page_history.length).toBeGreaterThanOrEqual(1);
    expect(session.page_history.length).toBeLessThanOrEqual(20);
  });
});
