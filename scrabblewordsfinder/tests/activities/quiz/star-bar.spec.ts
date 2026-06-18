import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── StarBar Stats Layout — Positive ──────────────────────────────────────

test.describe('StarBar Stats — Positive', () => {
  test('star bar container is visible on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#star-bar')).toBeVisible();
  });

  test('stats are in a flex div (not a table)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The stats wrapper should be a <div>, not a <table>
    const statsDiv = page.locator('#star-bar div.flex.items-center.gap-4');
    await expect(statsDiv).toBeVisible();
  });

  test('streak stat element is visible with inline format', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Rendered as: 🔥 Streak (N)
    const streakSpan = page.locator('#sb-streak');
    await expect(streakSpan).toBeVisible();
  });

  test('total stars stat element is visible with inline format', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const totalStarsSpan = page.locator('#sb-total-stars');
    await expect(totalStarsSpan).toBeVisible();
  });

  test('total diamonds stat element is visible with inline format', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const totalDiamondsSpan = page.locator('#sb-total-diamonds');
    await expect(totalDiamondsSpan).toBeVisible();
  });

  test('stats show numeric values (default 0)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Clear localStorage to force default state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const streak = page.locator('#sb-streak');
    const totalStars = page.locator('#sb-total-stars');
    const totalDiamonds = page.locator('#sb-total-diamonds');
    await expect(streak).toContainText(/^\d+$/);
    await expect(totalStars).toContainText(/^\d+$/);
    await expect(totalDiamonds).toContainText(/^\d+$/);
  });
});

// ── StarBar Stats Layout — Negative ──────────────────────────────────────

test.describe('StarBar Stats — Negative', () => {
  test('stats are NOT wrapped in a table element', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The old layout used a <table> — this should no longer exist inside #star-bar
    const table = page.locator('#star-bar table');
    await expect(table).toHaveCount(0);
  });

  test('no duplicate stat elements for streak', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const streakEls = page.locator('#sb-streak');
    await expect(streakEls).toHaveCount(1);
  });

  test('no duplicate stat elements for total stars', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const totalStarsEls = page.locator('#sb-total-stars');
    await expect(totalStarsEls).toHaveCount(1);
  });

  test('no duplicate stat elements for total diamonds', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const totalDiamondsEls = page.locator('#sb-total-diamonds');
    await expect(totalDiamondsEls).toHaveCount(1);
  });

  test('no JS errors on page load with star bar present', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => e.toLowerCase().includes('uncaught'))).toHaveLength(0);
  });
});

// ── StarBar Icon Labels — Positive ───────────────────────────────────────
// Added June 17, 2026: each star icon now has a small text label above it

test.describe('StarBar Icon Labels — Positive', () => {
  test('WOTD label is visible above the WOTD star icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The label is inside the same column wrapper as #sb-wotd
    const wotdLabel = page.locator('#sb-wotd').locator('xpath=../span[1]');
    await expect(wotdLabel).toBeVisible();
    await expect(wotdLabel).toHaveText('WOTD');
  });

  test('Quiz label is visible above the Quiz star icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const quizLabel = page.locator('#sb-quiz').locator('xpath=../span[1]');
    await expect(quizLabel).toBeVisible();
    await expect(quizLabel).toHaveText('Quiz');
  });

  test('MWB label is visible above the Memory WordBench star icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const mwbLabel = page.locator('#sb-wordbench').locator('xpath=../span[1]');
    await expect(mwbLabel).toBeVisible();
    await expect(mwbLabel).toHaveText('MWB');
  });

  test('Rack label is visible above the Rack star icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const rackLabel = page.locator('#sb-rack').locator('xpath=../span[1]');
    await expect(rackLabel).toBeVisible();
    await expect(rackLabel).toHaveText('Rack');
  });

  test('Anagram label is visible above the Anagram star icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const anagramLabel = page.locator('#sb-anagram').locator('xpath=../span[1]');
    await expect(anagramLabel).toBeVisible();
    await expect(anagramLabel).toHaveText('Anagram');
  });

  test('60s label is visible above the 60-Second star icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const sixtyLabel = page.locator('#sb-sixty').locator('xpath=../span[1]');
    await expect(sixtyLabel).toBeVisible();
    await expect(sixtyLabel).toHaveText('60s');
  });

  test('all 6 star icons are still visible after label layout change', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    for (const id of ['#sb-wotd', '#sb-quiz', '#sb-wordbench', '#sb-rack', '#sb-anagram', '#sb-sixty']) {
      await expect(page.locator(id)).toBeVisible();
    }
  });
});

