import { test, expect } from '@playwright/test';

/**
 * MWB Fullscreen Navigation — In-Place Card Update Tests
 *
 * When in fullscreen mode, navigating between flash cards (prev/next)
 * updates the card content in-place instead of replacing innerHTML.
 * This prevents the fullscreen element from being destroyed.
 */

const SEED_WORDS = JSON.stringify([
  { word: 'QI', score: 11, category: 'q-without-u', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZA', score: 11, category: 'two-letter', meaning: 'Pizza (slang)', dateAdded: '2026-01-02T00:00:00Z' },
  { word: 'XI', score: 9, category: 'two-letter', meaning: 'Greek letter', dateAdded: '2026-01-03T00:00:00Z' },
  { word: 'JO', score: 9, category: 'two-letter', meaning: 'Scottish term for sweetheart', dateAdded: '2026-01-04T00:00:00Z' },
]);

// ── Fullscreen In-Place Navigation — Positive ─────────────────────────────

test.describe('MWB Fullscreen In-Place Navigation — Positive', () => {
  test('flashcard-body element exists after entering flashcard mode', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    await expect(page.locator('#flashcard-body')).toBeVisible();
  });

  test('fc-prev and fc-next buttons exist in flashcard mode', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#fc-prev', { timeout: 5000 });

    await expect(page.locator('#fc-prev')).toBeAttached();
    await expect(page.locator('#fc-next')).toBeAttached();
  });

  test('fc-prev is disabled on first card (opacity-30)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#fc-prev', { timeout: 5000 });

    await expect(page.locator('#fc-prev')).toHaveClass(/opacity-30/);
    await expect(page.locator('#fc-prev')).toHaveClass(/pointer-events-none/);
  });

  test('fc-next is enabled when multiple cards exist', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#fc-next', { timeout: 5000 });

    await expect(page.locator('#fc-next')).not.toHaveClass(/opacity-30/);
  });

  test('clicking fc-next advances to next card (word changes)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Get initial word
    const initialWord = await page.locator('#flashcard-body .font-mono.font-extrabold').textContent();

    // Navigate to next
    await page.locator('#fc-next').click();
    await page.waitForTimeout(300);

    // Word should have changed
    const nextWord = await page.locator('#flashcard-body .font-mono.font-extrabold').textContent();
    expect(nextWord).not.toBe(initialWord);
  });

  test('clicking fc-prev returns to previous card after navigating forward', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Get first word
    const firstWord = await page.locator('#flashcard-body .font-mono.font-extrabold').textContent();

    // Navigate forward then back
    await page.locator('#fc-next').click();
    await page.waitForTimeout(200);
    await page.locator('#fc-prev').click();
    await page.waitForTimeout(200);

    const currentWord = await page.locator('#flashcard-body .font-mono.font-extrabold').textContent();
    expect(currentWord).toBe(firstWord);
  });

  test('counter updates correctly when navigating cards', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Counter should start at "Flash Card 1 / N" — scoped to saved-words-list
    const counter = page.locator('#saved-words-list .text-purple-400');
    await expect(counter).toContainText('Flash Card 1 /');

    // Navigate to next
    await page.locator('#fc-next').click();
    await page.waitForTimeout(200);
    await expect(counter).toContainText('Flash Card 2 /');
  });

  test('fullscreen in-place update preserves flashcard-body element when mocked', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Mock fullscreen and navigate
    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      // Mock fullscreenElement to simulate fullscreen mode
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Click next button to trigger in-place update path
      const nextBtn = document.getElementById('fc-next');
      nextBtn?.click();

      // After navigation, flashcard-body should still exist (not destroyed)
      return {
        bodyExists: !!document.getElementById('flashcard-body'),
        prevExists: !!document.getElementById('fc-prev'),
        nextExists: !!document.getElementById('fc-next'),
      };
    });

    expect(result.bodyExists).toBe(true);
    expect(result.prevExists).toBe(true);
    expect(result.nextExists).toBe(true);
  });

  test('fullscreen in-place update changes card word without full re-render', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      // Capture flashcard-body reference before navigation
      const bodyBefore = document.getElementById('flashcard-body');

      // Mock fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Get word before
      const wordBefore = bodyBefore?.querySelector('.font-mono.font-extrabold')?.textContent;

      // Navigate
      document.getElementById('fc-next')?.click();

      // Get word after — should be different
      const bodyAfter = document.getElementById('flashcard-body');
      const wordAfter = bodyAfter?.querySelector('.font-mono.font-extrabold')?.textContent;

      return {
        sameElement: bodyBefore === bodyAfter, // Should be same DOM node (in-place update)
        wordChanged: wordBefore !== wordAfter,
        wordBefore,
        wordAfter,
      };
    });

    expect(result.sameElement).toBe(true);
    expect(result.wordChanged).toBe(true);
  });

  test('fullscreen in-place update applies enlarged styles after navigation', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Navigate to trigger in-place update + applyFullscreenStyles
      document.getElementById('fc-next')?.click();

      const fcBody = document.getElementById('flashcard-body') as HTMLElement;
      const wordEl = fcBody?.querySelector('.font-mono.font-extrabold') as HTMLElement;
      return {
        bodyMinHeight: fcBody?.style.minHeight,
        bodyPadding: fcBody?.style.padding,
        wordFontSize: wordEl?.style.fontSize,
      };
    });

    expect(result.bodyMinHeight).toBe('300px');
    expect(result.bodyPadding).toBe('3rem');
    expect(result.wordFontSize).toBe('6rem');
  });
});

