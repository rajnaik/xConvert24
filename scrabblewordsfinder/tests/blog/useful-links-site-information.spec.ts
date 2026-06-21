import { test, expect } from '@playwright/test';

/**
 * Useful Links Page — Site Information Section Tests
 * Tests the new "Site Information" section added to /blog/useful-links/
 * with 8 links: About Us, User Guide, FAQ, Roadmap, Tech Stack, Release Notes,
 * Suggest a Feature, Contact Us.
 */

const SITE_INFO_SECTION = '#site-information';

const EXPECTED_LINKS = [
  { href: '/about/', label: 'About Us' },
  { href: '/guide/', label: 'User Guide' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/roadmap/', label: 'Roadmap' },
  { href: '/tech-stack/', label: 'Tech Stack' },
  { href: '/releases/', label: 'Release Notes' },
  { href: '/suggest/', label: 'Suggest a Feature' },
  { href: '/contact/', label: 'Contact Us' },
];

test.describe('Useful Links Page — Site Information Section — Positive', () => {

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto('/blog/useful-links/');
    expect(response?.status()).toBe(200);
  });

  test('site information section exists and is visible', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator(SITE_INFO_SECTION);
    await expect(section).toBeVisible();
  });

  test('section has correct heading text', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const heading = page.locator(`${SITE_INFO_SECTION} h2`);
    await expect(heading).toContainText('Site Information');
  });

  test('section heading has amber color styling', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const heading = page.locator(`${SITE_INFO_SECTION} h2`);
    await expect(heading).toHaveClass(/text-amber-400/);
  });

  test('section contains exactly 8 link cards', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const links = page.locator(`${SITE_INFO_SECTION} .grid a`);
    await expect(links).toHaveCount(8);
  });

  test('all expected links are present with correct hrefs', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    for (const { href, label } of EXPECTED_LINKS) {
      const link = page.locator(`${SITE_INFO_SECTION} a[href="${href}"]`);
      await expect(link, `Link to "${label}" (${href}) should exist`).toBeVisible();
    }
  });

  test('all link cards show their label text', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    for (const { href, label } of EXPECTED_LINKS) {
      const link = page.locator(`${SITE_INFO_SECTION} a[href="${href}"]`);
      await expect(link).toContainText(label);
    }
  });

  test('link cards use 2-column grid on wider viewports', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const grid = page.locator(`${SITE_INFO_SECTION} .grid`);
    const classes = await grid.getAttribute('class');
    expect(classes).toContain('sm:grid-cols-2');
  });

  test('each card has a subtitle description', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const subtitles = page.locator(`${SITE_INFO_SECTION} .grid a .text-xs.text-gray-500`);
    const count = await subtitles.count();
    expect(count).toBe(8);
    // Verify none are empty
    for (let i = 0; i < count; i++) {
      const text = await subtitles.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('section icon badge has amber background', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const badge = page.locator(`${SITE_INFO_SECTION} .flex.items-center.gap-2 span`).first();
    const classes = await badge.getAttribute('class');
    expect(classes).toContain('bg-amber-900/30');
    expect(classes).toContain('border-amber-500/30');
  });
});

test.describe('Useful Links Page — Site Information Section — Negative', () => {

  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('no duplicate site-information sections on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const sections = page.locator(SITE_INFO_SECTION);
    await expect(sections).toHaveCount(1);
  });

  test('no links have empty href attributes', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const emptyLinks = page.locator(`${SITE_INFO_SECTION} a[href=""]`);
    await expect(emptyLinks).toHaveCount(0);
  });

  test('all links are internal (start with /)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const links = await page.locator(`${SITE_INFO_SECTION} .grid a`).all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.startsWith('/'), `Link "${href}" should be internal`).toBe(true);
    }
  });

  test('no duplicate links within the section', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const links = await page.locator(`${SITE_INFO_SECTION} .grid a`).all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('section does not overlap with other sections (games or player tools)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    // Verify the other sections also exist — the new section didn't replace them
    await expect(page.locator('#games-activities')).toBeVisible();
    await expect(page.locator('#player-tools')).toBeVisible();
  });

  test('link cards do not have broken styling (all have border and rounded classes)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const links = await page.locator(`${SITE_INFO_SECTION} .grid a`).all();
    for (const link of links) {
      const classes = await link.getAttribute('class');
      expect(classes).toContain('rounded-xl');
      expect(classes).toContain('border');
    }
  });
});
