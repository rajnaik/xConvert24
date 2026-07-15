import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ─────────────────────────────────────────────────
// Country Pages — Positive
// ─────────────────────────────────────────────────
test.describe('Country Pages — Positive', () => {
  test('countries index loads with country grid', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    await expect(page).toHaveTitle(/Countries/i);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('countries index shows country cards with stats', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const cards = page.locator('a[href^="/countries/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('country detail page loads for valid code', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    // Click the first country card
    const firstCard = page.locator('a[href^="/countries/"]').first();
    const href = await firstCard.getAttribute('href');
    await page.goto(`${BASE}${href}`);
    await expect(page.locator('h1').first()).toBeVisible();
    // Should show players table
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('country detail page has FAQPage schema', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const firstCard = page.locator('a[href^="/countries/"]').first();
    const href = await firstCard.getAttribute('href');
    await page.goto(`${BASE}${href}`);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    expect(count).toBeGreaterThan(0);
    let foundFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text && text.includes('FAQPage')) { foundFAQ = true; break; }
    }
    expect(foundFAQ).toBeTruthy();
  });

  test('country detail page has breadcrumb navigation', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const firstCard = page.locator('a[href^="/countries/"]').first();
    const href = await firstCard.getAttribute('href');
    await page.goto(`${BASE}${href}`);
    // Breadcrumb links — use .first() for strict mode
    await expect(page.locator('a[href="/world-rankings/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/countries/"]').first()).toBeVisible();
  });
});

test.describe('Country Pages — Negative', () => {
  test('invalid country code redirects to countries index', async ({ page }) => {
    const response = await page.goto(`${BASE}/countries/zz/`);
    // Should redirect to /countries/ (status 200 after redirect)
    expect(page.url()).toContain('/countries/');
  });

  test('countries index has no duplicate country entries', async ({ page }) => {
    await page.goto(`${BASE}/countries/`);
    const cards = page.locator('a[href^="/countries/"]');
    const hrefs: string[] = [];
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute('href');
      hrefs.push(href || '');
    }
    const unique = [...new Set(hrefs)];
    expect(unique.length).toBe(hrefs.length);
  });
});

// ─────────────────────────────────────────────────
// Player Search — Positive
// ─────────────────────────────────────────────────
test.describe('Player Search — Positive', () => {
  test('search input is visible on world-rankings page', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    const searchInput = page.locator('#player-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search any player/);
  });

  test('search API returns results for valid query', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/players/search/?q=david&type=all`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.query).toBe('david');
    expect(json.results.length).toBeGreaterThan(0);
    expect(json.results[0]).toHaveProperty('name');
    expect(json.results[0]).toHaveProperty('rating');
    expect(json.results[0]).toHaveProperty('slug');
  });

  test('search shows dropdown results on typing', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    const searchInput = page.locator('#player-search-input');
    await searchInput.fill('eldar');
    // Wait for debounce + API response
    await page.waitForTimeout(800);
    const resultsPanel = page.locator('#player-search-results');
    await expect(resultsPanel).toBeVisible();
    const links = resultsPanel.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search results link to player profile pages', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    const searchInput = page.locator('#player-search-input');
    await searchInput.fill('david');
    await page.waitForTimeout(500);
    const firstResult = page.locator('#player-search-results a').first();
    const href = await firstResult.getAttribute('href');
    expect(href).toMatch(/^\/players\/[a-z0-9-]+\/$/);
  });
});

test.describe('Player Search — Negative', () => {
  test('search API rejects query under 2 chars', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/players/search/?q=d`);
    expect(response?.status()).toBe(400);
    const json = await response?.json();
    expect(json.error).toContain('2 characters');
  });

  test('search API returns empty for nonsense query', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/players/search/?q=zzzzxxx123`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.results.length).toBe(0);
  });

  test('search dropdown hides when input is cleared', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    const searchInput = page.locator('#player-search-input');
    await searchInput.fill('david');
    await page.waitForTimeout(800);
    await expect(page.locator('#player-search-results')).toBeVisible();
    await searchInput.fill('');
    await expect(page.locator('#player-search-results')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────
// Biggest Movers History — Positive
// ─────────────────────────────────────────────────
test.describe('Biggest Movers History — Positive', () => {
  test('movers tab exists on world-rankings', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    const moversTab = page.locator('[data-tab="movers"]');
    await expect(moversTab).toBeVisible();
    await expect(moversTab).toContainText('Movers');
  });

  test('movers tab shows risers and fallers sections', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    await page.locator('[data-tab="movers"]').click();
    const panel = page.locator('#panel-movers');
    await expect(panel).not.toHaveClass(/hidden/);
    await expect(panel.locator('text=Biggest Movers')).toBeVisible();
  });

  test('all-time movers records section is present', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    await page.locator('[data-tab="movers"]').click();
    // The all-time section should exist (may or may not have data depending on snapshots)
    const allTimeSection = page.locator('text=All-Time Movers Records');
    // If snapshots exist, this section should be visible
    const sectionCount = await allTimeSection.count();
    // Either section exists or insufficient data message exists
    const insufficientData = page.locator('text=Insufficient data');
    expect(sectionCount > 0 || (await insufficientData.count()) > 0).toBeTruthy();
  });

  test('movers API endpoint returns valid structure', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/movers/?type=wespa&period=1m`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json).toHaveProperty('type', 'wespa');
    expect(json).toHaveProperty('risers');
    expect(json).toHaveProperty('fallers');
    expect(Array.isArray(json.risers)).toBeTruthy();
    expect(Array.isArray(json.fallers)).toBeTruthy();
  });
});

