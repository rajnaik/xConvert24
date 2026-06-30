import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test('Mine #2 — /mybag/ — diamond gem or Mined visible', async ({ page }) => {
  await page.goto(`${BASE}/mybag/`);
  await page.waitForTimeout(3000);
  const gem = page.locator('.diamond-mine-gem');
  const mined = page.locator('.diamond-mine-mined');
  const gemVisible = await gem.isVisible().catch(() => false);
  const minedVisible = await mined.isVisible().catch(() => false);
  expect(gemVisible || minedVisible, 'Expected diamond gem or Mined ✓ to be visible on /mybag/').toBe(true);
});
