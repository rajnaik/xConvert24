import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const COMPONENT_PATH = path.join(__dirname, '../../src/components/BlogCrossLinks.astro');

/**
 * Tests for the extended BlogCrossLinks entries (Strategy, Skills, Tournament, Word Categories).
 * Validates that the crossLinks map data is correct and renders properly on posts that use the component.
 */

test.describe('BlogCrossLinks Extended Entries — Positive', () => {

  test('component file contains all new Strategy slug entries', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    const strategySlugs = [
      'scrabble-comeback-strategies',
      'scrabble-first-move-advantages',
      'scrabble-premium-square-strategy',
      'scrabble-double-triple-word-combos',
      'scrabble-setup-plays-traps',
      'scrabble-hotspots-board-positions',
      'scrabble-leave-analysis-guide',
      'scrabble-bluffing-challenges',
    ];
    for (const slug of strategySlugs) {
      expect(content, `Missing strategy slug: ${slug}`).toContain(`'${slug}'`);
    }
  });

  test('component file contains all new Skills slug entries', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    const skillsSlugs = [
      'scrabble-anagram-finding-techniques',
      'scrabble-mental-math-scoring',
      'scrabble-tile-tracking-methods',
      'scrabble-time-pressure-tips',
      'scrabble-vowel-consonant-balance',
    ];
    for (const slug of skillsSlugs) {
      expect(content, `Missing skills slug: ${slug}`).toContain(`'${slug}'`);
    }
  });

  test('component file contains all new Word Categories slug entries', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    const wordCatSlugs = [
      'scrabble-body-parts-words',
      'scrabble-clothing-words',
      'scrabble-compound-words',
      'scrabble-medical-terms',
      'scrabble-onomatopoeia-words',
      'scrabble-seasonal-summer-words',
      'scrabble-seasonal-winter-words',
      'scrabble-words-from-architecture',
      'scrabble-words-from-cooking',
      'scrabble-words-from-geography',
      'scrabble-words-from-law',
      'scrabble-words-from-music',
      'scrabble-words-from-mythology',
      'scrabble-words-from-science',
      'scrabble-words-from-sports',
      'scrabble-words-from-technology',
      'scrabble-words-from-weather',
      'scrabble-words-with-gh',
      'scrabble-words-with-kn',
      'scrabble-words-with-qu-no-u',
    ];
    for (const slug of wordCatSlugs) {
      expect(content, `Missing word category slug: ${slug}`).toContain(`'${slug}'`);
    }
  });

  test('existing post with BlogCrossLinks renders badges correctly', async ({ page }) => {
    // foreign-words-valid-in-scrabble is in the crossLinks map AND uses the component
    await page.goto(`${BASE}/blog/foreign-words-valid-in-scrabble/`);
    const wordFinder = page.locator('a[title="Word Finder"]');
    const dictionary = page.locator('a[title="Dictionary"]');
    await expect(wordFinder).toBeVisible();
    await expect(dictionary).toBeVisible();
  });
});

test.describe('BlogCrossLinks Extended Entries — Negative', () => {

  test('no slug entry maps to an empty array', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    // Extract all entries that look like: 'slug': []
    const emptyArrayPattern = /'[a-z-]+':\s*\[\s*\]/g;
    const matches = content.match(emptyArrayPattern) || [];
    expect(matches, `Slugs with empty tool arrays: ${matches.join(', ')}`).toHaveLength(0);
  });

  test('all tool names in crossLinks reference valid tools', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    const validTools = ['Word Finder', 'Anagram', 'Dictionary', 'Word of the Day'];
    // Extract the crossLinks object block only (between "crossLinks:" and "};")
    const crossLinksMatch = content.match(/const crossLinks[^=]*=\s*\{([\s\S]*?)\n\};/);
    expect(crossLinksMatch).not.toBeNull();
    const crossLinksBlock = crossLinksMatch![1];
    // Extract tool names from array values (strings inside brackets that aren't slugs)
    const arrayValues = crossLinksBlock.match(/\[([^\]]+)\]/g) || [];
    const invalidTools: string[] = [];
    for (const arr of arrayValues) {
      const names = arr.match(/'([^']+)'/g) || [];
      for (const ref of names) {
        const name = ref.replace(/'/g, '');
        if (!validTools.includes(name)) {
          invalidTools.push(name);
        }
      }
    }
    expect(invalidTools, `Invalid tool names: ${invalidTools.join(', ')}`).toHaveLength(0);
  });

  test('scrabble-anagram-finding-techniques maps to Anagram tool', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    // This slug should reference 'Anagram' — verify it exists on the same line
    const line = content.split('\n').find(l => l.includes('scrabble-anagram-finding-techniques'));
    expect(line).toBeDefined();
    expect(line).toContain('Anagram');
  });

  test('no duplicate slug entries in crossLinks map', () => {
    const content = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    const slugPattern = /^\s+'([a-z][a-z0-9-]+)':/gm;
    const slugs: string[] = [];
    let match;
    while ((match = slugPattern.exec(content)) !== null) {
      slugs.push(match[1]);
    }
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(dupes, `Duplicate slugs: ${dupes.join(', ')}`).toHaveLength(0);
  });
});
