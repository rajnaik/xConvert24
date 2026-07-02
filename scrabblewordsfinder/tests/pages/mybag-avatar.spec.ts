import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('MyBag Avatar & Display Name — Positive', () => {
  test('avatar container exists in DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const avatar = page.locator('#mybag-avatar');
    expect(await avatar.count()).toBe(1);
  });

  test('avatar image element has correct default src', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mybag-avatar-img');
    expect(await img.count()).toBe(1);
    const src = await img.getAttribute('src');
    expect(src).toBe('/avatars/avatar-1.svg');
  });

  test('avatar image has alt text', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mybag-avatar-img');
    const alt = await img.getAttribute('alt');
    expect(alt).toBe('Your avatar');
  });

  test('avatar name element exists in DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const name = page.locator('#mybag-avatar-name');
    expect(await name.count()).toBe(1);
  });

  test('avatar container is hidden by default (no user data)', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const avatar = page.locator('#mybag-avatar');
    const classes = await avatar.getAttribute('class') || '';
    expect(classes).toContain('hidden');
  });

  test('avatar container has descriptive subtitle text', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const avatar = page.locator('#mybag-avatar');
    const subtitle = avatar.locator('p.text-xs');
    await expect(subtitle).toContainText('Your avatar & display name');
  });

  test('avatar panel uses full-width breakout styling', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const avatar = page.locator('#mybag-avatar');
    const classes = await avatar.getAttribute('class') || '';
    expect(classes).toContain('w-screen');
    expect(classes).toContain('-translate-x-1/2');
  });

  test('avatar panel uses border-y for edge-to-edge look', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const avatar = page.locator('#mybag-avatar');
    const classes = await avatar.getAttribute('class') || '';
    expect(classes).toContain('border-y');
  });
});

test.describe('MyBag Avatar & Display Name — Negative', () => {
  test('no duplicate avatar containers exist', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const avatars = page.locator('#mybag-avatar');
    expect(await avatars.count()).toBe(1);
  });

  test('no duplicate avatar images exist', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const imgs = page.locator('#mybag-avatar-img');
    expect(await imgs.count()).toBe(1);
  });

  test('avatar image src is not broken or empty', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mybag-avatar-img');
    const src = await img.getAttribute('src');
    expect(src).not.toBe('');
    expect(src).not.toContain('undefined');
    expect(src).not.toContain('null');
  });

  test('no console errors from avatar section', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const avatarErrors = errors.filter(e => e.includes('avatar') || e.includes('Avatar'));
    expect(avatarErrors).toHaveLength(0);
  });

  test('avatar panel does not use rounded border (full-bleed)', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const avatar = page.locator('#mybag-avatar');
    const classes = await avatar.getAttribute('class') || '';
    expect(classes).not.toContain('rounded-xl');
  });
});
