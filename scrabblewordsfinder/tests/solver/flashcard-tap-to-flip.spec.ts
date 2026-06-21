import { test, expect } from '@playwright/test';

/**
 * Flashcard Tap-to-Flip UX & Fullscreen Speed Slider Tests
 *
 * Covers:
 * 1. cursor-pointer CSS class on #flashcard-body (initial render)
 * 2. Tap-to-flip interaction (click body to reveal meaning)
 * 3. cursor-pointer on hint text in in-place update path (fullscreen)
 * 4. fcBody.style.cursor = 'pointer' in fullscreen in-place update
 * 5. ensureFullscreenSlider() injection during card render in fullscreen
 */

const SEED_WORDS = JSON.stringify([
  { word: 'QI', score: 11, category: 'q-without-u', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZA', score: 11, category: 'two-letter', meaning: 'Pizza (slang)', dateAdded: '2026-01-02T00:00:00Z' },
  { word: 'XI', score: 9, category: 'two-letter', meaning: 'Greek letter', dateAdded: '2026-01-03T00:00:00Z' },
]);

// ── Flashcard Tap-to-Flip — Positive ────────────────────────────────────────

test.describe('Flashcard Tap-to-Flip — Positive', () => {
  test('flashcard-body has cursor-pointer CSS class on initial render', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    await expect(page.locator('#flashcard-body')).toHaveClass(/cursor-pointer/);
  });

  test('clicking flashcard-body reveals the meaning (tap-to-flip works)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Before tap: should show "Tap to reveal meaning"
    await expect(page.locator('#flashcard-body p.italic')).toContainText('Tap to reveal meaning');

    // Tap the card body
    await page.locator('#flashcard-body').click();
    await page.waitForTimeout(300);

    // After tap: meaning should be shown
    await expect(page.locator('#flashcard-body .fc-meaning-reveal')).toBeVisible();
  });

  test('in-place update sets inline cursor:pointer on flashcard-body in fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const cursor = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      // Mock fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });
      // Navigate to trigger in-place update path
      document.getElementById('fc-next')?.click();
      const fcBody = document.getElementById('flashcard-body') as HTMLElement;
      return fcBody?.style.cursor || '';
    });

    expect(cursor).toBe('pointer');
  });

  test('in-place update adds cursor-pointer class to hint text in fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const hasClass = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });
      // Navigate to next card (in-place update)
      document.getElementById('fc-next')?.click();
      const hint = document.getElementById('flashcard-body')?.querySelector('p.italic.animate-pulse');
      return hint?.classList.contains('cursor-pointer') || false;
    });

    expect(hasClass).toBe(true);
  });
});

// ── Flashcard Tap-to-Flip — Negative ────────────────────────────────────────

test.describe('Flashcard Tap-to-Flip — Negative', () => {
  test('no JavaScript errors when tapping flashcard body to reveal meaning', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Tap to reveal
    await page.locator('#flashcard-body').click();
    await page.waitForTimeout(300);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('second tap on revealed card does not crash or create duplicate meaning', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Tap once to reveal
    await page.locator('#flashcard-body').click();
    await page.waitForTimeout(200);
    // Tap again — should not crash
    await page.locator('#flashcard-body').click();
    await page.waitForTimeout(200);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);

    // Only one meaning div should exist
    const meaningCount = await page.locator('#flashcard-body .fc-meaning-reveal').count();
    expect(meaningCount).toBe(1);
  });
});

// ── Fullscreen Speed Slider Injection — Positive ────────────────────────────

test.describe('Fullscreen Speed Slider Injection — Positive', () => {
  test('ensureFullscreenSlider injects #fs-speed-wrap when autoplay active in fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      // Enable autoplay checkbox (hidden element)
      const autoplay = document.getElementById('mwb-autoplay') as HTMLInputElement;
      if (autoplay) autoplay.checked = true;

      // Mock fullscreen
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Navigate to trigger renderFlashCard which calls ensureFullscreenSlider
      document.getElementById('fc-next')?.click();

      return {
        sliderExists: !!document.getElementById('fs-speed-wrap'),
        hasRangeInput: !!document.getElementById('fs-speed-slider'),
        hasLabel: !!document.getElementById('fs-speed-label'),
      };
    });

    expect(result.sliderExists).toBe(true);
    expect(result.hasRangeInput).toBe(true);
    expect(result.hasLabel).toBe(true);
  });

  test('fullscreen speed slider is NOT injected when autoplay is off', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      // Ensure autoplay is OFF
      const autoplay = document.getElementById('mwb-autoplay') as HTMLInputElement;
      if (autoplay) autoplay.checked = false;

      // Mock fullscreen
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Navigate to trigger renderFlashCard
      document.getElementById('fc-next')?.click();

      return {
        sliderExists: !!document.getElementById('fs-speed-wrap'),
      };
    });

    expect(result.sliderExists).toBe(false);
  });
});

// ── Fullscreen Speed Slider Injection — Negative ────────────────────────────

test.describe('Fullscreen Speed Slider Injection — Negative', () => {
  test('no duplicate #fs-speed-wrap after multiple navigations in fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const count = await page.evaluate(() => {
      // Enable autoplay
      const autoplay = document.getElementById('mwb-autoplay') as HTMLInputElement;
      if (autoplay) autoplay.checked = true;

      // Mock fullscreen
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Navigate multiple times
      document.getElementById('fc-next')?.click();
      document.getElementById('fc-next')?.click();
      document.getElementById('fc-prev')?.click();
      document.getElementById('fc-next')?.click();

      return document.querySelectorAll('#fs-speed-wrap').length;
    });

    expect(count).toBeLessThanOrEqual(1);
  });

  test('no JavaScript errors when ensureFullscreenSlider runs outside fullscreen', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Navigate without fullscreen — ensureFullscreenSlider should exit early safely
    await page.locator('#fc-next').click();
    await page.waitForTimeout(200);
    await page.locator('#fc-next').click();
    await page.waitForTimeout(200);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