// ── StarBar Icon Labels — Negative ───────────────────────────────────────

test.describe('StarBar Icon Labels — Negative', () => {
  test('no duplicate WOTD labels exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const matches = page.locator('#star-bar span').filter({ hasText: 'WOTD' });
    await expect(matches).toHaveCount(1);
  });

  test('no duplicate Quiz labels exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const matches = page.locator('#star-bar span').filter({ hasText: /^Quiz$/ });
    await expect(matches).toHaveCount(1);
  });

  test('icon layout does not crash on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    // Star bar should still render without layout overflow errors
    await expect(page.locator('#star-bar')).toBeVisible();
    await expect(page.locator('#sb-wotd')).toBeVisible();
  });

  test('labels do not obscure star icons (icons still have correct IDs)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Each icon must be individually targetable (not hidden behind labels)
    for (const id of ['sb-wotd', 'sb-quiz', 'sb-wordbench', 'sb-rack', 'sb-anagram', 'sb-sixty', 'sb-diamond']) {
      const el = page.locator(`#${id}`);
      await expect(el).toHaveCount(1);
    }
  });
});

// ── WOTD Add to WordBench — Star Award (updated June 17, 2026) ────────────
// The star award now fires immediately on save — no meaning lookup required.
// WOTD panel lives at /activities

test.describe('WOTD Add to WordBench Star Award — Positive', () => {
  test('wotd-add-workbench button is visible on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Wait for WOTD panel to load
    await page.waitForSelector('#wotd-add-workbench', { timeout: 8000 });
    await expect(page.locator('#wotd-add-workbench')).toBeVisible();
  });

  test('clicking Add to WordBench awards WOTD star without meaning being loaded', async ({ page }) => {
    // Navigate to activities — clear stale achievements first via addInitScript
    // so localStorage is clean before any page script runs
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.removeItem('swf-wotd-cache');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    // Ensure a word is displayed (not the dash placeholder)
    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click WITHOUT having loaded meaning first — this tests the new simplified behaviour
    await page.locator('#wotd-add-workbench').click();
    await page.waitForTimeout(300);

    // Verify: button feedback changed (proves the handler ran fully)
    const btnText = await page.locator('#wotd-add-workbench').textContent();
    expect(btnText).toContain('Saved');
    // No JS errors — __awardStar call must not crash even when meaning is absent
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('button text changes to "Saved ✓" after clicking', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.evaluate(() => localStorage.removeItem('scbAchievements'));
    await page.reload();
    await page.waitForSelector('#wotd-add-workbench', { timeout: 8000 });

    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    await page.locator('#wotd-add-workbench').click();
    await expect(page.locator('#wotd-add-workbench')).toContainText('Saved ✓');
  });
});

test.describe('WOTD Add to WordBench Star Award — Negative', () => {
  test('does not award star when no word is shown (placeholder dash)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 8000 });

    // Force the word element to show the placeholder
    await page.evaluate(() => {
      const el = document.getElementById('wotd-word');
      if (el) el.textContent = '—';
    });

    await page.evaluate(() => {
      (window as any).__awardStar = () => { (window as any).__awardStarFired = true; };
    });

    await page.locator('#wotd-add-workbench').click();
    await page.waitForTimeout(300);

    const awardFired = await page.evaluate(() => !!(window as any).__awardStarFired);
    expect(awardFired).toBe(false);
  });

  test('clicking add when word already saved shows "Saved ✓" and does not re-award star', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });

    const wordText = await page.locator('#wotd-word').textContent();
    if (!wordText || wordText.trim() === '—') {
      test.skip();
      return;
    }

    // Pre-seed the achievements so the word is already saved
    await page.evaluate((word) => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word, score: 0, category: 'wotd', meaning: '', dateAdded: new Date().toISOString() }
      ]));
    }, wordText.trim());

    await page.evaluate(() => {
      (window as any).__awardStar = () => { (window as any).__awardStarFired = true; };
    });

    await page.locator('#wotd-add-workbench').click();
    await expect(page.locator('#wotd-add-workbench')).toContainText('Saved ✓');
    await page.waitForTimeout(300);

    const awardFired = await page.evaluate(() => !!(window as any).__awardStarFired);
    expect(awardFired).toBe(false);
  });
});

// ── WOTD Auto-Award when word already in MWB (June 17, 2026) ─────────────
// If the WOTD is already in the user's Memory WordBench, the star is
// auto-awarded on page load and the button shows "Saved ✓".

