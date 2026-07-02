import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── CaB Panel Leaderboard Link — Positive ────────────────────────────────────

test.describe('CaB Panel Leaderboard Link — Positive', () => {
  test('leaderboard link is visible in CaB panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const cabHeader = page.locator('#cab > .flex.items-center.justify-between').first();
    const link = cabHeader.locator('a[href="/leaderboard/?game=cab"]');
    await expect(link).toBeVisible();
  });

  test('leaderboard link displays trophy emoji and text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const cabHeader = page.locator('#cab > .flex.items-center.justify-between').first();
    const link = cabHeader.locator('a[href="/leaderboard/?game=cab"]');
    const text = await link.textContent();
    expect(text).toContain('🏆');
    expect(text).toContain('Leaderboard');
  });

  test('leaderboard link href includes game=cab param', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const cabHeader = page.locator('#cab > .flex.items-center.justify-between').first();
    const link = cabHeader.locator('a[href="/leaderboard/?game=cab"]');
    const href = await link.getAttribute('href');
    expect(href).toBe('/leaderboard/?game=cab');
  });

  test('leaderboard link has purple styling matching other panel links', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const cabHeader = page.locator('#cab > .flex.items-center.justify-between').first();
    const link = cabHeader.locator('a[href="/leaderboard/?game=cab"]');
    await expect(link).toHaveClass(/bg-purple-600/);
    await expect(link).toHaveClass(/text-purple-300/);
  });
});

// ── CaB Panel Leaderboard Link — Negative ────────────────────────────────────

test.describe('CaB Panel Leaderboard Link — Negative', () => {
  test('no duplicate leaderboard links in CaB panel header row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const cabHeader = page.locator('#cab > .flex.items-center.justify-between').first();
    const links = cabHeader.locator('a[href="/leaderboard/?game=cab"]');
    await expect(links).toHaveCount(1);
  });

  test('leaderboard link does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1000);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(critical).toHaveLength(0);
  });
});