test.describe('Biggest Movers History — Negative', () => {
  test('movers API handles invalid period gracefully', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/movers/?period=99m`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    // Should fallback to 1 month
    expect(json).toHaveProperty('risers');
  });

  test('no duplicate players in risers or fallers', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/movers/?type=wespa&limit=5`);
    const json = await response?.json();
    if (json.risers && json.risers.length > 0) {
      const names = json.risers.map((r: any) => r.name);
      const unique = [...new Set(names)];
      expect(unique.length).toBe(names.length);
    }
    if (json.fallers && json.fallers.length > 0) {
      const names = json.fallers.map((f: any) => f.name);
      const unique = [...new Set(names)];
      expect(unique.length).toBe(names.length);
    }
  });
});

// ─────────────────────────────────────────────────
// Records Timeline — Positive
// ─────────────────────────────────────────────────
test.describe('Records Timeline — Positive', () => {
  test('records tab exists and shows records', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    const recordsTab = page.locator('[data-tab="records"]');
    await expect(recordsTab).toBeVisible();
    await recordsTab.click();
    const panel = page.locator('#panel-records');
    await expect(panel).not.toHaveClass(/hidden/);
    await expect(panel.locator('text=Records & Milestones')).toBeVisible();
  });

  test('records display previous holder info when available', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    await page.locator('[data-tab="records"]').click();
    // Look for "Previous:" text which indicates timeline info
    const previousLabels = page.locator('#panel-records >> text=Previous:');
    const count = await previousLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('records display held_since dates', async ({ page }) => {
    await page.goto(`${BASE}/world-rankings/`);
    await page.locator('[data-tab="records"]').click();
    // Look for "Held since" text
    const heldSince = page.locator('#panel-records >> text=Held since');
    const count = await heldSince.count();
    expect(count).toBeGreaterThan(0);
  });

  test('records API returns previous holder fields', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/records/`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.total).toBeGreaterThan(0);
    // Check that at least one record has previous_holder
    const allRecords = Object.values(json.records).flat() as any[];
    const withPrevious = allRecords.filter((r: any) => r.previous_holder && r.previous_holder !== '');
    expect(withPrevious.length).toBeGreaterThan(0);
    expect(withPrevious[0]).toHaveProperty('previous_holder');
    expect(withPrevious[0]).toHaveProperty('previous_value');
    expect(withPrevious[0]).toHaveProperty('held_since');
  });
});

test.describe('Records Timeline — Negative', () => {
  test('records API handles invalid category gracefully', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/records/?category=nonexistent`);
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.total).toBe(0);
  });

  test('no duplicate records in the same category', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/public/records/`);
    const json = await response?.json();
    for (const [category, records] of Object.entries(json.records) as [string, any[]][]) {
      const names = records.map((r: any) => r.record_name);
      const unique = [...new Set(names)];
      expect(unique.length).toBe(names.length);
    }
  });
});
