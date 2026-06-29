import { test, expect } from '@playwright/test';

/**
 * Diamond Hunt Slots — Front-End Integration Tests
 *
 * Verifies the DiamondHuntSlot component is correctly embedded on public pages
 * and the claim interaction script is present in the layout.
 */

// ── Presence on Public Pages — Positive ──────────────────────────────────

test.describe('Diamond Hunt Slots — Presence (Positive)', () => {
  test('homepage contains a diamond-hunt-slot element', async ({ page }) => {
    await page.goto('/');
    const slot = page.locator('.diamond-hunt-slot');
    await expect(slot.first()).toBeAttached();
  });

  test('activities page contains a diamond-hunt-slot element', async ({ page }) => {
    await page.goto('/activities/');
    const slot = page.locator('.diamond-hunt-slot');
    await expect(slot.first()).toBeAttached();
  });

  test('mybag page contains a diamond-hunt-slot element', async ({ page }) => {
    await page.goto('/mybag/');
    const slot = page.locator('.diamond-hunt-slot');
    await expect(slot.first()).toBeAttached();
  });

  test('blog index page contains a diamond-hunt-slot element', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot');
    await expect(slot.first()).toBeAttached();
  });

  test('blog index slot has data-diamond-id="7"', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="7"]');
    await expect(slot).toBeAttached();
  });

  test('slot has correct data-diamond-id attribute', async ({ page }) => {
    await page.goto('/activities/');
    const slot = page.locator('.diamond-hunt-slot').first();
    const id = await slot.getAttribute('data-diamond-id');
    expect(id).toBeTruthy();
    expect(Number(id)).toBeGreaterThan(0);
  });

  test('slot has role=button and is keyboard accessible', async ({ page }) => {
    await page.goto('/activities/');
    const slot = page.locator('.diamond-hunt-slot').first();
    await expect(slot).toHaveAttribute('role', 'button');
    await expect(slot).toHaveAttribute('tabindex', '0');
  });

  test('slot is initially hidden (display:none via class)', async ({ page }) => {
    // Block the diamond-hunt API so the reveal script cannot run
    await page.route('**/api/diamond-hunt/**', route => route.abort());
    await page.goto('/activities/');
    const slot = page.locator('.diamond-hunt-slot').first();
    // The component has class "hidden" which sets display:none
    await expect(slot).toHaveClass(/hidden/);
  });

  test('slot contains remaining count placeholder', async ({ page }) => {
    await page.goto('/activities/');
    const remaining = page.locator('.diamond-hunt-slot .diamond-remaining').first();
    await expect(remaining).toBeAttached();
  });
});

// ── Layout Script — Positive ─────────────────────────────────────────────

test.describe('Diamond Hunt Slots — Layout Script (Positive)', () => {
  test('layout includes diamond hunt claim script', async ({ page }) => {
    await page.goto('/activities/');
    const content = await page.content();
    expect(content).toContain('diamond-hunt-slot');
    expect(content).toContain('/api/diamond-hunt/');
  });

  test('script skips admin pages', async ({ page }) => {
    await page.goto('/admin/diamond-hunt/');
    // The script should NOT try to reveal slots on admin pages
    const slots = page.locator('.diamond-hunt-slot');
    const count = await slots.count();
    expect(count).toBe(0);
  });
});

// ── Negative Tests ───────────────────────────────────────────────────────

test.describe('Diamond Hunt Slots — Negative', () => {
  test('no duplicate slots on homepage', async ({ page }) => {
    await page.goto('/');
    const slots = page.locator('.diamond-hunt-slot');
    const count = await slots.count();
    expect(count).toBe(1);
  });

  test('no duplicate slots on activities page', async ({ page }) => {
    await page.goto('/activities/');
    const slots = page.locator('.diamond-hunt-slot');
    const count = await slots.count();
    expect(count).toBe(1);
  });

  test('no duplicate slots on mybag page', async ({ page }) => {
    await page.goto('/mybag/');
    const slots = page.locator('.diamond-hunt-slot');
    const count = await slots.count();
    expect(count).toBe(1);
  });

  test('no duplicate slots on blog index page', async ({ page }) => {
    await page.goto('/blog/');
    const slots = page.locator('.diamond-hunt-slot');
    const count = await slots.count();
    expect(count).toBe(1);
  });

  test('slot does not become visible without API response', async ({ page }) => {
    // Block the diamond-hunt API so the slot stays hidden
    await page.route('**/api/diamond-hunt/**', route => route.abort());
    await page.goto('/activities/');
    await page.waitForTimeout(500);
    const slot = page.locator('.diamond-hunt-slot').first();
    await expect(slot).toHaveClass(/hidden/);
  });

  test('no console errors from diamond script on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/activities/');
    await page.waitForTimeout(1000);
    const critical = errors.filter(e => e.includes('diamond') || e.includes('TypeError'));
    expect(critical).toHaveLength(0);
  });
});
