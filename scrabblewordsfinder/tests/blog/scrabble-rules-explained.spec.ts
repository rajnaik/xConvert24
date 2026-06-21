import { test, expect } from '@playwright/test';

const PAGE = '/blog/scrabble-rules-explained/';

test.describe('Scrabble Rules Explained — Visual Treatment — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with COMPLETE SCRABBLE RULEBOOK is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText('COMPLETE SCRABBLE RULEBOOK');
  });

  test('hero card shows Official Rules badge', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCard).toContainText('Official Rules');
  });

  test('hero card shows subtitle about every rule and scenario', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCard).toContainText('Every rule, every scenario, every edge case');
  });

  test('stat strip is visible with 4 game stats', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    const values = statStrip.locator('.text-xl.font-bold.text-cyan-400');
    await expect(values).toHaveCount(4);
  });

  test('stat strip shows 100 tiles in bag', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toContainText('100');
    await expect(statStrip).toContainText('Tiles in bag');
  });

  test('stat strip shows 7 tiles per rack', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toContainText('7');
    await expect(statStrip).toContainText('Tiles per rack');
  });

  test('stat strip shows 15x15 board squares', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toContainText('15×15');
    await expect(statStrip).toContainText('Board squares');
  });

  test('stat strip shows 50 bingo bonus points', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toContainText('50');
    await expect(statStrip).toContainText('Bingo bonus pts');
  });

  test('core principle insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').filter({ hasText: 'Core Principle' });
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('Core Principle');
  });

  test('insight callout mentions vocabulary breadth and positional strategy', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').filter({ hasText: 'Core Principle' });
    await expect(callout).toContainText('vocabulary breadth');
    await expect(callout).toContainText('positional strategy');
  });

  test('Hasbro PDF link has SVG brand icon with blue background', async ({ page }) => {
    await page.goto(PAGE);
    const hasbroLink = page.locator('a[href*="hasbro.com"]');
    await expect(hasbroLink).toBeVisible();
    const svg = hasbroLink.locator('svg');
    await expect(svg).toBeVisible();
    const rect = svg.locator('rect');
    await expect(rect).toHaveAttribute('fill', '#1428A0');
  });

  test('Mattel PDF link has SVG brand icon with pink background', async ({ page }) => {
    await page.goto(PAGE);
    const mattelLink = page.locator('a[href*="mattel.com"]');
    await expect(mattelLink).toBeVisible();
    const svg = mattelLink.locator('svg');
    await expect(svg).toBeVisible();
    const rect = svg.locator('rect');
    await expect(rect).toHaveAttribute('fill', '#E62958');
  });

  test('Hasbro PDF link opens in new window with correct href', async ({ page }) => {
    await page.goto(PAGE);
    const hasbroLink = page.locator('a[href*="hasbro.com"]');
    await expect(hasbroLink).toHaveAttribute('target', '_blank');
    await expect(hasbroLink).toHaveAttribute('href', 'https://www.hasbro.com/common/instruct/Scrabble_(2003).pdf');
  });

  test('Mattel PDF link opens in new window with correct href', async ({ page }) => {
    await page.goto(PAGE);
    const mattelLink = page.locator('a[href*="mattel.com"]');
    await expect(mattelLink).toHaveAttribute('target', '_blank');
    await expect(mattelLink).toHaveAttribute('href', 'https://service.mattel.com/instruction_sheets/53639-ENG.pdf');
  });
});

test.describe('Scrabble Rules Explained — Visual Treatment — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards on the page', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate stat strips on the page', async ({ page }) => {
    await page.goto(PAGE);
    const statStrips = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrips).toHaveCount(1);
  });

  test('insight callouts on the page are exactly 2 (Core Principle + Endgame)', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    await expect(callouts).toHaveCount(2);
  });

  test('stat strip values are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    const values = statStrip.locator('.text-xl.font-bold.text-cyan-400');
    const count = await values.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('stat strip labels are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    const labels = statStrip.locator('.text-xs.text-gray-400');
    const count = await labels.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = await labels.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('hero card description paragraph is not empty', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    const description = heroCard.locator('.text-sm.text-gray-300');
    const text = await description.textContent();
    expect(text?.trim().length).toBeGreaterThan(10);
  });

  test('PDF links SVG icons are marked aria-hidden', async ({ page }) => {
    await page.goto(PAGE);
    const hasbroSvg = page.locator('a[href*="hasbro.com"] svg');
    const mattelSvg = page.locator('a[href*="mattel.com"] svg');
    await expect(hasbroSvg).toHaveAttribute('aria-hidden', 'true');
    await expect(mattelSvg).toHaveAttribute('aria-hidden', 'true');
  });

  test('no emoji icons remain on PDF links (replaced by SVG)', async ({ page }) => {
    await page.goto(PAGE);
    const hasbroLink = page.locator('a[href*="hasbro.com"]');
    const mattelLink = page.locator('a[href*="mattel.com"]');
    // Old emojis should not exist
    await expect(hasbroLink.locator('span[aria-hidden="true"]')).toHaveCount(0);
    await expect(mattelLink.locator('span[aria-hidden="true"]')).toHaveCount(0);
  });
});
