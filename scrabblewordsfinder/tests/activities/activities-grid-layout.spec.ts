import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Activities Grid Layout — Positive ────────────────────────────

test.describe('Activities Grid Layout — Positive', () => {
  test('activities grid container is visible', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const grid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2').first();
    await expect(grid).toBeVisible();
  });

  test('grid uses responsive two-column layout on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ACTIVITIES_URL);
    const grid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2').first();
    const classAttr = await grid.getAttribute('class');
    expect(classAttr).toContain('grid-cols-1');
    expect(classAttr).toContain('lg:grid-cols-2');
  });

  test('negative margin wrapper only applies on large screens (lg:-mr-[50px])', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The parent wrapper of the grid has the responsive negative margin class
    const wrapper = page.locator('.lg\\:-mr-\\[50px\\]').first();
    await expect(wrapper).toBeAttached();
  });

  test('activities page heading is visible', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const heading = page.locator('h1', { hasText: 'Activities' });
    await expect(heading).toBeVisible();
  });
});

// ── Activities Grid Layout — Negative ────────────────────────────

test.describe('Activities Grid Layout — Negative', () => {
  test('no horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    // Check that the page body does not have horizontal scroll
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test('unconditional -mr-[50px] class is NOT present (responsive fix)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Ensure no element has bare -mr-[50px] without the lg: prefix in the grid area
    const bareMarginElements = page.locator('main .\\-mr-\\[50px\\]');
    await expect(bareMarginElements).toHaveCount(0);
  });

  test('no JavaScript errors on activities page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('h1');

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('grid does not collapse to zero height on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    const grid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2').first();
    const box = await grid.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(100);
  });
});

// ── Quiz Panel Lex Link — Positive ────────────────────────────

test.describe('Quiz Panel Lex Link — Positive', () => {
  test('Lex AI link is visible in the Word Quiz panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/"]', { hasText: 'Lex' });
    await expect(lexLink.first()).toBeVisible();
  });

  test('Lex link has correct href with trailing slash', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/"]', { hasText: 'Lex' });
    await expect(lexLink.first()).toHaveAttribute('href', '/chat/');
  });
});

// ── Quiz Panel Lex Link — Negative ────────────────────────────

test.describe('Quiz Panel Lex Link — Negative', () => {
  test('Lex link in quiz panel is not duplicated', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Within the quiz panel specifically (the one with quiz-start-btn)
    const quizPanel = page.locator('#quiz-start-btn').locator('..').locator('..');
    const lexLinks = quizPanel.locator('a[href="/chat/"]');
    const count = await lexLinks.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});
