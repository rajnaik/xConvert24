import { test, expect } from '@playwright/test';

/**
 * Chat Page — Dojo Mode (Training Modes Panel)
 *
 * Tests the new Dojo Mode toggle and 4 training mode buttons
 * added to the Ask Lex panel on /chat/.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Page — Dojo Mode (Positive)', () => {
  test('dojo toggle is visible on chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const toggle = page.locator('#dojo-toggle');
    await expect(toggle).toBeAttached();
  });

  test('dojo status label shows "On" by default', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const status = page.locator('#dojo-status');
    await expect(status).toHaveText('On');
  });

  test('dojo buttons container is visible by default', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const buttons = page.locator('#dojo-buttons');
    await expect(buttons).toBeVisible();
  });

  test('dojo toggle shows training buttons when enabled', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const toggle = page.locator('#dojo-toggle');
    await toggle.check({ force: true });
    const buttons = page.locator('#dojo-buttons');
    await expect(buttons).toBeVisible();
  });

  test('dojo mode has exactly 4 training buttons', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#dojo-toggle').check({ force: true });
    const buttons = page.locator('#dojo-buttons .dojo-btn');
    await expect(buttons).toHaveCount(4);
  });

  test('bingo trainer button exists with correct data-dojo attribute', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#dojo-toggle').check({ force: true });
    const btn = page.locator('[data-dojo="bingo"]');
    await expect(btn).toBeVisible();
    const text = await btn.textContent();
    expect(text).toContain('Bingo Trainer');
  });

  test('hook quiz button exists with correct data-dojo attribute', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#dojo-toggle').check({ force: true });
    const btn = page.locator('[data-dojo="hook"]');
    await expect(btn).toBeVisible();
    const text = await btn.textContent();
    expect(text).toContain('Hook Quiz');
  });

  test('tile countdown button exists with correct data-dojo attribute', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#dojo-toggle').check({ force: true });
    const btn = page.locator('[data-dojo="countdown"]');
    await expect(btn).toBeVisible();
    const text = await btn.textContent();
    expect(text).toContain('Tile Countdown');
  });

  test('rack leave drill button exists with correct data-dojo attribute', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#dojo-toggle').check({ force: true });
    const btn = page.locator('[data-dojo="leave"]');
    await expect(btn).toBeVisible();
    const text = await btn.textContent();
    expect(text).toContain('Rack Leave Drill');
  });

  test('dojo mode label text is visible', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const label = page.locator('label[for="dojo-toggle"]');
    await expect(label).toBeVisible();
    await expect(label).toHaveText('Dojo Mode');
  });

  test('ask-lex-panel contains both rack input and dojo sections', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const panel = page.locator('#ask-lex-panel');
    await expect(panel.locator('#rack-input')).toBeAttached();
    await expect(panel.locator('#dojo-toggle')).toBeAttached();
  });
});

test.describe('Chat Page — Dojo Mode (Negative)', () => {
  test('no duplicate dojo-toggle elements', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const toggles = page.locator('#dojo-toggle');
    await expect(toggles).toHaveCount(1);
  });

  test('no duplicate dojo-buttons containers', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const containers = page.locator('#dojo-buttons');
    await expect(containers).toHaveCount(1);
  });

  test('dojo toggle does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.locator('#dojo-toggle').check({ force: true });
    await page.waitForTimeout(500);
    await page.locator('#dojo-toggle').uncheck({ force: true });
    await page.waitForTimeout(500);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('dojo buttons are hidden when toggle is turned off', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Turn on
    await page.locator('#dojo-toggle').check({ force: true });
    await expect(page.locator('#dojo-buttons')).toBeVisible();
    // Turn off
    await page.locator('#dojo-toggle').uncheck({ force: true });
    await expect(page.locator('#dojo-buttons')).toBeHidden();
  });

  test('all dojo buttons have unique data-dojo values', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#dojo-toggle').check({ force: true });
    const buttons = page.locator('#dojo-buttons .dojo-btn');
    const count = await buttons.count();
    const values = new Set<string>();
    for (let i = 0; i < count; i++) {
      const val = await buttons.nth(i).getAttribute('data-dojo');
      expect(val).not.toBeNull();
      expect(values.has(val!)).toBe(false);
      values.add(val!);
    }
    expect(values.size).toBe(4);
  });

  test('dojo mode does not interfere with rack input', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Enable dojo mode
    await page.locator('#dojo-toggle').check({ force: true });
    // Rack input should still work
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('SATIRE');
    await rackInput.dispatchEvent('input');
    const evBadge = page.locator('#ev-score-badge');
    await expect(evBadge).toBeVisible();
  });

  test('dojo description text is present and not empty', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Find the dojo description paragraph
    const desc = page.locator('#ask-lex-panel').locator('text=Train your skills with AI-powered drills');
    await expect(desc).toBeAttached();
  });
});
