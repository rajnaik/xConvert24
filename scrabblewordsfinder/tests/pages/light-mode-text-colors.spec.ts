import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Helper: get computed color as hex by injecting a test span.
 * This avoids issues with existing elements that may have inline styles or
 * Tailwind v4 oklab specificity quirks. Instead we inject a fresh element
 * with just the target class and check what the override resolves to.
 */
async function getOverrideColorHex(page: any, className: string): Promise<string> {
  return page.evaluate((cls: string) => {
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = 'X';
    document.body.appendChild(span);
    const color = getComputedStyle(span).color;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    span.remove();
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }, className);
}

// ── Light Mode Text Colors — Positive ──────────────────────────────────────

test.describe('Light Mode Text Colors — Positive', () => {
  test('text-gray-100 override applies #111827 in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-gray-100');
    expect(hex).toBe('#111827');
  });

  test('text-white override applies #111827 in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-white');
    expect(hex).toBe('#111827');
  });

  test('text-gray-300 override applies #1f2937 in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-gray-300');
    expect(hex).toBe('#1f2937');
  });

  test('text-gray-400 override applies #374151 in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-gray-400');
    expect(hex).toBe('#374151');
  });

  test('text-gray-500 override applies #4b5563 in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-gray-500');
    expect(hex).toBe('#4b5563');
  });

  test('light mode text colors are all dark (high contrast against light bg)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);

    const classes = ['text-gray-100', 'text-gray-300', 'text-gray-400', 'text-gray-500'];
    for (const cls of classes) {
      const hex = await getOverrideColorHex(page, cls);
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      // All colors should be dark (sum < 300 means definitely dark text)
      expect(r + g + b, `${cls} should be dark`).toBeLessThan(300);
    }
  });
});

// ── Light Mode Text Colors — Negative ──────────────────────────────────────

test.describe('Light Mode Text Colors — Negative', () => {
  test('text-gray-300 does not use old lighter #4a5568 value in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-gray-300');
    expect(hex).not.toBe('#4a5568');
  });

  test('text-gray-400 does not use old lighter #6b7280 value in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-gray-400');
    expect(hex).not.toBe('#6b7280');
  });

  test('text-gray-500 does not use old lighter #9ca3af value in light mode', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => document.body.classList.add('light-mode'));
    await page.waitForTimeout(100);
    const hex = await getOverrideColorHex(page, 'text-gray-500');
    expect(hex).not.toBe('#9ca3af');
  });

  test('light mode overrides do not bleed into dark mode', async ({ page }) => {
    await page.goto(BASE_URL);
    // Do NOT add light-mode — verify dark mode keeps light text
    const hex = await getOverrideColorHex(page, 'text-gray-100');
    // In dark mode, text-gray-100 should resolve to a light color (NOT the dark #111827)
    expect(hex).not.toBe('#111827');
  });
});
