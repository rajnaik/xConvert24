import { test, expect } from '@playwright/test';

/**
 * API — /api/stars-and-diamonds/
 * Tests the Stars & Diamonds admin API endpoint which returns
 * all users' reward data + summary stats from the user_rewards table.
 */

const ENDPOINT = '/api/stars-and-diamonds/';

test.describe('API — /api/stars-and-diamonds GET — Positive', () => {
  test('GET /api/stars-and-diamonds/ returns 200', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    expect(response.status()).toBe(200);
  });

  test('response has Content-Type application/json', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('response body contains summary object', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(body.summary).toBeDefined();
    expect(typeof body.summary).toBe('object');
  });

  test('summary has totalUsers field as a number', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(typeof body.summary.totalUsers).toBe('number');
    expect(body.summary.totalUsers).toBeGreaterThanOrEqual(0);
  });

  test('summary has totalStars field as a number', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(typeof body.summary.totalStars).toBe('number');
    expect(body.summary.totalStars).toBeGreaterThanOrEqual(0);
  });

  test('summary has totalDiamonds field as a number', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(typeof body.summary.totalDiamonds).toBe('number');
    expect(body.summary.totalDiamonds).toBeGreaterThanOrEqual(0);
  });

  test('summary has totalBonusDiamonds field as a number', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(typeof body.summary.totalBonusDiamonds).toBe('number');
    expect(body.summary.totalBonusDiamonds).toBeGreaterThanOrEqual(0);
  });

  test('response body contains rewards array', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(Array.isArray(body.rewards)).toBe(true);
  });

  test('rewards array length matches summary totalUsers', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(body.rewards.length).toBe(body.summary.totalUsers);
  });

  test('each reward entry has expected fields', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    if (body.rewards.length > 0) {
      const first = body.rewards[0];
      expect(first).toHaveProperty('user_id');
      expect(first).toHaveProperty('total_stars');
      expect(first).toHaveProperty('total_diamonds');
      expect(first).toHaveProperty('bonus_diamonds');
      expect(first).toHaveProperty('current_streak');
      expect(first).toHaveProperty('best_streak');
      expect(first).toHaveProperty('diamond_streak');
      expect(first).toHaveProperty('best_diamond_streak');
      expect(first).toHaveProperty('last_active_date');
      expect(first).toHaveProperty('created_at');
    }
  });

  test('reward numeric fields are numbers (not strings)', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    if (body.rewards.length > 0) {
      const first = body.rewards[0];
      expect(typeof first.total_stars).toBe('number');
      expect(typeof first.total_diamonds).toBe('number');
      expect(typeof first.bonus_diamonds).toBe('number');
      expect(typeof first.current_streak).toBe('number');
      expect(typeof first.best_streak).toBe('number');
      expect(typeof first.diamond_streak).toBe('number');
      expect(typeof first.best_diamond_streak).toBe('number');
    }
  });

  test('rewards are ordered by total_stars descending', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    if (body.rewards.length > 1) {
      for (let i = 0; i < body.rewards.length - 1; i++) {
        expect(body.rewards[i].total_stars).toBeGreaterThanOrEqual(body.rewards[i + 1].total_stars);
      }
    }
  });

  test('rewards array is capped at 200 entries', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const body = await response.json();
    expect(body.rewards.length).toBeLessThanOrEqual(200);
  });
});

test.describe('API — /api/stars-and-diamonds GET — Negative', () => {
  test('POST method is not allowed (405 or no handler)', async ({ request }) => {
    const response = await request.post(ENDPOINT, { data: {} });
    // Should not return 200 since only GET is exported
    expect(response.status()).not.toBe(200);
  });

  test('PUT method is not allowed', async ({ request }) => {
    const response = await request.put(ENDPOINT, { data: {} });
    expect(response.status()).not.toBe(200);
  });

  test('DELETE method is not allowed', async ({ request }) => {
    const response = await request.delete(ENDPOINT);
    expect(response.status()).not.toBe(200);
  });

  test('response does not expose raw DB errors', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const text = await response.text();
    expect(text).not.toContain('D1_ERROR');
    expect(text).not.toContain('SQLITE_');
    expect(text).not.toContain('syntax error');
  });

  test('response does not contain sensitive data patterns', async ({ request }) => {
    const response = await request.get(ENDPOINT);
    const text = await response.text();
    expect(text).not.toContain('password');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('api_key');
  });
});