// ── Fullscreen In-Place Navigation — Negative ──────────────────────────────

test.describe('MWB Fullscreen In-Place Navigation — Negative', () => {
  test('no JavaScript errors when navigating cards in simulated fullscreen', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    // Simulate fullscreen and rapid navigation
    await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });
      // Rapid next clicks
      for (let i = 0; i < 5; i++) {
        document.getElementById('fc-next')?.click();
      }
    });
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('fc-next is disabled on the last card during fullscreen navigation', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });
      // Navigate to the last card (we have 4 cards, start at 0 → click next 3 times)
      document.getElementById('fc-next')?.click();
      document.getElementById('fc-next')?.click();
      document.getElementById('fc-next')?.click();

      const nextBtn = document.getElementById('fc-next');
      return {
        hasOpacity: nextBtn?.classList.contains('opacity-30'),
        hasPointerNone: nextBtn?.classList.contains('pointer-events-none'),
      };
    });

    expect(result.hasOpacity).toBe(true);
    expect(result.hasPointerNone).toBe(true);
  });

  test('fc-prev becomes enabled after navigating forward in fullscreen', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });
      // Navigate forward
      document.getElementById('fc-next')?.click();

      const prevBtn = document.getElementById('fc-prev');
      return {
        hasOpacity: prevBtn?.classList.contains('opacity-30'),
        hasPointerNone: prevBtn?.classList.contains('pointer-events-none'),
      };
    });

    expect(result.hasOpacity).toBe(false);
    expect(result.hasPointerNone).toBe(false);
  });

  test('reveal meaning works in fullscreen in-place update', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // Click flashcard-body to reveal meaning
      const fcBody = document.getElementById('flashcard-body');
      fcBody?.click();

      // Check if "Tap to reveal" is gone and meaning is shown
      const hasRevealHint = fcBody?.innerHTML.includes('Tap to reveal meaning');
      const hasMeaningDiv = fcBody?.innerHTML.includes('fc-meaning-reveal');

      return { hasRevealHint, hasMeaningDiv };
    });

    expect(result.hasRevealHint).toBe(false);
    expect(result.hasMeaningDiv).toBe(true);
  });

  test('no duplicate flashcard-body elements after rapid fullscreen navigation', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });
      // Rapid navigation back and forth
      document.getElementById('fc-next')?.click();
      document.getElementById('fc-next')?.click();
      document.getElementById('fc-prev')?.click();
      document.getElementById('fc-next')?.click();
    });

    await page.waitForTimeout(300);
    const bodyCount = await page.locator('#flashcard-body').count();
    expect(bodyCount).toBe(1);
  });

  test('category label updates correctly during fullscreen navigation', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto('/');
    await page.waitForSelector('#flashcard-mode-btn', { timeout: 8000 });
    await page.locator('#flashcard-mode-btn').click();
    await page.waitForSelector('#flashcard-body', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const fcArea = document.getElementById('flashcard-body')?.closest('.relative') as HTMLElement;
      Object.defineProperty(document, 'fullscreenElement', {
        get: () => fcArea,
        configurable: true,
      });

      // First card is 'q-without-u'
      const listEl = document.getElementById('saved-words-list');
      const catLabelBefore = listEl?.querySelector('.text-xs.text-gray-500:not(.italic):not(.animate-pulse)')?.textContent;

      // Navigate to next card which is 'two-letter'
      document.getElementById('fc-next')?.click();
      const catLabelAfter = listEl?.querySelector('.text-xs.text-gray-500:not(.italic):not(.animate-pulse)')?.textContent;

      return { catLabelBefore, catLabelAfter };
    });

    expect(result.catLabelBefore).toBe('q-without-u');
    expect(result.catLabelAfter).toBe('two-letter');
  });
});
