import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const COMPONENT_PATH = path.join(__dirname, '../../src/components/BlogCrossLinks.astro');

/**
 * Tests for the how-to-play-scrabble-videos cross-link entry in BlogCrossLinks.
 */

test.describe('BlogCrossLinks — how-to-play-scrabble-videos — Positive', () => {

  test('component file contains the how-to-play-scrabble-videos slug entry', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("'how-to-play-scrabble-videos'");
  });

  test('how-to-play-scrabble-videos maps to Word Finder tool', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    const line = content.split('\n').find(l => l.includes('how-to-play-scrabble-videos'));
    expect(line).toBeDefined();
    expect(line).toContain('Word Finder');
  });

  test('blog post renders Word Finder cross-link badge', async ({ page }) => {
    await page.goto(`${BASE}/blog/how-to-play-scrabble-videos/`);
    const wordFinder = page.locator('a[title="Word Finder"]');
    await expect(wordFinder).toBeVisible();
  });

  test('Word Finder badge links to homepage', async ({ page }) => {
    await page.goto(`${BASE}/blog/how-to-play-scrabble-videos/`);
    const wordFinder = page.locator('a[title="Word Finder"]');
    await expect(wordFinder).toHaveAttribute('href', '/');
  });
});

test.describe('BlogCrossLinks — how-to-play-scrabble-videos — Negative', () => {

  test('does not render Dictionary badge (not in mapping)', async ({ page }) => {
    await page.goto(`${BASE}/blog/how-to-play-scrabble-videos/`);
    const dictionary = page.locator('a[title="Dictionary"]');
    await expect(dictionary).toHaveCount(0);
  });

  test('does not render Anagram badge (not in mapping)', async ({ page }) => {
    await page.goto(`${BASE}/blog/how-to-play-scrabble-videos/`);
    const anagram = page.locator('a[title="Anagram"]');
    await expect(anagram).toHaveCount(0);
  });
});
