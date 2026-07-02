import { test, expect } from '@playwright/test';

/**
 * User Registration Payload Tests — /api/users/register/
 *
 * Layout.astro sends an enriched payload on first visit (when no avatar is cached).
 * The payload now includes: user_id, screen_width, screen_height, viewport_width,
 * viewport_height, language, referrer, timezone.
 *
 * These tests intercept the POST to /api/users/register/ and verify the payload shape.
 */

test.describe('User Registration Payload — Positive', () => {

  test('registration POST includes enriched device fields', async ({ page }) => {
    // Clear avatar to force registration
    await page.addInitScript(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'test-register-enrich-001');
    });

    let capturedPayload: any = null;
    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          json: { user_id: 'test-register-enrich-001', display_name: 'Blue Fox', avatar_id: 3, created_at: '2026-07-02 10:00:00', visit_count: 1, is_new: true },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    // Wait for the 1500ms setTimeout + fetch to fire
    await page.waitForTimeout(3000);

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.user_id).toBe('test-register-enrich-001');
    expect(capturedPayload).toHaveProperty('screen_width');
    expect(capturedPayload).toHaveProperty('screen_height');
    expect(capturedPayload).toHaveProperty('viewport_width');
    expect(capturedPayload).toHaveProperty('viewport_height');
    expect(capturedPayload).toHaveProperty('language');
    expect(capturedPayload).toHaveProperty('timezone');
    expect(capturedPayload).toHaveProperty('referrer');
  });

  test('screen_width and screen_height are positive numbers', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'test-register-screen-002');
    });

    let capturedPayload: any = null;
    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          json: { user_id: 'test-register-screen-002', display_name: 'Red Panda', avatar_id: 5, created_at: '2026-07-02 10:00:00', visit_count: 1, is_new: true },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    expect(capturedPayload).not.toBeNull();
    expect(typeof capturedPayload.screen_width).toBe('number');
    expect(typeof capturedPayload.screen_height).toBe('number');
    expect(capturedPayload.screen_width).toBeGreaterThan(0);
    expect(capturedPayload.screen_height).toBeGreaterThan(0);
  });

  test('viewport_width and viewport_height are positive numbers', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'test-register-viewport-003');
    });

    let capturedPayload: any = null;
    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          json: { user_id: 'test-register-viewport-003', display_name: 'Silver Wolf', avatar_id: 7, created_at: '2026-07-02 10:00:00', visit_count: 1, is_new: true },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    expect(capturedPayload).not.toBeNull();
    expect(typeof capturedPayload.viewport_width).toBe('number');
    expect(typeof capturedPayload.viewport_height).toBe('number');
    expect(capturedPayload.viewport_width).toBeGreaterThan(0);
    expect(capturedPayload.viewport_height).toBeGreaterThan(0);
  });

  test('language field is a non-empty string', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'test-register-lang-004');
    });

    let capturedPayload: any = null;
    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          json: { user_id: 'test-register-lang-004', display_name: 'Golden Owl', avatar_id: 2, created_at: '2026-07-02 10:00:00', visit_count: 1, is_new: true },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    expect(capturedPayload).not.toBeNull();
    expect(typeof capturedPayload.language).toBe('string');
    expect(capturedPayload.language.length).toBeGreaterThan(0);
  });

  test('timezone field is a valid IANA timezone string', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'test-register-tz-005');
    });

    let capturedPayload: any = null;
    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          json: { user_id: 'test-register-tz-005', display_name: 'Green Gecko', avatar_id: 9, created_at: '2026-07-02 10:00:00', visit_count: 1, is_new: true },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    expect(capturedPayload).not.toBeNull();
    expect(typeof capturedPayload.timezone).toBe('string');
    // IANA timezone format has a slash (e.g., America/New_York, Europe/London)
    expect(capturedPayload.timezone).toMatch(/\//);
  });
});

test.describe('User Registration Payload — Negative', () => {

  test('registration does NOT fire when avatar is already cached', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-register-cached-006');
      localStorage.setItem('swf-avatar', '4');
      localStorage.setItem('swf-display-name', 'Cached Fox');
    });

    let registerCalled = false;
    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        registerCalled = true;
        await route.fulfill({
          status: 200,
          json: { user_id: 'test-register-cached-006', display_name: 'Cached Fox', avatar_id: 4, visit_count: 5, is_new: false },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    expect(registerCalled).toBe(false);
  });

  test('registration payload always contains a valid user_id (auto-generated if missing)', async ({ page }) => {
    // Even if we remove the UID, the site auto-generates one before registration fires
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
    });

    let capturedPayload: any = null;
    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          json: { user_id: capturedPayload?.user_id || 'auto', display_name: 'Auto Fox', avatar_id: 1, created_at: '2026-07-02 10:00:00', visit_count: 1, is_new: true },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Registration fires with an auto-generated UID (u_ prefix, 10+ chars)
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.user_id).toBeTruthy();
    expect(capturedPayload.user_id.length).toBeGreaterThanOrEqual(10);
  });

  test('page does not crash if /api/users/register/ returns 500', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'test-register-error-007');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/users/register/', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, json: { error: 'Server error' } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // No uncaught errors — the .catch() handles failures gracefully
    const registerErrors = errors.filter(e => e.includes('register') || e.includes('json'));
    expect(registerErrors).toHaveLength(0);
  });

  test('page does not crash if /api/users/register/ network fails', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'test-register-netfail-008');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/users/register/', route => {
      route.abort('connectionrefused');
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(e => e.includes('register'));
    expect(criticalErrors).toHaveLength(0);
  });
});
