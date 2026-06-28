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

  test('NewsFlash content is populated after API fetch resolves', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const content = page.locator('#newsflash-content');
    // Wait for the fetch to resolve and populate the element
    await expect(content).not.toHaveText('Loading...', { timeout: 5000 });
    const text = await content.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});

// ── Constants Batch Fetch — Positive ────────────────────────────────────────

test.describe('Constants Batch Fetch — Positive', () => {
  test('single /api/constants/?active=true request fetches all constants', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('active=true')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    expect(response.status()).toBe(200);
  });

  test('batch response includes constants array with name and text fields', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('active=true')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    const body = await response.json();
    expect(body).toHaveProperty('constants');
    expect(Array.isArray(body.constants)).toBe(true);
    expect(body.constants.length).toBeGreaterThan(0);
    // Each constant should have name and text
    for (const c of body.constants) {
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('text');
    }
  });

  test('batch response includes TAGLINE constant', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('active=true')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    const body = await response.json();
    const tagline = body.constants.find((c: any) => c.name === 'TAGLINE');
    expect(tagline).toBeDefined();
    expect(tagline.text.length).toBeGreaterThan(0);
  });

  test('batch response includes NEWS_FLASH constant', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('active=true')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    const body = await response.json();
    const newsflash = body.constants.find((c: any) => c.name === 'NEWS_FLASH');
    expect(newsflash).toBeDefined();
    expect(newsflash.text.length).toBeGreaterThan(0);
  });

  test('batch response includes NEWSFLASH_HEADER constant', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('active=true')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    const body = await response.json();
    const header = body.constants.find((c: any) => c.name === 'NEWSFLASH_HEADER');
    expect(header).toBeDefined();
    expect(header.text.length).toBeGreaterThan(0);
  });

  test('fetch uses trailing slash on API endpoint', async ({ page }) => {
    const apiCalled = page.waitForResponse(
      resp => resp.url().includes('/api/constants/') && resp.url().includes('active=true')
    );
    await page.goto(`${BASE_URL}/`);
    const response = await apiCalled;
    // Ensure the URL has trailing slash before query params
    const url = new URL(response.url());
    expect(url.pathname).toMatch(/\/$/);
  });

  test('heading text is updated from NEWSFLASH_HEADER after fetch', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const heading = page.locator('#newsflash-heading');
    // Wait for the heading to update from the default "News"
    await expect(heading).not.toHaveText('News', { timeout: 5000 });
    const text = await heading.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('constants requests reduced to 2 (batch + copyright year from Layout)', async ({ page }) => {
    const constantsRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/api/constants/')) {
        constantsRequests.push(req.url());
      }
    });
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(3000);
    // 1 batched active=true (homepage) + 1 COPYRIGHT_YEAR (Layout footer) = 2
    expect(constantsRequests.length).toBe(2);
    expect(constantsRequests.some(u => u.includes('active=true'))).toBe(true);
    expect(constantsRequests.some(u => u.includes('name=COPYRIGHT_YEAR'))).toBe(true);
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

  test('NewsFlash heading falls back to default "News" when constants API fails', async ({ page }) => {
    // Block the constants API entirely
    await page.route('**/api/constants/**', route => route.abort('connectionrefused'));
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    const heading = page.locator('#newsflash-heading');
    // Should still show fallback "News" since the batch fetch failed
    await expect(heading).toHaveText('News');
  });

  test('newsflash-content shows fallback when constants API returns empty array', async ({ page }) => {
    // Mock the API to return empty constants array
    await page.route('**/api/constants/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ constants: [] }),
      });
    });
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1500);
    const content = page.locator('#newsflash-content');
    // Should keep fallback "Loading..." text when no constants returned
    const text = await content.textContent();
    expect(text).toBeDefined();
    // The page should not crash
    const heading = page.locator('#newsflash-heading');
    await expect(heading).toHaveText('News');
  });

  test('no individual NEWS_FLASH or NEWSFLASH_HEADER requests (batched instead)', async ({ page }) => {
    const individualRequests: string[] = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('/api/constants/') && (url.includes('name=NEWS_FLASH') || url.includes('name=NEWSFLASH_HEADER') || url.includes('name=TAGLINE'))) {
        individualRequests.push(url);
      }
    });
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(3000);
    // These should all come from the batch call now, not individual requests
    expect(individualRequests.length).toBe(0);
  });
});
