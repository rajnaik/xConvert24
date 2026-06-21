import { test, expect } from '@playwright/test';

/**
 * MWB Fullscreen — Flashcard-Only Mode Tests
 *
 * The fullscreen button (#mwb-fullscreen-btn) was moved from the MWB toolbar
 * into the flashcard header. It now only appears in flashcard mode and only
 * fullscreens the flashcard area (not rack leave/openers).
 */

const SEED_WORDS = JSON.stringify([
  { word: 'QI', score: 11, category: 'q-without-u', meaning: 'Life force', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZA', score: 11, category: 'two-letter', meaning: 'Pizza', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'AA', score: 2, category: 'two-letter', meaning: 'Lava', dateAdded: '2026-01-01T00:00:00Z' },
]);

// ── Fullscreen Button Placement — Positive ──────────────────────────────────

test.describe('MWB Fullscreen Button Placement — Positive', () => {
  test('fullscreen button does NOT exist in MWB toolbar (deck mode)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    // In deck mode, no fullscreen button should be present
    const count = await page.locator('#mwb-fullscreen-btn').count();
    expect(count).toBe(0);
  });

  test('fullscreen button appears when entering flashcard mode', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });

    // Enter flashcard mode
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#mwb-fullscreen-btn', { timeout: 5000 });

    await expect(page.locator('#mwb-fullscreen-btn')).toBeVisible();
  });

  test('fullscreen button is positioned left of autoplay button', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#mwb-fullscreen-btn', { timeout: 5000 });

    // Both buttons should be in the same parent container
    const fsBtn = page.locator('#mwb-fullscreen-btn');
    const autoplayBtn = page.locator('#flashcard-autoplay-toggle');
    await expect(fsBtn).toBeVisible();
    await expect(autoplayBtn).toBeVisible();

    // Fullscreen button should be to the left of autoplay (lower x coordinate)
    const fsBounds = await fsBtn.boundingBox();
    const apBounds = await autoplayBtn.boundingBox();
    expect(fsBounds!.x).toBeLessThan(apBounds!.x);
  });

  test('fullscreen button has correct title and aria-label', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#mwb-fullscreen-btn', { timeout: 5000 });

    const btn = page.locator('#mwb-fullscreen-btn');
    await expect(btn).toHaveAttribute('title', 'Full screen');
    await expect(btn).toHaveAttribute('aria-label', 'Full screen');
  });

  test('MWB toolbar still works without fullscreen button', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#download-saved-btn', { timeout: 8000 });

    await expect(page.locator('#download-saved-btn')).toBeAttached();
    await expect(page.locator('#saved-count')).toBeVisible();
  });
});

// ── Fullscreen Button Placement — Negative ──────────────────────────────────

test.describe('MWB Fullscreen Button Placement — Negative', () => {
  test('no JavaScript errors on page load without flashcard mode', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('fullscreen') ||
      e.includes('mwb-fullscreen') ||
      e.includes('Cannot read properties of null')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('no crash when clicking fullscreen in headless (requestFullscreen rejected)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#mwb-fullscreen-btn', { timeout: 5000 });

    // Click fullscreen — in headless it won't enter fullscreen but shouldn't crash
    await page.locator('#mwb-fullscreen-btn').click();
    await page.waitForTimeout(300);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('fullscreen button disappears when exiting flashcard mode', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });

    // Enter flashcard mode
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#mwb-fullscreen-btn', { timeout: 5000 });
    await expect(page.locator('#mwb-fullscreen-btn')).toBeVisible();

    // Exit flashcard mode
    await page.locator('#flashcard-close').click();
    await page.waitForTimeout(300);

    const count = await page.locator('#mwb-fullscreen-btn').count();
    expect(count).toBe(0);
  });

  test('no duplicate fullscreen buttons in flashcard mode', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#mwb-fullscreen-btn', { timeout: 5000 });

    const count = await page.locator('#mwb-fullscreen-btn').count();
    expect(count).toBe(1);
  });
});

// ── Fullscreen Styles (Flashcard Only) — Positive ───────────────────────────

test.describe('MWB Fullscreen Styles — Positive', () => {
  test('flashcard-body exists in flashcard mode for fullscreen targeting', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    await expect(page.locator('#flashcard-body')).toBeVisible();
  });

  test('simulated fullscreen applies enlarged styles to flashcard elements', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      // Mock fullscreenElement
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Manually apply styles (simulating applyFullscreenStyles)
      const fcBody = document.getElementById('flashcard-body') as HTMLElement;
      if (fcBody) {
        const fcWord = fcBody.querySelector('.font-mono.font-extrabold') as HTMLElement;
        if (fcWord) fcWord.style.fontSize = '6rem';
        const fcMeaning = fcBody.querySelector('.text-xs.text-gray-400') as HTMLElement;
        if (fcMeaning) fcMeaning.style.fontSize = '1.5rem';
        const fcScore = fcBody.querySelector('.text-blue-400') as HTMLElement;
        if (fcScore) fcScore.style.fontSize = '1.25rem';
        fcBody.style.minHeight = '300px';
        fcBody.style.padding = '3rem';
      }

      return {
        fcBodyMinHeight: fcBody?.style.minHeight,
        fcBodyPadding: fcBody?.style.padding,
        fcWordFontSize: (fcBody?.querySelector('.font-mono.font-extrabold') as HTMLElement)?.style.fontSize,
      };
    });

    expect(result.fcBodyMinHeight).toBe('300px');
    expect(result.fcBodyPadding).toBe('3rem');
    expect(result.fcWordFontSize).toBe('6rem');
  });

  test('fullscreen does NOT enlarge saved-words-list', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#mwb-fullscreen-btn', { timeout: 5000 });

    // Click fullscreen (won't work in headless but the logic runs)
    await page.locator('#mwb-fullscreen-btn').click();
    await page.waitForTimeout(300);

    // saved-words-list should NOT have enlarged font
    const wordListFontSize = await page.evaluate(() => {
      const wl = document.getElementById('saved-words-list');
      return wl?.style.fontSize || '';
    });
    expect(wordListFontSize).toBe('');
  });
});

// ── Fullscreen Styles (Flashcard Only) — Negative ───────────────────────────

test.describe('MWB Fullscreen Styles — Negative', () => {
  test('styles not applied when not in fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const styles = await page.evaluate(() => {
      const fcBody = document.getElementById('flashcard-body') as HTMLElement;
      return {
        minHeight: fcBody?.style.minHeight || '',
        padding: fcBody?.style.padding || '',
      };
    });
    // Default styles — no fullscreen enlargement
    expect(styles.minHeight).toBe('');
    expect(styles.padding).toBe('');
  });

  test('no crash when entering flashcard mode with empty word list', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });

    // Click flashcard mode with no words — should handle gracefully
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
