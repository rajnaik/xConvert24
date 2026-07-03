import { test, expect } from '@playwright/test';

/**
 * /api/emails GET — Response contract tests
 * Covers batched query behaviour, Cache-Control header,
 * filtered total count, and parameter handling.
 */

test.describe('/api/emails GET — Positive', () => {
  test('returns JSON with emails array and total count', async ({ request }) => {
    const res = await request.get('/api/emails/');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('emails');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.emails)).toBe(true);
    expect(typeof data.total).toBe('number');
  });

  test('returns Cache-Control: private, max-age=5 header', async ({ request }) => {
    const res = await request.get('/api/emails/');
    expect(res.status()).toBe(200);
    const cacheControl = res.headers()['cache-control'];
    expect(cacheControl).toBe('private, max-age=5');
  });

  test('respects limit parameter', async ({ request }) => {
    const res = await request.get('/api/emails/?limit=2');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.emails.length).toBeLessThanOrEqual(2);
  });

  test('limit is capped at 200', async ({ request }) => {
    const res = await request.get('/api/emails/?limit=999');
    expect(res.status()).toBe(200);
    const data = await res.json();
    // Should not return more than 200 rows regardless of requested limit
    expect(data.emails.length).toBeLessThanOrEqual(200);
  });

  test('filters by category and total reflects filter', async ({ request }) => {
    // Get unfiltered total first
    const allRes = await request.get('/api/emails/');
    const allData = await allRes.json();

    // Get filtered by category=contact
    const filteredRes = await request.get('/api/emails/?category=contact');
    expect(filteredRes.status()).toBe(200);
    const filteredData = await filteredRes.json();

    // Filtered total should be <= unfiltered total
    expect(filteredData.total).toBeLessThanOrEqual(allData.total);
    // All returned emails should be of the filtered category
    for (const email of filteredData.emails) {
      expect(email.category).toBe('contact');
    }
  });

  test('filters by read=0 and total reflects filter', async ({ request }) => {
    const res = await request.get('/api/emails/?read=0');
    expect(res.status()).toBe(200);
    const data = await res.json();

    // All returned emails should have read=0
    for (const email of data.emails) {
      expect(email.read).toBe(0);
    }
    // Total should match count of unread emails (>= returned length due to limit)
    expect(data.total).toBeGreaterThanOrEqual(data.emails.length);
  });

  test('combined filters (category + read) returns correct total', async ({ request }) => {
    const res = await request.get('/api/emails/?category=contact&read=0');
    expect(res.status()).toBe(200);
    const data = await res.json();

    // All results should match both filters
    for (const email of data.emails) {
      expect(email.category).toBe('contact');
      expect(email.read).toBe(0);
    }
    // Total should be >= emails.length (total is the DB count, emails is the limited slice)
    expect(data.total).toBeGreaterThanOrEqual(data.emails.length);
  });

  test('results are ordered by created_at DESC', async ({ request }) => {
    const res = await request.get('/api/emails/?limit=10');
    expect(res.status()).toBe(200);
    const data = await res.json();

    if (data.emails.length >= 2) {
      for (let i = 0; i < data.emails.length - 1; i++) {
        const current = new Date(data.emails[i].created_at).getTime();
        const next = new Date(data.emails[i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  test('default limit is 50 when not specified', async ({ request }) => {
    const res = await request.get('/api/emails/');
    expect(res.status()).toBe(200);
    const data = await res.json();
    // Should return at most 50 emails by default
    expect(data.emails.length).toBeLessThanOrEqual(50);
  });
});

test.describe('/api/emails GET — Negative', () => {
  test('invalid category filter returns empty results', async ({ request }) => {
    const res = await request.get('/api/emails/?category=nonexistent_xyz');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.emails).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  test('invalid read parameter is ignored (not 0 or 1)', async ({ request }) => {
    const res = await request.get('/api/emails/?read=invalid');
    expect(res.status()).toBe(200);
    const data = await res.json();
    // Should still return results — read filter not applied for non-0/1 values
    expect(data).toHaveProperty('emails');
    expect(data).toHaveProperty('total');
  });

  test('non-numeric limit causes server error', async ({ request }) => {
    const res = await request.get('/api/emails/?limit=abc');
    // parseInt('abc') = NaN — D1 bind rejects NaN, returns 500
    expect(res.status()).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('negative limit is handled without crash', async ({ request }) => {
    const res = await request.get('/api/emails/?limit=-5');
    // Should not 500 — may return 0 results or default behaviour
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('emails');
  });

  test('response Content-Type is application/json', async ({ request }) => {
    const res = await request.get('/api/emails/');
    expect(res.headers()['content-type']).toContain('application/json');
  });
});
