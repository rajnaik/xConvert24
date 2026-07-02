import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Settings — Change Avatar Link — Positive', () => {
  test('avatar section exists with heading', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const heading = page.locator('h2', { hasText: 'Your Avatar & Display Name' });
    await expect(heading).toBeVisible();
  });

  test('Change Avatar now link is visible', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.locator('a[href="/avatar-swap/"]');
    await expect(link.first()).toBeVisible();
  });

  test('Change Avatar now link has correct text', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.getByRole('link', { name: 'Change Avatar now' });
    await expect(link).toContainText('Change Avatar now');
  });

  test('Change Avatar now link has avatar icon', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.getByRole('link', { name: 'Change Avatar now' });
    await expect(link).toContainText('🎭');
  });

  test('Change Avatar now link points to /avatar-swap/', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.locator('a[href="/avatar-swap/"]');
    const href = await link.first().getAttribute('href');
    expect(href).toBe('/avatar-swap/');
  });
});

test.describe('Settings — Change Avatar Link — Negative', () => {
  test('no old "Change anytime" bold text remains', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const section = page.locator('div', { hasText: 'Your Avatar & Display Name' });
    const content = await section.first().textContent() || '';
    // The old format had bold "Change anytime" followed by a separate link
    // Now it's just the link itself — no bold "Change anytime" label
    expect(content).not.toMatch(/Change anytime.*—/);
  });

  test('Change Avatar link href is not broken', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.locator('a[href="/avatar-swap/"]');
    const href = await link.first().getAttribute('href');
    expect(href).not.toContain('undefined');
    expect(href).not.toContain('null');
    expect(href).toBe('/avatar-swap/');
  });

  test('no duplicate avatar-swap links in settings', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const links = page.locator('a[href="/avatar-swap/"]');
    // One in avatar preview row (Change button) + one in bullet list = 2
    expect(await links.count()).toBe(2);
  });

  test('no console errors on settings page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/settings/`);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });
});
