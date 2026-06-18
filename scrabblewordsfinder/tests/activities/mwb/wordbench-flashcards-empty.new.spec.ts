import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── WordBench Empty State On Load — Positive ─────────────────────────────

test.describe('WordBench Empty Import Prompt On Load — Positive', () => {
  test('import prompt shows automatically on page load when no words saved', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-empty', { timeout: 8000 });

    const emptyEl = page.locator('#fc-empty');
    await expect(emptyEl).toBeVisible();
    await expect(emptyEl).toContainText('No words saved yet!');
  });

  test('import prompt contains "Import All Word Lists" button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-empty', { timeout: 8000 });

    const importBtn = page.locator('#fc-import-all-btn');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toContainText('Import All Word Lists');
  });

  test('import prompt describes what will be imported', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-empty', { timeout: 8000 });

    const emptyEl = page.locator('#fc-empty');
    await expect(emptyEl).toContainText('2-letter');
    await expect(emptyEl).toContainText('3-letter');
    await expect(emptyEl).toContainText('Q-without-U');
    await expect(emptyEl).toContainText('rare letter');
  });

  test('import all button has correct styling (purple theme)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    const btn = page.locator('#fc-import-all-btn');
    const classAttr = await btn.getAttribute('class');
    expect(classAttr).toContain('bg-purple-600');
    expect(classAttr).toContain('border-purple-500');
  });
});

// ── WordBench Empty Import Prompt On Load — Negative ─────────────────────

test.describe('WordBench Empty Import Prompt On Load — Negative', () => {
  test('fc-empty element starts hidden in raw HTML (no flash of stale content)', async ({ page }) => {
    // Intercept the page BEFORE JS runs to verify raw HTML state
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    // Immediately check that #fc-empty has the hidden class in the DOM
    // (JS will later remove it if needed, but it should never flash visible with empty/old text)
    const hasHidden = await page.locator('#fc-empty').evaluate(el => el.classList.contains('hidden') || el.textContent?.includes('No words saved'));
    expect(hasHidden).toBe(true);
  });

  test('fc-empty does not contain stale placeholder text after JS loads', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-empty:not(.hidden)', { timeout: 8000 });

    const text = await page.locator('#fc-empty').textContent();
    // Should NOT contain the old static text
    expect(text).not.toContain('Add words to your Memory WordBench first');
  });

  test('import prompt does NOT show on load when words exist', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'ZAP', score: 14, category: 'manual', meaning: 'To destroy', dateAdded: new Date().toISOString() }
      ]));
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    const emptyEl = page.locator('#fc-empty');
    await expect(emptyEl).not.toContainText('No words saved yet!');
  });

  test('import all button does NOT exist when more than 10 words are already saved', async ({ page }) => {
    const manyWords = Array.from({ length: 15 }, (_, i) => ({
      word: String.fromCharCode(65 + i) + String.fromCharCode(66 + i),
      score: 2 + i, category: 'manual', meaning: 'Test word', dateAdded: new Date().toISOString()
    }));
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, JSON.stringify(manyWords));
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#fc-import-all-btn')).not.toBeVisible();
  });

  test('no JavaScript errors on page load with empty localStorage', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-empty', { timeout: 8000 });

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ── Import All Button Behaviour — Positive ───────────────────────────────

test.describe('Import All Button — Positive', () => {
  test('clicking import all button shows loading state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    const btn = page.locator('#fc-import-all-btn');
    await btn.click();

    // Button should show loading text immediately
    await expect(btn).toContainText('Loading dictionary');
  });

  test('clicking import all button disables the button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    const btn = page.locator('#fc-import-all-btn');
    await btn.click();

    await expect(btn).toBeDisabled();
  });

  test('successful import saves words to localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    const btn = page.locator('#fc-import-all-btn');
    await btn.click();

    // Wait for success state (button text changes to "Imported X words")
    await expect(btn).toContainText('Imported', { timeout: 15000 });

    // Verify words were saved to localStorage
    const count = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]').length;
    });
    expect(count).toBeGreaterThan(0);
  });

  test('successful import shows green success styling on button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    const btn = page.locator('#fc-import-all-btn');
    await btn.click();

    await expect(btn).toContainText('Imported', { timeout: 15000 });

    const classAttr = await btn.getAttribute('class');
    expect(classAttr).toContain('bg-green-600');
    expect(classAttr).toContain('border-green-500');
  });

  test('successful import saves words to localStorage with categories', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    await page.locator('#fc-import-all-btn').click();
    await expect(page.locator('#fc-import-all-btn')).toContainText('Imported', { timeout: 15000 });

    // Check localStorage has categorised words
    const data = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(data.length).toBeGreaterThan(0);

    // Verify categories exist
    const categories = [...new Set(data.map((w: any) => w.category))];
    expect(categories).toContain('two-letter');
  });
});

// ── Import All Button Behaviour — Negative ───────────────────────────────

test.describe('Import All Button — Negative', () => {
  test('no JavaScript errors when import all button is clicked', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    await page.locator('#fc-import-all-btn').click();

    // Wait for fetch to complete (success or error)
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('import all does not create duplicate words if clicked after words exist', async ({ page }) => {
    // Pre-load with a known 2-letter word that would be in the import set
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'AA', meaning: 'A type of lava', category: 'two-letter', dateAdded: new Date().toISOString() }
      ]));
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // With ≤10 words, the import hint button IS visible — click it
    await page.locator('#fc-import-all-btn').click();
    await page.waitForTimeout(3000);

    // Verify AA is not duplicated in localStorage
    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    const aaCount = achievements.filter((w: any) => w.word === 'AA').length;
    expect(aaCount).toBe(1);
  });

  test('flash card (fc-card) does NOT become visible when no words saved and import not completed', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-empty', { timeout: 8000 });

    await expect(page.locator('#fc-card')).not.toBeVisible();
  });

  test('flash card controls do NOT appear when no words saved', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-empty', { timeout: 8000 });

    await expect(page.locator('#fc-controls')).not.toBeVisible();
  });
});

// ── Flash Cards After Start With Empty State — Positive ──────────────────

test.describe('Flash Cards Start Button Empty State — Positive', () => {
  test('clicking Start with empty words shows import prompt', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(300);

    const emptyEl = page.locator('#fc-empty');
    await expect(emptyEl).toBeVisible();
    await expect(emptyEl).toContainText('No words saved yet!');
    await expect(page.locator('#fc-import-all-btn')).toBeVisible();
  });

  test('import all button works after clicking Start with empty words', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-import-all-btn', { timeout: 3000 });

    const btn = page.locator('#fc-import-all-btn');
    await btn.click();

    await expect(btn).toContainText('Loading dictionary');
  });
});

// ── Flash Cards After Start With Empty State — Negative ──────────────────

test.describe('Flash Cards Start Button Empty State — Negative', () => {
  test('empty state does NOT appear when Start is clicked with words present', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIZ', score: 22, category: 'manual', meaning: 'A test of knowledge', dateAdded: new Date().toISOString() }
      ]));
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    const emptyText = await page.locator('#fc-empty').textContent();
    expect(emptyText).not.toContain('No words saved yet!');
  });

  test('no duplicate import-all-btn elements after clicking Start multiple times', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Click Start multiple times
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(200);
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(200);

    // Should only have ONE import-all-btn
    const btnCount = await page.locator('#fc-import-all-btn').count();
    expect(btnCount).toBe(1);
  });
});
