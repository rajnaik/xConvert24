import { test, expect } from '@playwright/test';

// ─── Tools Index — Calculators Category (Positive) ─────────────────────────────

test.describe('Tools Index — Calculators Category — Positive', () => {
  test('Calculators heading is visible', async ({ page }) => {
    await page.goto('/tools');
    const heading = page.locator('h2', { hasText: 'Calculators' });
    await expect(heading).toBeVisible();
  });

  test('all 8 calculator tool cards are present in the grid', async ({ page }) => {
    await page.goto('/tools');
    const calculatorsGrid = page.locator('.max-w-5xl .grid').first();
    const expectedTools = [
      { name: 'Age Calculator', href: '/tools/age' },
      { name: 'BMI Calculator', href: '/tools/bmi' },
      { name: 'Loan Calculator', href: '/tools/loan' },
      { name: 'Tip Calculator', href: '/tools/tip' },
      { name: 'Discount Calculator', href: '/tools/discount' },
      { name: 'Aspect Ratio Calculator', href: '/tools/aspect-ratio' },
      { name: 'Scientific Calculator', href: '/tools/calculator' },
      { name: 'Date Difference', href: '/tools/date-diff' },
    ];

    for (const tool of expectedTools) {
      const link = calculatorsGrid.locator(`a[href="${tool.href}"]`);
      await expect(link).toBeVisible();
      await expect(link).toContainText(tool.name);
    }
  });

  test('each calculator card has a description paragraph', async ({ page }) => {
    await page.goto('/tools');
    const calculatorsGrid = page.locator('.max-w-5xl .grid').first();
    const cards = calculatorsGrid.locator('a');
    const count = await cards.count();
    expect(count).toBe(8);
    for (let i = 0; i < count; i++) {
      const desc = cards.nth(i).locator('p');
      await expect(desc).toBeVisible();
      const text = await desc.textContent();
      expect(text!.trim().length).toBeGreaterThan(10);
    }
  });

  test('calculator card navigates to tool page', async ({ page }) => {
    await page.goto('/tools');
    const calculatorsGrid = page.locator('.max-w-5xl .grid').first();
    await calculatorsGrid.locator('a[href="/tools/age"]').click();
    await expect(page).toHaveURL(/\/tools\/age/);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── Tools Index — Calculators Category — Negative ─────────────────────────────

test.describe('Tools Index — Calculators Category — Negative', () => {
  test('no duplicate calculator cards within the grid', async ({ page }) => {
    await page.goto('/tools');
    const calculatorsGrid = page.locator('.max-w-5xl .grid').first();
    const hrefs = ['/tools/age', '/tools/bmi', '/tools/loan', '/tools/tip', '/tools/discount', '/tools/aspect-ratio', '/tools/calculator', '/tools/date-diff'];
    for (const href of hrefs) {
      const links = calculatorsGrid.locator(`a[href="${href}"]`);
      const count = await links.count();
      expect(count, `Expected exactly 1 card for ${href} in Calculators grid`).toBe(1);
    }
  });

  test('page does not throw console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/tools');
    expect(errors).toHaveLength(0);
  });
});
