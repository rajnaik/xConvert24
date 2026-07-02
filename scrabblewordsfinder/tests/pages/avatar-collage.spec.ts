import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

// ── Avatar Collage Page — Positive ───────────────────────────────────────

test.describe('Avatar Collage Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    await expect(page).toHaveTitle(/Avatar Collage/);
  });

  test('page heading is visible', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const heading = page.getByRole('heading', { name: 'Avatar Style Collage' });
    await expect(heading).toBeVisible();
  });

  test('back to settings link is present', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const link = page.getByRole('link', { name: 'Back to Settings' });
    await expect(link).toBeVisible();
  });

  test('Animal Avatars section exists with heading', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const section = page.locator('#animal-section');
    await expect(section).toBeVisible();
    const heading = section.locator('h2');
    await expect(heading).toContainText('Animal Face Avatars');
  });

  test('Animal grid generates avatar cards from seeds', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    await page.waitForTimeout(2000);
    const cards = page.locator('#animal-grid .avatar-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('DiceBear section exists with heading', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const section = page.locator('#dicebear-section');
    await expect(section).toBeVisible();
    const heading = section.locator('h2');
    await expect(heading).toContainText('DiceBear Styles');
  });

  test('DiceBear grid generates avatar cards when filter clicked', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    await page.waitForTimeout(2000);
    // DiceBear grid is empty by default — click a style filter to populate it
    await page.locator('button[data-filter="fun-emoji"]').click();
    await page.waitForTimeout(1000);
    const cards = page.locator('#avatar-grid .avatar-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Animal Faces filter button exists', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const btn = page.locator('button[data-filter="animal-avatars"]');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Animal Faces');
  });

  test('All Styles filter button is active by default', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const btn = page.locator('button[data-filter="all"]');
    const classes = await btn.getAttribute('class') || '';
    expect(classes).toContain('active');
  });

  test('clicking Animal Faces filter shows only animal section', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    await page.waitForTimeout(2000);
    await page.locator('button[data-filter="animal-avatars"]').click();
    await page.waitForTimeout(500);

    const animalSection = page.locator('#animal-section');
    const dicebearSection = page.locator('#dicebear-section');
    await expect(animalSection).toBeVisible();
    await expect(dicebearSection).toBeHidden();
  });

  test('clicking a DiceBear style filter hides animal section', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    await page.waitForTimeout(2000);
    await page.locator('button[data-filter="fun-emoji"]').click();
    await page.waitForTimeout(500);

    const animalSection = page.locator('#animal-section');
    const dicebearSection = page.locator('#dicebear-section');
    await expect(animalSection).toBeHidden();
    await expect(dicebearSection).toBeVisible();
  });

  test('clicking All Styles shows both sections', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    await page.waitForTimeout(2000);
    // First filter to animal only
    await page.locator('button[data-filter="animal-avatars"]').click();
    await page.waitForTimeout(300);
    // Then switch back to all
    await page.locator('button[data-filter="all"]').click();
    await page.waitForTimeout(500);

    const animalSection = page.locator('#animal-section');
    const dicebearSection = page.locator('#dicebear-section');
    await expect(animalSection).toBeVisible();
    await expect(dicebearSection).toBeVisible();
  });

  test('style summary table includes animal-avatars row', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const row = page.locator('table tbody tr', { hasText: 'animal-avatars' });
    await expect(row).toBeVisible();
    await expect(row).toContainText('MIT');
  });

  test('all 9 filter buttons are present', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const buttons = page.locator('.filter-btn');
    // all, animal-avatars, fun-emoji, thumbs, bottts, adventurer, pixel-art, big-smile, lorelei, notionists = 10
    expect(await buttons.count()).toBe(10);
  });

  test('Animal Faces button has amber styling', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const btn = page.locator('button[data-filter="animal-avatars"]');
    const classes = await btn.getAttribute('class') || '';
    expect(classes).toContain('bg-amber-700');
  });
});

// ── Avatar Collage Page — Negative ───────────────────────────────────────

test.describe('Avatar Collage Page — Negative', () => {
  test('no duplicate animal-section elements', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    expect(await page.locator('#animal-section').count()).toBe(1);
    expect(await page.locator('#animal-grid').count()).toBe(1);
    expect(await page.locator('#dicebear-section').count()).toBe(1);
    expect(await page.locator('#avatar-grid').count()).toBe(1);
  });

  test('no sensitive information exposed', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const content = await page.locator('body').textContent() || '';
    expect(content).not.toContain('sk-');
    expect(content).not.toContain('AKIA');
    expect(content).not.toContain('@gmail.com');
    expect(content).not.toContain('rajeev');
  });

  test('filter button click does not produce console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/avatar-collage/`);
    await page.waitForTimeout(2000);
    await page.locator('button[data-filter="animal-avatars"]').click();
    await page.waitForTimeout(500);
    await page.locator('button[data-filter="fun-emoji"]').click();
    await page.waitForTimeout(500);
    await page.locator('button[data-filter="all"]').click();
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('animal-avatars filter button does not get teal styling', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    await page.waitForTimeout(1000);
    await page.locator('button[data-filter="animal-avatars"]').click();
    await page.waitForTimeout(300);
    const btn = page.locator('button[data-filter="animal-avatars"]');
    const classes = await btn.getAttribute('class') || '';
    // Should have amber styling, NOT teal
    expect(classes).toContain('bg-amber-700');
    expect(classes).not.toContain('bg-teal-600');
  });

  test('no duplicate filter buttons', async ({ page }) => {
    await page.goto(`${BASE}/avatar-collage/`);
    const allBtns = page.locator('button[data-filter="all"]');
    const animalBtns = page.locator('button[data-filter="animal-avatars"]');
    expect(await allBtns.count()).toBe(1);
    expect(await animalBtns.count()).toBe(1);
  });
});
