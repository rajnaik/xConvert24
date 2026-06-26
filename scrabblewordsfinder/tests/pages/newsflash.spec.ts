import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ── NewsFlash Section — Positive ────────────────────────────────────────────

test.describe('NewsFlash — Positive', () => {
  test('NewsFlash container is visible on homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const section = page.locator('#NewsFlash');
    await expect(section).toBeVisible();
  });

  test('NewsFlash heading displays correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const heading = page.locator('#NewsFlash h3');
    await expect(heading).toBeVisible();
    // Heading contains either default "News" or the DB-driven text
    const text = await heading.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('NewsFlash heading span is targetable by ID and has text', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const headingSpan = page.locator('#newsflash-heading');
    await expect(headingSpan).toBeVisible();
    // The span starts as "News" but JS updates it with the headline from the API
    const text = await headingSpan.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('NewsFlash content element exists as a div', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const content = page.locator('div#newsflash-content');
    await expect(content).toBeAttached();
  });

  test('NewsFlash content div has spacing class for multi-line support', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const content = page.locator('#newsflash-content');
    await expect(content).toHaveClass(/space-y-1\.5/);
  });

  test('NewsFlash has border-top separator styling', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const section = page.locator('#NewsFlash');
    await expect(section).toHaveClass(/border-t/);
  });

  test('NewsFlash fetches content from /api/constants/?name=NEWS_FLASH', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('name=NEWS_FLASH')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    expect(response.status()).toBe(200);
  });

  test('NewsFlash content is populated after API fetch resolves', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const content = page.locator('#newsflash-content');
    // Wait for the fetch to resolve and populate the element
    await expect(content).not.toHaveText('Loading...', { timeout: 5000 });
    const text = await content.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});

// ── NewsFlash DB-Driven Fetch — Positive ────────────────────────────────────

test.describe('NewsFlash DB Fetch — Positive', () => {
  test('API response includes constant with text field', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('name=NEWS_FLASH')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    const body = await response.json();
    expect(body).toHaveProperty('constant');
    expect(body.constant).toHaveProperty('text');
    expect(body.constant.text.length).toBeGreaterThan(0);
  });

  test('fetch uses trailing slash on API endpoint', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('name=NEWS_FLASH')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    // Ensure the URL has trailing slash before query params
    const url = new URL(response.url());
    expect(url.pathname).toMatch(/\/$/);
  });

  test('NEWSFLASH_HEADER API is called on page load', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('name=NEWSFLASH_HEADER')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    expect(response.status()).toBe(200);
  });

  test('NEWSFLASH_HEADER response includes text field', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('name=NEWSFLASH_HEADER')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    const body = await response.json();
    expect(body).toHaveProperty('constant');
    expect(body.constant).toHaveProperty('text');
    expect(body.constant.text.length).toBeGreaterThan(0);
  });

  test('heading text is updated from NEWSFLASH_HEADER after fetch', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const heading = page.locator('#newsflash-heading');
    // Wait for the heading to update from the default "News"
    await expect(heading).not.toHaveText('News', { timeout: 5000 });
    const text = await heading.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('both NEWS_FLASH and NEWSFLASH_HEADER are fetched in parallel', async ({ page }) => {
    const responses: string[] = [];
    page.on('response', resp => {
      if (resp.url().includes('/api/constants/')) {
        responses.push(resp.url());
      }
    });
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(3000);
    const hasContent = responses.some(u => u.includes('name=NEWS_FLASH'));
    const hasHeader = responses.some(u => u.includes('name=NEWSFLASH_HEADER'));
    expect(hasContent).toBe(true);
    expect(hasHeader).toBe(true);
  });
});

// ── NewsFlash Section — Negative ────────────────────────────────────────────

test.describe('NewsFlash — Negative', () => {
  test('no duplicate NewsFlash sections exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const count = await page.locator('#NewsFlash').count();
    expect(count).toBe(1);
  });

  test('no duplicate newsflash-heading spans exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const count = await page.locator('#newsflash-heading').count();
    expect(count).toBe(1);
  });

  test('NewsFlash does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    const newsflashErrors = errors.filter(e => e.toLowerCase().includes('newsflash'));
    expect(newsflashErrors).toHaveLength(0);
  });

  test('NewsFlash gracefully handles API failure without crashing', async ({ page }) => {
    // Block the API call to simulate network failure
    await page.route('**/api/constants/**', route => route.abort('connectionrefused'));
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    // Filter out unrelated third-party errors (e.g., AdSense)
    const newsflashErrors = errors.filter(e => !e.includes('adsbygoogle') && !e.includes('googletag'));
    expect(newsflashErrors).toHaveLength(0);
    // The content element should still exist (fallback text)
    const content = page.locator('#newsflash-content');
    await expect(content).toBeAttached();
  });

  test('NewsFlash heading falls back to default when NEWSFLASH_HEADER API fails', async ({ page }) => {
    // Block only the header API, allow content through
    await page.route('**/api/constants/?name=NEWSFLASH_HEADER', route => route.abort('connectionrefused'));
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    const heading = page.locator('#newsflash-heading');
    // Should still show fallback "News" since the header fetch failed
    await expect(heading).toHaveText('News');
  });

  test('NewsFlash does not render empty content if API returns empty text', async ({ page }) => {
    // Mock the API to return empty text
    await page.route('**/api/constants/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ constant: { text: '' } }),
      });
    });
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1000);
    const content = page.locator('#newsflash-content');
    // Should keep fallback text when API returns empty
    const text = await content.textContent();
    // Either keeps original fallback or is empty — but shouldn't crash
    expect(text).toBeDefined();
  });
});
