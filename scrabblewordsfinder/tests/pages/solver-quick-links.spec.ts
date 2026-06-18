import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

// ── Solver Quick Links — Positive ──────────────────────────────────────────

test.describe('Solver Quick Links — Positive', () => {
  test('all 5 activity link icons are visible', async ({ page }) => {
    await page.goto(BASE_URL);
    const quickLinks = page.locator('main .flex.items-center.gap-2.ml-auto a');
    await expect(quickLinks).toHaveCount(5);
  });

  test('Word Quiz link points to /activities/', async ({ page }) => {
    await page.goto(BASE_URL);
    const quizLink = page.locator('a[title="Word Quiz"]');
    await expect(quizLink).toBeVisible();
    await expect(quizLink).toHaveAttribute('href', '/activities/');
  });

  test('Word of the Day link points to /activities/', async ({ page }) => {
    await page.goto(BASE_URL);
    const wotdLink = page.locator('a[title="Word of the Day"]');
    await expect(wotdLink).toBeVisible();
    await expect(wotdLink).toHaveAttribute('href', '/activities/');
  });

  test('60-Second Challenge link points to /activities/#60seconds', async ({ page }) => {
    await page.goto(BASE_URL);
    const sixtyLink = page.locator('a[title="60-Second Challenge"]');
    await expect(sixtyLink).toBeVisible();
    await expect(sixtyLink).toHaveAttribute('href', '/activities/#60seconds');
  });

  test('Daily Anagram link points to /activities/#anagram', async ({ page }) => {
    await page.goto(BASE_URL);
    const anagramLink = page.locator('a[title="Daily Anagram"]');
    await expect(anagramLink).toBeVisible();
    await expect(anagramLink).toHaveAttribute('href', '/activities/#anagram');
  });

  test('Daily Rack Challenge link points to /activities/#drc', async ({ page }) => {
    await page.goto(BASE_URL);
    const drcLink = page.locator('a[title="Daily Rack Challenge"]');
    await expect(drcLink).toBeVisible();
    await expect(drcLink).toHaveAttribute('href', '/activities/#drc');
  });

  test('icons are sized at w-9 h-9 (larger than old w-7)', async ({ page }) => {
    await page.goto(BASE_URL);
    const firstIcon = page.locator('a[title="Word Quiz"]');
    await expect(firstIcon).toHaveClass(/w-9/);
    await expect(firstIcon).toHaveClass(/h-9/);
  });
});

// ── Solver Quick Links — Negative ──────────────────────────────────────────

test.describe('Solver Quick Links — Negative', () => {
  test('no old small w-7 icon links remain in quick links', async ({ page }) => {
    await page.goto(BASE_URL);
    const quickLinksContainer = page.locator('main .flex.items-center.gap-2.ml-auto');
    const smallIcons = quickLinksContainer.locator('.w-7');
    await expect(smallIcons).toHaveCount(0);
  });

  test('no duplicate quick link icons', async ({ page }) => {
    await page.goto(BASE_URL);
    const quickLinksContainers = page.locator('main .flex.items-center.gap-2.ml-auto');
    await expect(quickLinksContainers).toHaveCount(1);
  });
});

// ── Activities Page Anagram Link — Positive ────────────────────────────────

test.describe('Activities Page Anagram Link — Positive', () => {
  test('Anagrams link is visible next to 60-Second', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    const anagramLink = page.locator('a[href="/activities/#anagram"]', { hasText: 'Anagrams' });
    await expect(anagramLink).toBeVisible();
  });

  test('Anagrams link has amber styling', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    const anagramLink = page.locator('a[href="/activities/#anagram"]', { hasText: 'Anagrams' });
    await expect(anagramLink).toHaveClass(/bg-amber-600/);
    await expect(anagramLink).toHaveClass(/text-amber-400/);
  });

  test('60-Second link still exists alongside Anagrams', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    const sixtyLink = page.locator('a[href="/sixty-seconds/"]', { hasText: '60-Second' });
    await expect(sixtyLink).toBeVisible();
  });
});

// ── Activities Page Anagram Link — Negative ────────────────────────────────

test.describe('Activities Page Anagram Link — Negative', () => {
  test('no duplicate Anagrams links', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    const anagramLinks = page.locator('a[href="/activities/#anagram"]', { hasText: 'Anagrams' });
    await expect(anagramLinks).toHaveCount(1);
  });
});
