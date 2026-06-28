import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

// ── Homepage Main Container Layout — Positive ──────────────────────────────

test.describe('Homepage Main Container — Positive', () => {
  test('main solver area has max-width of 1049px', async ({ page }) => {
    await page.goto(BASE_URL);
    const main = page.locator('main.mx-auto');
    await expect(main).toBeVisible();
    const maxWidth = await main.evaluate(el => getComputedStyle(el).maxWidth);
    expect(maxWidth).toBe('1049px');
  });

  test('main solver area is horizontally centered', async ({ page }) => {
    await page.goto(BASE_URL);
    const main = page.locator('main.mx-auto');
    await expect(main).toHaveClass(/mx-auto/);
  });

  test('main solver area has correct padding', async ({ page }) => {
    await page.goto(BASE_URL);
    const main = page.locator('main.mx-auto');
    await expect(main).toHaveClass(/px-4/);
    await expect(main).toHaveClass(/pb-20/);
    await expect(main).toHaveClass(/pt-4/);
  });
});

// ── Text Solver Input Width — Positive ──────────────────────────────────────

test.describe('Text Solver Input Width — Positive', () => {
  test('text solver input has 20ch width class', async ({ page }) => {
    await page.goto(BASE_URL);
    const input = page.locator('#text-solver');
    await expect(input).toHaveClass(/w-\[20ch\]/);
  });

  test('text solver input computed width accommodates 15 characters', async ({ page }) => {
    await page.goto(BASE_URL);
    const input = page.locator('#text-solver');
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    // 20ch at ~10px per ch in monospace ≈ 200px minimum, but with padding should be wider
    expect(box!.width).toBeGreaterThan(150);
  });
});

// ── Text Solver Input Width — Negative ──────────────────────────────────────

test.describe('Text Solver Input Width — Negative', () => {
  test('text solver input does not use old 15ch width', async ({ page }) => {
    await page.goto(BASE_URL);
    const input = page.locator('#text-solver');
    const className = await input.getAttribute('class');
    expect(className).not.toContain('w-[15ch]');
  });

  test('text solver input does not overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#text-solver');
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });
});

// ── Homepage Main Container — Negative ─────────────────────────────────────

test.describe('Homepage Main Container — Negative', () => {
  test('main does not use old max-w-5xl class', async ({ page }) => {
    await page.goto(BASE_URL);
    const main = page.locator('main.mx-auto');
    const className = await main.getAttribute('class');
    expect(className).not.toContain('max-w-5xl');
  });

  test('main container does not overflow viewport on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const main = page.locator('main.mx-auto');
    const box = await main.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(375);
  });
});
