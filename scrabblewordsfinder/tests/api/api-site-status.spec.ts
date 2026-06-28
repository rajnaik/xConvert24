import { test, expect } from '@playwright/test';

/**
 * API — /api/site-status
 * Tests the site status endpoint which returns and updates
 * status, logo_option, banner_option, banner_id, updated_at, updated_by.
 */

test.describe('API — /api/site-status GET', () => {
  test('GET /api/site-status returns site status row', async ({ request }) => {
    const response = await request.get('/api/site-status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(['golden', 'green', 'red']).toContain(body.status);
  });

  test('GET /api/site-status includes logo_option', async ({ request }) => {
    const response = await request.get('/api/site-status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.logo_option).toBeDefined();
    expect(typeof body.logo_option).toBe('number');
    expect(body.logo_option).toBeGreaterThanOrEqual(1);
    expect(body.logo_option).toBeLessThanOrEqual(5);
  });

  test('GET /api/site-status includes banner_option', async ({ request }) => {
    const response = await request.get('/api/site-status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.banner_option).toBeDefined();
    expect(typeof body.banner_option).toBe('number');
    expect(body.banner_option).toBeGreaterThanOrEqual(1);
    expect(body.banner_option).toBeLessThanOrEqual(10);
  });

  test('GET /api/site-status includes banner_id field', async ({ request }) => {
    const response = await request.get('/api/site-status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // banner_id may be null or a string — but the key should exist in the response
    expect('banner_id' in body).toBeTruthy();
  });

  test('GET /api/site-status includes updated_at timestamp', async ({ request }) => {
    const response = await request.get('/api/site-status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.updated_at).toBeDefined();
    expect(typeof body.updated_at).toBe('string');
  });

  test('GET /api/site-status includes adsense field', async ({ request }) => {
    const response = await request.get('/api/site-status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect('adsense' in body).toBeTruthy();
    if (body.adsense !== null) {
      expect(['ON', 'OFF']).toContain(body.adsense);
    }
  });

  test('GET /api/site-status includes updated_by field', async ({ request }) => {
    const response = await request.get('/api/site-status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect('updated_by' in body).toBeTruthy();
  });

  test('GET /api/site-status includes chatusage count', async ({ request }) => {
    const response = await request.get('/api/site-status/');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect('chatusage' in body).toBeTruthy();
    expect(typeof body.chatusage).toBe('number');
    expect(body.chatusage).toBeGreaterThanOrEqual(0);
  });
});

test.describe('API — /api/site-status GET — chatusage (Negative)', () => {
  test('GET /api/site-status chatusage is never negative', async ({ request }) => {
    const response = await request.get('/api/site-status/');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.chatusage).toBeGreaterThanOrEqual(0);
  });

  test('GET /api/site-status chatusage is an integer (not a float)', async ({ request }) => {
    const response = await request.get('/api/site-status/');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Number.isInteger(body.chatusage)).toBe(true);
  });
});

test.describe('API — /api/site-status PUT validation', () => {
  test('PUT /api/site-status rejects empty body', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('No valid fields');
  });

  test('PUT /api/site-status rejects invalid status value', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { status: 'invalid' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid status');
  });

  test('PUT /api/site-status rejects logo_option out of range (0)', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { logo_option: 0 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('logo_option');
  });

  test('PUT /api/site-status rejects logo_option out of range (6)', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { logo_option: 6 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('logo_option');
  });

  test('PUT /api/site-status rejects banner_option out of range (0)', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { banner_option: 0 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('banner_option');
  });

  test('PUT /api/site-status rejects banner_option out of range (11)', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { banner_option: 11 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('banner_option');
  });

  test('PUT /api/site-status accepts valid status update', async ({ request }) => {
    // First, get current status so we can restore it
    const getCurrent = await request.get('/api/site-status');
    const current = await getCurrent.json();

    const response = await request.put('/api/site-status', {
      data: { status: current.status, updated_by: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe(current.status);
    expect(body.updated_by).toBe('playwright-test');
  });

  test('PUT /api/site-status accepts banner_id as string', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { banner_id: 'test-banner-123', updated_by: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.banner_id).toBe('test-banner-123');
  });

  test('PUT /api/site-status accepts banner_id as null (clears it)', async ({ request }) => {
    // Set a banner_id first
    await request.put('/api/site-status', {
      data: { banner_id: 'to-be-cleared', updated_by: 'playwright-test' },
    });

    // Now clear it
    const response = await request.put('/api/site-status', {
      data: { banner_id: null, updated_by: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.banner_id).toBeNull();
  });

  test('PUT /api/site-status accepts banner_id as empty string (clears it)', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { banner_id: '', updated_by: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.banner_id).toBeNull();
  });

  test('PUT /api/site-status accepts adsense ON', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { adsense: 'ON', updated_by: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.adsense).toBe('ON');
  });

  test('PUT /api/site-status accepts adsense OFF', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { adsense: 'OFF', updated_by: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.adsense).toBe('OFF');
  });

  test('PUT /api/site-status accepts adsense case-insensitive (lowercase on)', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { adsense: 'on', updated_by: 'playwright-test' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.adsense).toBe('ON');
  });

  test('PUT /api/site-status rejects invalid adsense value', async ({ request }) => {
    const response = await request.put('/api/site-status', {
      data: { adsense: 'MAYBE' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("adsense must be 'ON' or 'OFF'");
  });

  test('PUT /api/site-status adsense toggle persists on subsequent GET (KV cache sync)', async ({ request }) => {
    // Toggle adsense to ON
    const putOn = await request.put('/api/site-status', {
      data: { adsense: 'ON', updated_by: 'playwright-kv-ttl-test' },
    });
    expect(putOn.status()).toBe(200);

    // Verify GET reflects the updated adsense value
    const getAfterOn = await request.get('/api/site-status');
    expect(getAfterOn.status()).toBe(200);
    const bodyOn = await getAfterOn.json();
    expect(bodyOn.adsense).toBe('ON');

    // Toggle adsense to OFF
    const putOff = await request.put('/api/site-status', {
      data: { adsense: 'OFF', updated_by: 'playwright-kv-ttl-test' },
    });
    expect(putOff.status()).toBe(200);

    // Verify GET reflects the toggled value
    const getAfterOff = await request.get('/api/site-status');
    expect(getAfterOff.status()).toBe(200);
    const bodyOff = await getAfterOff.json();
    expect(bodyOff.adsense).toBe('OFF');
  });

  test('PUT /api/site-status updates updated_at on change', async ({ request }) => {
    const before = await request.get('/api/site-status');
    const beforeBody = await before.json();

    // Small delay to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 1100));

    const response = await request.put('/api/site-status', {
      data: { updated_by: 'playwright-timestamp-test' },
    });
    expect(response.status()).toBe(200);
    const afterBody = await response.json();
    expect(afterBody.updated_at).not.toBe(beforeBody.updated_at);
  });
});
