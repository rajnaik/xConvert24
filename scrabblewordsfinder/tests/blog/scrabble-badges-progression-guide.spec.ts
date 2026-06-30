import { test, expect } from '@playwright/test';

/**
 * Tests for structured data (Article + FAQPage JSON-LD) on the
 * "Scrabble Badges & Progression Guide" blog post.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE_URL = `${BASE}/blog/scrabble-badges-progression-guide/`;

test.describe('Blog Badges Progression Schema \u2014 Positive', () => {
  test('page loads successfully', async ({ page }) => {
    const response = await page.goto(PAGE_URL);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Article schema is present with correct headline', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"@type":"Article"') || text?.includes('"@type": "Article"')) {
        foundArticle = true;
        expect(text).toContain('Scrabble Badges & Progression Guide');
        expect(text).toContain('datePublished');
        expect(text).toContain('ScrabbleWordsFinder.com');
        expect(text).toContain('/blog/scrabble-badges-progression-guide/');
      }
    }
    expect(foundArticle).toBe(true);
  });

  test('FAQPage schema is present with at least 3 questions', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    expect(faqData).not.toBeNull();
    expect(faqData['@type']).toBe('FAQPage');
    expect(faqData.mainEntity.length).toBeGreaterThanOrEqual(3);
  });

  test('FAQ questions cover badge earning topic', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let questions: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        const data = JSON.parse(text!);
        questions = data.mainEntity.map((q: any) => q.name);
        break;
      }
    }
    expect(questions).toContain('How do I earn badges on ScrabbleWordsFinder?');
    expect(questions.some(q => q.toLowerCase().includes('tier') || q.toLowerCase().includes('badge'))).toBe(true);
    expect(questions.some(q => q.toLowerCase().includes('diamond'))).toBe(true);
  });
});

test.describe('Blog Badges Progression \u2014 Badges Icon Link \u2014 Positive', () => {
  test('badges icon link is visible in article meta', async ({ page }) => {
    await page.goto(PAGE_URL);
    const badgesLink = page.locator('.not-prose a[href="/badges/"]').first();
    await expect(badgesLink).toBeVisible();
  });

  test('badges icon link has correct href with trailing slash', async ({ page }) => {
    await page.goto(PAGE_URL);
    const badgesLink = page.locator('.not-prose a[href="/badges/"]').first();
    const href = await badgesLink.getAttribute('href');
    expect(href).toBe('/badges/');
  });

  test('badges icon link has medal emoji', async ({ page }) => {
    await page.goto(PAGE_URL);
    const badgesLink = page.locator('.not-prose a[href="/badges/"]').first();
    const text = await badgesLink.textContent();
    expect(text).toContain('\u{1F3C5}');
  });

  test('badges icon link has purple styling', async ({ page }) => {
    await page.goto(PAGE_URL);
    const badgesLink = page.locator('.not-prose a[href="/badges/"]').first();
    const classes = await badgesLink.getAttribute('class');
    expect(classes).toContain('text-purple-400');
  });
});

test.describe('Blog Badges Progression \u2014 Inline Badges Link in Prose \u2014 Positive', () => {
  test('inline badges link is visible within the Badges: Visual Milestones paragraph', async ({ page }) => {
    await page.goto(PAGE_URL);
    const inlineLink = page.locator('p.text-gray-600 a[href="/badges/"], p.dark\\:text-gray-300 a[href="/badges/"]').first();
    await expect(inlineLink).toBeVisible();
  });

  test('inline badges link text contains "View all badge tiers"', async ({ page }) => {
    await page.goto(PAGE_URL);
    const inlineLink = page.locator('p.text-gray-600 a[href="/badges/"], p.dark\\:text-gray-300 a[href="/badges/"]').first();
    const text = await inlineLink.textContent();
    expect(text).toContain('View all badge tiers');
  });

  test('inline badges link has trailing slash', async ({ page }) => {
    await page.goto(PAGE_URL);
    const inlineLink = page.locator('p.text-gray-600 a[href="/badges/"], p.dark\\:text-gray-300 a[href="/badges/"]').first();
    const href = await inlineLink.getAttribute('href');
    expect(href).toBe('/badges/');
  });
});

test.describe('Blog Badges Progression \u2014 Inline Badges Link \u2014 Negative', () => {
  test('no duplicate inline badges links in the same paragraph', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'crown jewels' });
    const badgesLinks = paragraph.locator('a[href="/badges/"]');
    const count = await badgesLinks.count();
    expect(count).toBe(1);
  });

  test('inline badges link has accessible aria-hidden on decorative emoji', async ({ page }) => {
    await page.goto(PAGE_URL);
    const inlineLink = page.locator('p.text-gray-600 a[href="/badges/"], p.dark\\:text-gray-300 a[href="/badges/"]').first();
    const span = inlineLink.locator('span[aria-hidden="true"]');
    await expect(span).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('Blog Badges Progression \u2014 Diamond Hunt Tip \u2014 Positive', () => {
  test('Diamond Hunt tip box is visible in the tips section', async ({ page }) => {
    await page.goto(PAGE_URL);
    const tipBox = page.locator('div.border-purple-500\\/30', { hasText: 'Explore Diamond Hunt:' });
    await expect(tipBox).toBeVisible();
  });

  test('Diamond Hunt tip link has correct href with trailing slash', async ({ page }) => {
    await page.goto(PAGE_URL);
    const tipBox = page.locator('div.border-purple-500\\/30', { hasText: 'Explore Diamond Hunt:' });
    const link = tipBox.locator('a[href="/diamond-hunt/"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe('/diamond-hunt/');
  });

  test('Diamond Hunt tip link has diamond emoji with aria-hidden', async ({ page }) => {
    await page.goto(PAGE_URL);
    const tipBox = page.locator('div.border-purple-500\\/30', { hasText: 'Explore Diamond Hunt:' });
    const link = tipBox.locator('a[href="/diamond-hunt/"]');
    const emoji = link.locator('span[aria-hidden="true"]');
    await expect(emoji).toHaveAttribute('aria-hidden', 'true');
    const text = await emoji.textContent();
    expect(text).toContain('\u{1F48E}');
  });

  test('Diamond Hunt tip link has amber styling', async ({ page }) => {
    await page.goto(PAGE_URL);
    const tipBox = page.locator('div.border-purple-500\\/30', { hasText: 'Explore Diamond Hunt:' });
    const link = tipBox.locator('a[href="/diamond-hunt/"]');
    const classes = await link.getAttribute('class');
    expect(classes).toContain('text-amber-400');
  });
});

test.describe('Blog Badges Progression \u2014 Diamond Hunt Tip \u2014 Negative', () => {
  test('no duplicate Diamond Hunt links within the tip box', async ({ page }) => {
    await page.goto(PAGE_URL);
    const tipBox = page.locator('div.border-purple-500\\/30', { hasText: 'Explore Diamond Hunt:' });
    const links = tipBox.locator('a[href="/diamond-hunt/"]');
    const count = await links.count();
    expect(count).toBe(1);
  });

  test('Diamond Hunt tip link does not contain broken or empty link text', async ({ page }) => {
    await page.goto(PAGE_URL);
    const tipBox = page.locator('div.border-purple-500\\/30', { hasText: 'Explore Diamond Hunt:' });
    const link = tipBox.locator('a[href="/diamond-hunt/"]');
    const text = await link.textContent();
    expect(text!.trim().length).toBeGreaterThan(5);
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });
});

test.describe('Blog Badges Progression Schema \u2014 Negative', () => {
  test('no duplicate FAQPage schemas on the page', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) faqCount++;
    }
    expect(faqCount).toBe(1);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});


test.describe('Blog Badges Progression \u2014 Activity Cards \u2014 Positive', () => {
  test('all 7 daily activity cards are clickable anchor links', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activityGrid = page.locator('.not-prose.my-6.grid');
    const cards = activityGrid.locator('> a.block');
    const count = await cards.count();
    expect(count).toBe(7);
  });

  test('each activity card has a "Play \u2192" span', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activityGrid = page.locator('.not-prose.my-6.grid');
    const cards = activityGrid.locator('> a.block');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const playSpan = cards.nth(i).locator('span', { hasText: 'Play \u2192' });
      expect(await playSpan.count()).toBe(1);
    }
  });

  test('WOTD card links to /activities/', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.not-prose.my-6.grid > a.block', { hasText: 'Word of the Day' });
    await expect(card).toHaveAttribute('href', '/activities/');
  });

  test('Word Quiz card links to /activities/', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.not-prose.my-6.grid > a.block', { hasText: 'Word Quiz' });
    await expect(card).toHaveAttribute('href', '/activities/');
  });

  test('Memory WordBench card links to /activities/', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.not-prose.my-6.grid > a.block:has(span.font-semibold:has-text("Memory WordBench"))');
    await expect(card).toHaveAttribute('href', '/activities/');
  });

  test('Daily Rack Challenge card links to /activities/', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.not-prose.my-6.grid > a.block', { hasText: 'Daily Rack Challenge' });
    await expect(card).toHaveAttribute('href', '/activities/');
  });

  test('Daily Anagram card links to /activities/#anagram', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.not-prose.my-6.grid > a.block', { hasText: 'Daily Anagram' });
    await expect(card).toHaveAttribute('href', '/activities/#anagram');
  });

  test('60-Second Challenge card links to /activities/#60seconds', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.not-prose.my-6.grid > a.block', { hasText: '60-Second Challenge' });
    await expect(card).toHaveAttribute('href', '/activities/#60seconds');
  });

  test('Cows and Bulls card links to /activities/#cab', async ({ page }) => {
    await page.goto(PAGE_URL);
    const card = page.locator('.not-prose.my-6.grid > a.block', { hasText: 'Cows and Bulls' });
    await expect(card).toHaveAttribute('href', '/activities/#cab');
  });

  test('activity cards have aria-hidden emoji spans for accessibility', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activityGrid = page.locator('.not-prose.my-6.grid');
    const cards = activityGrid.locator('> a.block');
    const count = await cards.count();
    expect(count).toBe(7);
    for (let i = 0; i < count; i++) {
      const hiddenSpan = cards.nth(i).locator('span[aria-hidden="true"]');
      await expect(hiddenSpan).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('activity cards have group class for hover effects', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activityGrid = page.locator('.not-prose.my-6.grid');
    const firstCard = activityGrid.locator('> a.block').first();
    const classes = await firstCard.getAttribute('class');
    expect(classes).toContain('group');
  });
});

test.describe('Blog Badges Progression \u2014 Activity Cards \u2014 Negative', () => {
  test('no nested anchor tags inside activity cards', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activityGrid = page.locator('.not-prose.my-6.grid');
    const cards = activityGrid.locator('> a.block');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const nestedLinks = cards.nth(i).locator('a');
      expect(await nestedLinks.count()).toBe(0);
    }
  });

  test('all activity card hrefs have trailing slash before any hash', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activityGrid = page.locator('.not-prose.my-6.grid');
    const cards = activityGrid.locator('> a.block');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute('href');
      expect(href).toMatch(/\/(#.*)?$/);
    }
  });

  test('activity cards do not contain broken or empty text', async ({ page }) => {
    await page.goto(PAGE_URL);
    const activityGrid = page.locator('.not-prose.my-6.grid');
    const cards = activityGrid.locator('> a.block');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      expect(text!.trim().length).toBeGreaterThan(10);
      expect(text).not.toContain('undefined');
      expect(text).not.toContain('null');
    }
  });

  test('activity cards do not navigate to 404', async ({ page }) => {
    await page.goto(PAGE_URL);
    const firstCard = page.locator('.not-prose.my-6.grid > a.block').first();
    const href = await firstCard.getAttribute('href');
    const response = await page.goto(`${BASE}${href}`);
    expect(response?.status()).toBe(200);
  });
});


test.describe('Blog Badges Progression — MyBag Inline Link — Positive', () => {
  test('MyBag inline link is visible in the MyBag dashboard paragraph', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLink = paragraph.locator('a[href="/mybag/"]');
    await expect(mybagLink).toBeVisible();
  });

  test('MyBag inline link has correct href with trailing slash', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLink = paragraph.locator('a[href="/mybag/"]');
    const href = await mybagLink.getAttribute('href');
    expect(href).toBe('/mybag/');
  });

  test('MyBag inline link contains backpack emoji', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLink = paragraph.locator('a[href="/mybag/"]');
    const text = await mybagLink.textContent();
    expect(text).toContain('🎒');
  });

  test('MyBag inline link text contains "Open MyBag"', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLink = paragraph.locator('a[href="/mybag/"]');
    const text = await mybagLink.textContent();
    expect(text).toContain('Open MyBag');
  });

  test('MyBag inline link has blue styling', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLink = paragraph.locator('a[href="/mybag/"]');
    const classes = await mybagLink.getAttribute('class');
    expect(classes).toContain('text-blue-400');
  });

  test('MyBag inline link emoji has aria-hidden for accessibility', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLink = paragraph.locator('a[href="/mybag/"]');
    const emojiSpan = mybagLink.locator('span[aria-hidden="true"]');
    await expect(emojiSpan).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('Blog Badges Progression — MyBag Inline Link — Negative', () => {
  test('no duplicate MyBag links in the dashboard paragraph', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLinks = paragraph.locator('a[href="/mybag/"]');
    expect(await mybagLinks.count()).toBe(1);
  });

  test('MyBag link does not contain broken or empty text', async ({ page }) => {
    await page.goto(PAGE_URL);
    const paragraph = page.locator('p.text-gray-600.dark\\:text-gray-300', { hasText: 'Everything feeds into MyBag' });
    const mybagLink = paragraph.locator('a[href="/mybag/"]');
    const text = await mybagLink.textContent();
    expect(text!.trim().length).toBeGreaterThan(5);
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });
});