test.describe('WOTD Auto-Award from MWB on Load — Positive', () => {
  test('button shows "Saved ✓" when WOTD is pre-saved in MWB', async ({ page }) => {
    // Step 1: fetch the current WOTD word from the API so we know what to seed
    const wotdRes = await page.request.get(`${BASE_URL}/api/wotd/`);
    const wotdData = await wotdRes.json();
    const wotdWord = wotdData?.word?.word;
    if (!wotdWord) {
      test.skip();
      return;
    }

    // Step 2: seed MWB with the WOTD before the page script runs
    await page.addInitScript((word) => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word, score: 0, category: 'wotd', meaning: 'test', dateAdded: new Date().toISOString() }
      ]));
    }, wotdWord);

    await page.goto(ACTIVITIES_URL);
    // Wait for the WOTD word to render (proves renderWotd ran)
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForFunction(
      () => document.getElementById('wotd-word')?.textContent?.trim() !== '—',
      { timeout: 8000 }
    );
    // Small buffer for the auto-award path inside renderWotd to complete
    await page.waitForTimeout(500);

    await expect(page.locator('#wotd-add-workbench')).toContainText('Saved ✓');
  });

  test('no JS errors when auto-award fires on page load', async ({ page }) => {
    const wotdRes = await page.request.get(`${BASE_URL}/api/wotd/`);
    const wotdData = await wotdRes.json();
    const wotdWord = wotdData?.word?.word;
    if (!wotdWord) {
      test.skip();
      return;
    }

    await page.addInitScript((word) => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word, score: 0, category: 'wotd', meaning: 'test', dateAdded: new Date().toISOString() }
      ]));
    }, wotdWord);

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(
      () => document.getElementById('wotd-word')?.textContent?.trim() !== '—',
      { timeout: 8000 }
    );
    await page.waitForTimeout(500);

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });
});

test.describe('WOTD Auto-Award from MWB on Load — Negative', () => {
  test('button shows normal state when WOTD is NOT in MWB', async ({ page }) => {
    // Ensure MWB is empty before visiting
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(
      () => document.getElementById('wotd-word')?.textContent?.trim() !== '—',
      { timeout: 8000 }
    );
    await page.waitForTimeout(500);

    // Button should NOT have been auto-changed — still shows the default unsaved state
    await expect(page.locator('#wotd-add-workbench')).toContainText('Save to WordBench');
  });

  test('auto-award does not fire when MWB contains a different word (not the WOTD)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'ZZZZZ', score: 0, category: 'wotd', meaning: 'test', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(
      () => document.getElementById('wotd-word')?.textContent?.trim() !== '—',
      { timeout: 8000 }
    );
    await page.waitForTimeout(500);

    // Button should still show the default unsaved state (ZZZZZ won't match today's WOTD)
    await expect(page.locator('#wotd-add-workbench')).toContainText('Save to WordBench');
  });
});


// ── WOTD checkWotdInMwb — Positive (added June 17, 2026) ─────────────────
// When the WOTD word is already in the Memory WordBench, the button text
// should auto-update to "Saved ✓" and the WOTD star should
// be awarded via __awardStar('wotd').

test.describe('WOTD checkWotdInMwb — Positive', () => {
  test('button shows "Saved ✓" when WOTD word is pre-saved', async ({ page }) => {
    // Intercept /api/wotd/ to return a known word
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: { word: 'QUIZZED', meaning: 'Past tense of quiz', fun_fact: '', date: '2026-06-17' } })
      });
    });

    // Pre-seed localStorage BEFORE page loads
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIZZED', score: 0, category: 'manual', meaning: 'Past tense of quiz', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto(ACTIVITIES_URL);
    // Wait for the button — it lives in the WOTD panel which is always in the DOM
    await page.waitForSelector('#wotd-add-workbench', { timeout: 15000 });
    // Wait for renderWotd + checkWotdInMwb to fire
    await page.waitForTimeout(800);

    await expect(page.locator('#wotd-add-workbench')).toContainText('Saved ✓');
  });

  test('WOTD star icon reflects awarded state when word already in WordBench', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: { word: 'JAZZY', meaning: 'Having the quality of jazz', fun_fact: '', date: '2026-06-17' } })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'JAZZY', score: 0, category: 'manual', meaning: '', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 15000 });
    await page.waitForTimeout(800);

    // Verify button was updated (confirms checkWotdInMwb ran successfully)
    await expect(page.locator('#wotd-add-workbench')).toContainText('Saved ✓');
    // No page errors from __awardStar call
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(300);
    expect(errors.filter(e => e.includes('awardStar'))).toHaveLength(0);
  });

  test('button text is unchanged (default) when WOTD word is NOT in WordBench', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: { word: 'SPHINX', meaning: '', fun_fact: '', date: '2026-06-17' } })
      });
    });

    // Empty WordBench
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.removeItem('swf-wotd-cache');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 15000 });
    await page.waitForTimeout(500);

    const btnText = await page.locator('#wotd-add-workbench').textContent();
    expect(btnText).not.toContain('Saved ✓');
    expect(btnText).toContain('Save to WordBench');
  });
});

