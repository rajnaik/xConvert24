import { test, expect } from '@playwright/test';

/**
 * Avatar Auto-Registration — Layout.astro inline script
 *
 * On first visit (no swf-avatar in localStorage), the script POSTs to
 * /api/users/register/ with the user's UID to receive an avatar_id and
 * display_name which are then stored in localStorage.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Avatar Auto-Registration — Positive', () => {
  test('register API endpoint exists and accepts POST', async ({ request }) => {
    const res = await request.post(`${BASE}/api/users/register/`, {
      data: { user_id: 'playwright-test-uid-001' },
    });
    // 200 for existing user, 201 for new registration
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.avatar_id).toBeDefined();
    expect(body.display_name).toBeDefined();
  });

  test('register API returns numeric avatar_id and string display_name', async ({ request }) => {
    const res = await request.post(`${BASE}/api/users/register/`, {
      data: { user_id: 'playwright-test-uid-002' },
    });
    // 200 for existing user, 201 for new registration
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(typeof body.avatar_id).toBe('number');
    expect(typeof body.display_name).toBe('string');
    expect(body.display_name.length).toBeGreaterThan(0);
  });

  test('auto-registration script sets localStorage values on fresh visit', async ({ page }) => {
    // Clear relevant localStorage before visit
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      // Ensure UID is present
      if (!localStorage.getItem('swf-uid')) {
        localStorage.setItem('swf-uid', 'pw-test-uid-auto-reg');
      }
    });

    // Reload so the script runs fresh
    await page.reload();
    // Wait for setTimeout (1500ms) + fetch response
    await page.waitForTimeout(3000);

    const avatar = await page.evaluate(() => localStorage.getItem('swf-avatar'));
    const displayName = await page.evaluate(() => localStorage.getItem('swf-display-name'));

    expect(avatar).not.toBeNull();
    expect(Number(avatar)).toBeGreaterThan(0);
    expect(displayName).not.toBeNull();
    expect(displayName!.length).toBeGreaterThan(0);
  });

  test('script does not run on admin pages', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    await page.evaluate(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
      localStorage.setItem('swf-uid', 'pw-test-uid-admin');
    });
    await page.reload();
    await page.waitForTimeout(3000);

    const avatar = await page.evaluate(() => localStorage.getItem('swf-avatar'));
    // Should NOT have been set on admin page
    expect(avatar).toBeNull();
  });
});

test.describe('Avatar Auto-Registration — Negative', () => {
  test('script skips if swf-avatar already exists in localStorage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-avatar', '5');
      localStorage.setItem('swf-display-name', 'Existing User');
      localStorage.setItem('swf-uid', 'pw-test-uid-existing');
    });

    // Listen for network requests to the register endpoint
    let registerCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/users/register')) {
        registerCalled = true;
      }
    });

    await page.reload();
    await page.waitForTimeout(3000);

    // The register endpoint should NOT have been called
    expect(registerCalled).toBe(false);
  });

  test('script does not produce page errors even with manipulated state', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);

    // No critical page errors from the auto-registration script
    expect(errors.filter((e) => e.includes('avatar') || e.includes('register'))).toHaveLength(0);
  });

  test('register API rejects empty user_id', async ({ request }) => {
    const res = await request.post(`${BASE}/api/users/register/`, {
      data: { user_id: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('register API rejects missing body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/users/register/`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });
});
