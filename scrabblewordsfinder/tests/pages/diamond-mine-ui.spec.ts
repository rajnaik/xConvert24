import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const TEST_UID = 'test-diamond-ui-playwright';

// All diamond mine pages from the database
const mines = [
  { id: 1, page: '/activities/', perClaim: 1 },
  { id: 2, page: '/mybag/', perClaim: 1 },
  { id: 3, page: '/blog/roadmap-to-being-a-pro-player/', perClaim: 1 },
  { id: 4, page: '/quiz-history/', perClaim: 1 },
  { id: 5, page: '/guide/', perClaim: 1 },
  { id: 6, page: '/', perClaim: 3 },
  { id: 7, page: '/blog/', perClaim: 3 },
  { id: 8, page: '/faq/', perClaim: 1 },
  { id: 9, page: '/achievements/', perClaim: 1 },
  { id: 10, page: '/sixty-seconds/', perClaim: 100 },
  { id: 11, page: '/stats/', perClaim: 3 },
  { id: 12, page: '/wordbench-practice/', perClaim: 3 },
  { id: 13, page: '/blog/beginner-scrabble-strategy/', perClaim: 3 },
  { id: 14, page: '/blog/best-two-letter-words-scrabble/', perClaim: 3 },
  { id: 15, page: '/blog/how-to-play-scrabble/', perClaim: 1 },
  { id: 16, page: '/blog/highest-scoring-scrabble-words/', perClaim: 3 },
  { id: 17, page: '/blog/scrabble-rules-explained/', perClaim: 10 },
  { id: 18, page: '/blog/best-q-words-scrabble/', perClaim: 5 },
  { id: 19, page: '/blog/words-starting-with-a/', perClaim: 1 },
];

test.describe('Diamond Mine UI — Visibility', () => {
  for (const mine of mines) {
    test(`ID:${mine.id} diamond mine renders on ${mine.page} (gem or mined)`, async ({ page }) => {
      // Set the UID in localStorage before navigating
      await page.goto(`${BASE}${mine.page}`);
      await page.evaluate((uid) => {
        localStorage.setItem('swf-uid', uid);
      }, TEST_UID);

      // Reload with UID set
      await page.reload();

      // Wait for EITHER the unclaimed gem button OR the "Mined ✓" indicator (up to 5s for fetch)
      const gem = page.locator('.diamond-mine-gem');
      const mined = page.locator('.diamond-mine-mined');

      // One of the two states must be visible
      await expect(gem.or(mined)).toBeVisible({ timeout: 5000 });

      // Verify accessibility attributes based on which state rendered
      const gemCount = await gem.count();
      if (gemCount > 0) {
        // Unclaimed state — gem button with aria-label
        const label = await gem.getAttribute('aria-label');
        expect(label).toContain('diamond');
      } else {
        // Claimed state — mined indicator with aria-label
        const label = await mined.getAttribute('aria-label');
        expect(label).toContain('mined');
        await expect(mined.locator('.dm-mined-label')).toContainText('Mined');
      }
    });
  }
});

test.describe('Diamond Mine UI — Negative', () => {
  for (const mine of mines) {
    test(`ID:${mine.id} no duplicate diamond elements on ${mine.page}`, async ({ page }) => {
      await page.goto(`${BASE}${mine.page}`);
      await page.evaluate((uid) => {
        localStorage.setItem('swf-uid', uid);
      }, TEST_UID);
      await page.reload();

      // Wait for the diamond mine to render
      const gem = page.locator('.diamond-mine-gem');
      const mined = page.locator('.diamond-mine-mined');
      await expect(gem.or(mined)).toBeVisible({ timeout: 5000 });

      // There should be at most 1 gem and at most 1 mined indicator — never both, never duplicates
      const gemCount = await gem.count();
      const minedCount = await mined.count();
      expect(gemCount + minedCount).toBe(1);
    });
  }
});
