import { test, expect } from '@playwright/test';

const BASE_URL = '/convert';

// ─── Convert Index — Specialist Section — Positive ─────────────────────────────

test.describe('Convert Index — Specialist Section — Positive', () => {
  test('Specialist heading exists on page', async ({ page }) => {
    await page.goto(BASE_URL);
    // Scope to the page content container, find h2 with text "Specialist"
    const content = page.locator('.max-w-5xl');
    const heading = content.locator('h2').filter({ hasText: /🎯.*Specialist/ });
    await expect(heading).toHaveCount(1);
  });

  test('all 5 specialist converter grid cards exist', async ({ page }) => {
    await page.goto(BASE_URL);
    const expectedCards = [
      { name: 'Area Converter', href: '/convert/area' },
      { name: 'Number Base Converter', href: '/convert/base' },
      { name: 'Roman Numeral Converter', href: '/convert/roman' },
      { name: 'Precious Metals', href: '/convert/precious-metals' },
      { name: 'Body Weight Percentage', href: '/convert/body-weight-percentage' },
    ];

    for (const card of expectedCards) {
      // Use .group class to target only grid cards (not sidebar nav)
      const link = page.locator(`a.group[href="${card.href}"]`);
      await expect(link).toHaveCount(1);
      const text = await link.textContent();
      expect(text).toContain(card.name);
    }
  });

  test('specialist grid cards have description paragraphs', async ({ page }) => {
    await page.goto(BASE_URL);
    const specialistHrefs = [
      '/convert/area', '/convert/base', '/convert/roman',
      '/convert/precious-metals', '/convert/body-weight-percentage',
    ];
    for (const href of specialistHrefs) {
      const card = page.locator(`a.group[href="${href}"]`);
      const desc = card.locator('p');
      await expect(desc).toHaveCount(1);
      const text = await desc.textContent();
      expect(text!.trim().length).toBeGreaterThan(10);
    }
  });

  test('specialist card link navigates to converter page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('a.group[href="/convert/base"]').click();
    await expect(page).toHaveURL(/\/convert\/base/);
  });
});

// ─── Convert Index — Sports & Fitness Section — Positive ────────────────────────

test.describe('Convert Index — Sports & Fitness Section — Positive', () => {
  test('Sports & Fitness heading exists on page', async ({ page }) => {
    await page.goto(BASE_URL);
    const content = page.locator('.max-w-5xl');
    const heading = content.locator('h2').filter({ hasText: /🏃.*Sports & Fitness/ });
    await expect(heading).toHaveCount(1);
  });

  test('both sports converter grid cards exist', async ({ page }) => {
    await page.goto(BASE_URL);
    const expectedCards = [
      { name: 'Running Pace Calculator', href: '/convert/running-pace' },
      { name: 'Cycling Speed Calculator', href: '/convert/cycling-speed' },
    ];

    for (const card of expectedCards) {
      const link = page.locator(`a.group[href="${card.href}"]`);
      await expect(link).toHaveCount(1);
      const text = await link.textContent();
      expect(text).toContain(card.name);
    }
  });

  test('sports grid cards have description paragraphs', async ({ page }) => {
    await page.goto(BASE_URL);
    const sportsHrefs = ['/convert/running-pace', '/convert/cycling-speed'];
    for (const href of sportsHrefs) {
      const card = page.locator(`a.group[href="${href}"]`);
      const desc = card.locator('p');
      await expect(desc).toHaveCount(1);
      const text = await desc.textContent();
      expect(text!.trim().length).toBeGreaterThan(10);
    }
  });

  test('sports card link navigates to converter page', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('a.group[href="/convert/running-pace"]').click();
    await expect(page).toHaveURL(/\/convert\/running-pace/);
  });
});

// ─── Convert Index — Specialist & Sports — Negative ─────────────────────────────

test.describe('Convert Index — Specialist & Sports — Negative', () => {
  test('no duplicate specialist converter grid cards', async ({ page }) => {
    await page.goto(BASE_URL);
    const specialistHrefs = [
      '/convert/area', '/convert/base', '/convert/roman',
      '/convert/precious-metals', '/convert/body-weight-percentage',
    ];
    for (const href of specialistHrefs) {
      const links = page.locator(`a.group[href="${href}"]`);
      const count = await links.count();
      expect(count, `Expected exactly 1 grid card for ${href}`).toBe(1);
    }
  });

  test('no duplicate sports converter grid cards', async ({ page }) => {
    await page.goto(BASE_URL);
    const sportsHrefs = ['/convert/running-pace', '/convert/cycling-speed'];
    for (const href of sportsHrefs) {
      const links = page.locator(`a.group[href="${href}"]`);
      const count = await links.count();
      expect(count, `Expected exactly 1 grid card for ${href}`).toBe(1);
    }
  });

  test('convert index page does not throw console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    expect(errors).toHaveLength(0);
  });

  test('all specialist and sports cards have proper href format', async ({ page }) => {
    await page.goto(BASE_URL);
    const allNewHrefs = [
      '/convert/area', '/convert/base', '/convert/roman',
      '/convert/precious-metals', '/convert/body-weight-percentage',
      '/convert/running-pace', '/convert/cycling-speed',
    ];
    for (const href of allNewHrefs) {
      const link = page.locator(`a.group[href="${href}"]`);
      const hrefVal = await link.getAttribute('href');
      expect(hrefVal).toBe(href);
      expect(hrefVal).toMatch(/^\/convert\/[a-z-]+$/);
    }
  });
});
