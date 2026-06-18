import { test, expect } from '@playwright/test';

// ── Homepage MWB Sidebar — mwb-updated Event Sync — Positive ──────────────

test.describe('Homepage MWB Sidebar — mwb-updated Event Sync — Positive', () => {
  test('mwb-updated event refreshes saved words sidebar without page reload', async ({ page }) => {
    // Seed with one existing word already saved
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'ALPHA', meaning: 'First letter of the Greek alphabet', category: 'manual', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    // Verify 1 word exists — the count badge shows "1"
    await expect(page.locator('#saved-count')).toContainText('1');

    // Simulate external WOTD save (write to localStorage + dispatch mwb-updated)
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('scbAchievements') || '[]');
      saved.push({ word: 'ZENITH', meaning: 'The highest point in the sky', category: 'wotd', dateAdded: new Date().toISOString() });
      localStorage.setItem('scbAchievements', JSON.stringify(saved));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // Count should update to 2 without reload
    await expect(page.locator('#saved-count')).toContainText('2');
  });

  test('mwb-updated event resets pagination to first word', async ({ page }) => {
    // Seed with 3 words so pagination is meaningful
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'ALPHA', meaning: 'First', category: 'manual', dateAdded: '2026-06-01T00:00:00Z' },
        { word: 'BRAVO', meaning: 'Second', category: 'manual', dateAdded: '2026-06-02T00:00:00Z' },
        { word: 'CHARLIE', meaning: 'Third', category: 'manual', dateAdded: '2026-06-03T00:00:00Z' }
      ]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Navigate forward — click next to move to page 2
    const nextBtn = page.locator('#saved-next-btn');
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }

    // Page indicator should show "2 / 3"
    await expect(page.locator('#saved-words-list')).toContainText('2 / 3');

    // Fire mwb-updated — should reset back to page 1
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // Now should be back at "1 / 3"
    await expect(page.locator('#saved-words-list')).toContainText('1 / 3');
  });

  test('mwb-updated event shows newly added word when sidebar was empty', async ({ page }) => {
    // Start with empty achievements
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    // Should show empty state message
    await expect(page.locator('#saved-words-list')).toContainText('No memory workbench yet');

    // Add a word externally and fire event
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('scbAchievements') || '[]');
      saved.push({ word: 'QUARTZ', meaning: 'A hard crystalline mineral', category: 'wotd', dateAdded: new Date().toISOString() });
      localStorage.setItem('scbAchievements', JSON.stringify(saved));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // Empty message should be gone, word should be visible
    await expect(page.locator('#saved-words-list')).not.toContainText('No memory workbench yet');
    await expect(page.locator('#saved-words-list')).toContainText('QUARTZ');
  });
});

// ── Homepage MWB Sidebar — mwb-updated Event Sync — Negative ──────────────

test.describe('Homepage MWB Sidebar — mwb-updated Event Sync — Negative', () => {
  test('no JS errors when mwb-updated fires with empty localStorage on homepage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    // Dispatch the event with no saved data
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // No critical errors
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);

    // Empty state message still shown
    await expect(page.locator('#saved-words-list')).toContainText('No memory workbench yet');
  });

  test('mwb-updated does not create duplicate word entries in sidebar', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUARTZ', meaning: 'A mineral', category: 'manual', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    // Fire mwb-updated multiple times rapidly
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('mwb-updated'));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // Count should still be 1 — no phantom duplicates
    await expect(page.locator('#saved-count')).toContainText('1');
    // Page indicator should show 1 / 1
    await expect(page.locator('#saved-words-list')).toContainText('1 / 1');
  });

  test('mwb-updated does not crash when fired before saved-words-list is rendered', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Inject event before page fully loads (addInitScript runs before page scripts)
    await page.addInitScript(() => {
      // Fire event very early — before the MWB script attaches the listener
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('mwb-updated'));
      }, 50);
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });
    await page.waitForTimeout(1000);

    // No crash — page still functional
    await expect(page.locator('#saved-words-list')).toBeAttached();
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
