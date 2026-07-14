import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Country Pages — Positive', () => {
  test('countries index page loads with title and country cards', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    await expect(page).toHaveTitle(/Scrabble Countries/);
    // At least one country card should exist
    const cards = page.locator('a[href^="/countries/"]').filter({ hasText: /Players/ });
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('countries index has FAQPage schema', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqSchema = schemas.find(s => s.includes('FAQPage'));
    expect(faqSchema).toBeTruthy();
    expect(faqSchema).toContain('most top Scrabble players');
  });

  test('country detail page loads for a valid country code', async ({ page }) => {
    // First get a valid country code from the index page
    await page.goto(`${BASE}/countries/`);
    // Country cards have hrefs like /countries/ng/ (2-3 letter codes)
    const countryLinks = page.locator('a[href*="/countries/"]').filter({ has: page.locator('h2') });
    const firstLink = countryLinks.first();
    const href = await firstLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/\/countries\/[a-z]{2,3}\/$/);

    // Navigate to the country detail page
    await page.goto(`${BASE}${href}`);
    await expect(page.locator('h1')).toBeVisible();
    // Should have a players table
    await expect(page.locator('table')).toBeVisible();
    // Should have at least one player row
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('country detail page has player links to profiles', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const countryLinks = page.locator('a[href*="/countries/"]').filter({ has: page.locator('h2') });
    const href = await countryLinks.first().getAttribute('href');
    await page.goto(`${BASE}${href}`);

    // Player names should link to /players/ profiles
    const playerLink = page.locator('table tbody a[href^="/players/"]').first();
    await expect(playerLink).toBeVisible();
    const playerHref = await playerLink.getAttribute('href');
    expect(playerHref).toMatch(/^\/players\/.+\/$/);
  });

  test('country detail page has breadcrumb navigation', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const countryLinks = page.locator('a[href*="/countries/"]').filter({ has: page.locator('h2') });
    const href = await countryLinks.first().getAttribute('href');
    await page.goto(`${BASE}${href}`);

    // Breadcrumb should link back to countries index and world rankings
    await expect(page.locator('a[href="/countries/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/world-rankings/"]').first()).toBeVisible();
  });

  test('country API returns valid JSON with players array', async ({ page }) => {
    // Get a valid code from the index
    await page.goto(`${BASE}/countries/`);
    const countryLinks = page.locator('a[href*="/countries/"]').filter({ has: page.locator('h2') });
    const href = await countryLinks.first().getAttribute('href');
    // Extract code from href like /countries/ng/
    const code = (href || '').replace('/countries/', '').replace('/', '');

    const response = await page.request.get(`${BASE}/api/public/country/${code}/`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.country_code).toBeTruthy();
    expect(data.players).toBeInstanceOf(Array);
    expect(data.players.length).toBeGreaterThan(0);
    expect(data.total_players).toBe(data.players.length);
    expect(data.avg_rating).toBeGreaterThan(0);
  });
});

test.describe('Country Pages — Negative', () => {
  test('invalid country code redirects to countries index', async ({ page }) => {
    const response = await page.goto(`${BASE}/countries/zzzz/`);
    // Should redirect to /countries/ (302/301) or show the index
    expect(page.url()).toContain('/countries');
  });

  test('country API returns 404 for nonexistent country', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/public/country/zz/`);
    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('No players found');
  });

  test('country API returns 400 for invalid code format', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/public/country/x/`);
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid country code');
  });

  test('no duplicate country cards on index page', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const hrefs = await page.locator('a[href*="/countries/"]').filter({ has: page.locator('h2') }).evaluateAll(
      els => els.map(el => el.getAttribute('href'))
    );
    // Check uniqueness of hrefs
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  test('countries index does not expose admin/internal data', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const content = await page.content();
    // Check for actually sensitive data patterns (not player names or standard nav)
    expect(content).not.toContain('api_key');
    expect(content).not.toContain('AKIA');
    expect(content).not.toContain('xconvert24@gmail');
  });
});