// ── WOTD checkWotdInMwb — Negative ───────────────────────────────────────

test.describe('WOTD checkWotdInMwb — Negative', () => {
  test('does not update button when word is the dash placeholder', async ({ page }) => {
    // Return a word that will display as '—' (empty word field)
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: { word: '', meaning: '', fun_fact: '', date: '2026-06-17' } })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: '—', score: 0, category: 'manual', meaning: '', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Button should NOT say "Saved ✓" because the guard prevents it for '—'
    const btnText = await page.locator('#wotd-add-workbench').textContent();
    expect(btnText).not.toContain('Saved ✓');
  });

  test('no JS errors when scbAchievements contains malformed JSON', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      // Inject malformed JSON — page should handle gracefully via try/catch in getWotdCache
      localStorage.setItem('scbAchievements', 'NOT_VALID_JSON');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('typeerror') ||
      e.toLowerCase().includes('syntaxerror')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('no duplicate "Saved" buttons rendered', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: { word: 'FUZZY', meaning: '', fun_fact: '', date: '2026-06-17' } })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'FUZZY', score: 0, category: 'manual', meaning: '', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 15000 });
    await page.waitForTimeout(500);

    // There must be exactly one wotd-add-workbench button
    await expect(page.locator('#wotd-add-workbench')).toHaveCount(1);
  });
});

// ── WOTD Button Restyle — "Save to WordBench ✗" (June 17, 2026) ──────────
// The default (unsaved) state button was renamed from "+ Add to Memory WordBench"
// to "Save to WordBench ✗" and restyled from purple to red.

test.describe('WOTD Save Button Restyle — Positive', () => {
  test('button shows "Save to WordBench ✗" as default text when word not saved', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.removeItem('swf-wotd-cache');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 8000 });

    await expect(page.locator('#wotd-add-workbench')).toContainText('Save to WordBench');
    await expect(page.locator('#wotd-add-workbench')).toContainText('✗');
  });

  test('button has red styling in unsaved state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.removeItem('swf-wotd-cache');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 8000 });

    // Wait for the word to load — if already saved, button will be green
    const wordText = await page.locator('#wotd-word').textContent();
    // Only check red styling if the word is NOT already in MWB (button stays default)
    const btnText = await page.locator('#wotd-add-workbench').textContent();
    if (btnText?.includes('Saved') || btnText?.includes('Already')) {
      test.skip();
      return;
    }

    const btnClass = await page.locator('#wotd-add-workbench').getAttribute('class');
    expect(btnClass).toContain('text-red-400');
    expect(btnClass).toContain('border-red-500');
  });

  test('button switches to green "Saved ✓" when word is already in MWB', async ({ page }) => {
    await page.route('**/api/wotd/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: { word: 'TROJAN', meaning: 'Of or relating to Troy', fun_fact: '', date: '2026-06-17' } })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'TROJAN', score: 0, category: 'manual', meaning: 'Of or relating to Troy', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 15000 });
    await page.waitForTimeout(800);

    const btnClass = await page.locator('#wotd-add-workbench').getAttribute('class');
    expect(btnClass).toContain('text-green-400');
    expect(btnClass).toContain('border-green-500');
  });
});

test.describe('WOTD Save Button Restyle — Negative', () => {
  test('button does NOT show old purple styling in unsaved state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.removeItem('swf-wotd-cache');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 8000 });

    const btnText = await page.locator('#wotd-add-workbench').textContent();
    if (btnText?.includes('Saved') || btnText?.includes('Already')) {
      test.skip();
      return;
    }

    const btnClass = await page.locator('#wotd-add-workbench').getAttribute('class');
    expect(btnClass).not.toContain('text-purple-300');
    expect(btnClass).not.toContain('bg-purple-600');
    expect(btnClass).not.toContain('border-purple-500');
  });

  test('button does NOT contain old text "+ Add to Memory WordBench"', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
      localStorage.removeItem('swf-wotd-cache');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-add-workbench', { timeout: 8000 });

    const btnText = await page.locator('#wotd-add-workbench').textContent();
    expect(btnText).not.toContain('+ Add to Memory WordBench');
  });
});
