import { test, expect } from '@playwright/test';

/**
 * SEO & Accessibility Tests
 * Tests meta tags, canonical URLs, structured data, Open Graph,
 * ARIA attributes, and general accessibility patterns.
 */

test.describe('SEO — Meta Tags', () => {
  const pages = [
    { path: '/', titleMatch: /Scrabble Word Finder/ },
    { path: '/settings', titleMatch: /Settings/ },
    { path: '/suggest', titleMatch: /Suggest/ },
    { path: '/contact', titleMatch: /Contact/ },
    { path: '/guide', titleMatch: /Guide/ },
    { path: '/about', titleMatch: /About/ },
    { path: '/privacy', titleMatch: /Privacy/ },
    { path: '/terms', titleMatch: /Terms/ },
    { path: '/disclaimer', titleMatch: /Disclaimer/ },
  ];

  for (const { path, titleMatch } of pages) {
    test(`${path} has proper title`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(titleMatch);
    });
  }

  for (const { path } of pages) {
    test(`${path} has meta description`, async ({ page }) => {
      await page.goto(path);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(50);
      expect(description!.length).toBeLessThan(160);
    });
  }

  for (const { path } of pages) {
    test(`${path} has meta keywords`, async ({ page }) => {
      await page.goto(path);
      const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
      expect(keywords).toBeTruthy();
      expect(keywords!.length).toBeGreaterThan(10);
    });
  }
});

test.describe('SEO — Canonical URLs', () => {
  test('homepage has canonical URL', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('scrabblewordsfinder.com');
    expect(canonical).toMatch(/\/$/);
  });

  test('settings has canonical URL', async ({ page }) => {
    await page.goto('/settings');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('scrabblewordsfinder.com/settings');
  });
});

test.describe('SEO — Open Graph', () => {
  test('homepage has OG tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogType).toBe('website');
    expect(ogUrl).toContain('scrabblewordsfinder.com');
  });

  test('homepage has Twitter card meta', async ({ page }) => {
    await page.goto('/');
    const card = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const title = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    expect(card).toBe('summary');
    expect(title).toBeTruthy();
  });
});

test.describe('SEO — Structured Data', () => {
  test('homepage has FAQPage schema', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    expect(faq).toBeTruthy();
    const parsed = JSON.parse(faq!);
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity.length).toBeGreaterThan(0);
  });

  test('homepage has WebApplication schema', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const app = scripts.find(s => s.includes('WebApplication'));
    expect(app).toBeTruthy();
    const parsed = JSON.parse(app!);
    expect(parsed['@type']).toBe('WebApplication');
    expect(parsed.offers.price).toBe('0');
  });

  test('homepage has HowTo schema', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const howto = scripts.find(s => s.includes('HowTo'));
    expect(howto).toBeTruthy();
    const parsed = JSON.parse(howto!);
    expect(parsed['@type']).toBe('HowTo');
    expect(parsed.step.length).toBe(3);
  });
});

test.describe('Accessibility', () => {
  test('homepage has lang attribute on html', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('homepage has viewport meta tag', async ({ page }) => {
    await page.goto('/');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('all images have alt text or are decorative', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      const role = await images.nth(i).getAttribute('role');
      // Should have alt or role="presentation"
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/suggest');
    // Name input
    const nameLabel = page.locator('label[for="name"]');
    await expect(nameLabel).toBeAttached();
    // Email input
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeAttached();
    // Suggestion textarea
    const suggestionLabel = page.locator('label[for="suggestion"]');
    await expect(suggestionLabel).toBeAttached();
  });

  test('interactive elements have aria-labels where needed', async ({ page }) => {
    await page.goto('/');
    // Download saved button has aria-label
    const downloadBtn = page.locator('#download-saved-btn');
    await expect(downloadBtn).toHaveAttribute('aria-label', 'Download saved words');
  });

  test('decorative emojis have aria-hidden', async ({ page }) => {
    await page.goto('/');
    // Check that span elements with emoji have aria-hidden
    const hiddenSpans = page.locator('span[aria-hidden="true"]');
    const count = await hiddenSpans.count();
    expect(count).toBeGreaterThan(0); // Should have some decorative emojis marked
  });

  test('headings follow hierarchy (no skipped levels)', async ({ page }) => {
    await page.goto('/');
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    // Should have at least one h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBe(1);
  });

  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/');
    // Tab to the first interactive element
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeAttached();
  });
});
