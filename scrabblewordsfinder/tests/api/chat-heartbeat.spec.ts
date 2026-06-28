import { test, expect } from '@playwright/test';

/**
 * Chat Heartbeat API Tests (/api/chat-heartbeat/)
 * Tests the AI binding health check endpoint used by the admin dashboard.
 */

test.describe('Chat Heartbeat API — Positive', () => {
  test('GET /api/chat-heartbeat/ returns 200', async ({ request }) => {
    const response = await request.get('/api/chat-heartbeat/');
    expect(response.status()).toBe(200);
  });

  test('response includes healthy boolean field', async ({ request }) => {
    const response = await request.get('/api/chat-heartbeat/');
    const body = await response.json();
    expect('healthy' in body).toBeTruthy();
    expect(typeof body.healthy).toBe('boolean');
  });

  test('response includes chatusage numeric field', async ({ request }) => {
    const response = await request.get('/api/chat-heartbeat/');
    const body = await response.json();
    expect('chatusage' in body).toBeTruthy();
    expect(typeof body.chatusage).toBe('number');
    expect(body.chatusage).toBeGreaterThanOrEqual(0);
  });

  test('chatusage matches site-status chatusage value', async ({ request }) => {
    const heartbeatRes = await request.get('/api/chat-heartbeat/');
    const heartbeatBody = await heartbeatRes.json();

    const statusRes = await request.get('/api/site-status/');
    const statusBody = await statusRes.json();

    expect(heartbeatBody.chatusage).toBe(statusBody.chatusage);
  });

  test('response has JSON content-type', async ({ request }) => {
    const response = await request.get('/api/chat-heartbeat/');
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });
});

test.describe('Chat Heartbeat API — Negative', () => {
  test('response includes reason field when AI is unhealthy', async ({ request }) => {
    const response = await request.get('/api/chat-heartbeat/');
    const body = await response.json();
    // If healthy, no reason field needed. If unhealthy, reason should be present.
    if (!body.healthy) {
      expect('reason' in body).toBeTruthy();
      expect(typeof body.reason).toBe('string');
      expect(body.reason.length).toBeGreaterThan(0);
    }
  });

  test('endpoint does not accept POST method', async ({ request }) => {
    const response = await request.post('/api/chat-heartbeat/', {
      data: {},
    });
    // Should return 405 or fallback (Astro returns 404 for undefined methods)
    expect([404, 405]).toContain(response.status());
  });
});
