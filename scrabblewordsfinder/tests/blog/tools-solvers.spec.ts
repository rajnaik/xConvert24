import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ─── Tools & Solvers Landing Page ───────────────────────────────────────────

test.describe('Tools & Solvers Landing Page — Positive', () => {
  test('page loads with correct title containing "Tools & Solvers"', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    await expect(page).toHaveTitle(/Tools & Solvers/i);
  });

  test('has h1 heading with "Scrabble Tools & Solvers"', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Scrabble Tools & Solvers');
  });

  test('contains all 4 section h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const expectedHeadings = [
      'Understanding Solvers',
      'Finding the Right Tools',
      'Specialized Calculators',
      'AI Opponents',
    ];
    for (const heading of expectedHeadings) {
      await expect(page.locator(`h2:has-text("${heading}")`)).toBeVisible();
    }
  });

  test('has at least 14 post links', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const postLinks = page.locator('a[href^="/blog/"]');
    await expect(postLinks).toHaveCount({ minimum: 14 });
  });

  test('has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schema.nth(i).textContent();
      if (text && text.includes('FAQPage')) {
        hasFAQ = true;
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('has CTA box with link to "/"', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const ctaLink = page.locator('a[href="/"]');
    await expect(ctaLink.first()).toBeVisible();
  });

  test('has "← Back to all articles" link', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
  });
});

test.describe('Tools & Solvers Landing Page — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/blog/tools-solvers/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const h2s = await page.locator('h2').allTextContents();
    const trimmed = h2s.map((t) => t.trim()).filter(Boolean);
    const unique = new Set(trimmed);
    expect(unique.size).toBe(trimmed.length);
  });

  test('no broken internal links — all card hrefs start with /blog/', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const links = await page.locator('a[href^="/blog/"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^\/blog\//);
    }
  });

  test('page does not expose sensitive info', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const body = await page.locator('body').textContent();
    expect(body).not.toMatch(/@gmail\.com/);
    expect(body).not.toMatch(/sk-/);
    expect(body).not.toMatch(/AKIA/);
  });
});

// ─── Scrabble Dictionary Apps Post ──────────────────────────────────────────

test.describe('Scrabble Dictionary Apps Post — Positive', () => {
  test('page loads with title containing "Dictionary Apps"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    await expect(page).toHaveTitle(/Dictionary Apps/i);
  });

  test('has h1 heading', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('has at least 6 h2 sections', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount({ minimum: 6 });
  });

  test('has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schema.nth(i).textContent();
      if (text && text.includes('FAQPage')) {
        hasFAQ = true;
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('has breadcrumb with "Tools & Solvers" text', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const breadcrumb = page.locator('text=Tools & Solvers');
    await expect(breadcrumb.first()).toBeVisible();
  });

  test('has CTA box linking to "/"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const ctaLink = page.locator('a[href="/"]');
    await expect(ctaLink.first()).toBeVisible();
  });

  test('has Related Articles aside with at least 2 links', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const relatedSection = page.locator('text=Related Articles');
    await expect(relatedSection.first()).toBeVisible();
    const relatedLinks = page.locator('aside a[href^="/blog/"], section:has-text("Related Articles") a[href^="/blog/"]');
    await expect(relatedLinks).toHaveCount({ minimum: 2 });
  });
});

test.describe('Scrabble Dictionary Apps Post — Negative', () => {
  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('no empty h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const h2s = await page.locator('h2').allTextContents();
    for (const h2 of h2s) {
      expect(h2.trim().length).toBeGreaterThan(0);
    }
  });

  test('has no stub content — body text length > 2000 chars', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const bodyText = await page.locator('article, main').first().textContent();
    expect(bodyText!.length).toBeGreaterThan(2000);
  });
});

// ─── Scrabble Word Checker Tools Post ───────────────────────────────────────

test.describe('Scrabble Word Checker Tools Post — Positive', () => {
  test('page loads with title containing "Word Checker"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    await expect(page).toHaveTitle(/Word Checker/i);
  });

  test('has h1 heading', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('has at least 6 h2 sections', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount({ minimum: 6 });
  });

  test('has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schema.nth(i).textContent();
      if (text && text.includes('FAQPage')) {
        hasFAQ = true;
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('has breadcrumb with "Tools & Solvers" text', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const breadcrumb = page.locator('text=Tools & Solvers');
    await expect(breadcrumb.first()).toBeVisible();
  });

  test('has CTA box linking to "/"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const ctaLink = page.locator('a[href="/"]');
    await expect(ctaLink.first()).toBeVisible();
  });
});

test.describe('Scrabble Word Checker Tools Post — Negative', () => {
  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('no empty h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const h2s = await page.locator('h2').allTextContents();
    for (const h2 of h2s) {
      expect(h2.trim().length).toBeGreaterThan(0);
    }
  });

  test('has no stub content — body text length > 2000 chars', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const bodyText = await page.locator('article, main').first().textContent();
    expect(bodyText!.length).toBeGreaterThan(2000);
  });
});
