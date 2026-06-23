import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── WOTD Navigation — Positive ───────────────────────────────────────────

test.describe('WOTD Navigation — Positive', () => {
  test('prev button navigates to previous day word', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    // Wait for initial word to load (not placeholder)
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent !== '—';
    }, { timeout: 8000 }).catch(() => {});

    const prevBtn = page.locator('#wotd-prev');
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();
    await page.waitForTimeout(1000);

    // After clicking prev, next button should become enabled
    const nextBtn = page.locator('#wotd-next');
    const isDisabled = await nextBtn.getAttribute('disabled');
    expect(isDisabled).toBeNull(); // not disabled after going back
  });

  test('next button is visible on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-next')).toBeVisible();
  });

  test('prev button is visible on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#wotd-prev')).toBeVisible();
  });

  test('next button becomes enabled after navigating to previous day', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent !== '—';
    }, { timeout: 8000 }).catch(() => {});

    // Initially next should be disabled (we start on today)
    const nextBtn = page.locator('#wotd-next');
    await expect(nextBtn).toBeDisabled();

    // Go back one day
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(1000);

    // Now next should be enabled
    await expect(nextBtn).toBeEnabled();
  });

  test('viewing date shows "Today" when on today', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-viewing-date', { timeout: 8000 });
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-viewing-date');
      return el && el.textContent !== '';
    }, { timeout: 8000 }).catch(() => {});
    const dateText = await page.locator('#wotd-viewing-date').textContent();
    expect(dateText).toBe('Today');
  });

  test('viewing date shows YYYY-MM-DD when navigated to past', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent !== '—';
    }, { timeout: 8000 }).catch(() => {});

    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(1000);

    const dateText = await page.locator('#wotd-viewing-date').textContent();
    expect(dateText).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── WOTD Navigation Restriction — Positive ───────────────────────────────

test.describe('WOTD Navigation Restriction — Positive', () => {
  test('next button is disabled on initial load (today)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-next', { timeout: 8000 });
    // Wait for the script to apply disabled state
    await page.waitForTimeout(2000);
    const nextBtn = page.locator('#wotd-next');
    await expect(nextBtn).toBeDisabled();
  });

  test('next button has visual disabled styling on today', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-next', { timeout: 8000 });
    await page.waitForTimeout(2000);
    const nextBtn = page.locator('#wotd-next');
    const classes = await nextBtn.getAttribute('class') || '';
    expect(classes).toContain('opacity-30');
    expect(classes).toContain('cursor-not-allowed');
  });

  test('navigating back then forward returns to today with next disabled again', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent !== '—';
    }, { timeout: 8000 }).catch(() => {});

    const nextBtn = page.locator('#wotd-next');

    // Go back
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(1000);
    await expect(nextBtn).toBeEnabled();

    // Go forward (back to today)
    await nextBtn.click();
    await page.waitForTimeout(1000);

    // Should be disabled again on today
    await expect(nextBtn).toBeDisabled();
  });
});

// ── WOTD Navigation Restriction — Negative ───────────────────────────────

test.describe('WOTD Navigation Restriction — Negative', () => {
  test('clicking disabled next button does not navigate to future', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent !== '—';
    }, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const wordBefore = await page.locator('#wotd-word').textContent();
    const dateBefore = await page.locator('#wotd-viewing-date').textContent();

    // Force-click the disabled button
    await page.locator('#wotd-next').click({ force: true });
    await page.waitForTimeout(1000);

    const wordAfter = await page.locator('#wotd-word').textContent();
    const dateAfter = await page.locator('#wotd-viewing-date').textContent();

    // Should not change — still on today
    expect(dateAfter).toBe(dateBefore);
    expect(wordAfter).toBe(wordBefore);
  });

  test('no JS errors when clicking disabled next button', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-next', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Force-click despite disabled
    await page.locator('#wotd-next').click({ force: true });
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(critical).toHaveLength(0);
  });

  test('rapid prev/next clicking does not allow navigation past today', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent !== '—';
    }, { timeout: 8000 }).catch(() => {});

    // Go back once
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(500);

    // Rapidly click next multiple times
    await page.locator('#wotd-next').click();
    await page.locator('#wotd-next').click({ force: true });
    await page.locator('#wotd-next').click({ force: true });
    await page.waitForTimeout(1500);

    // Should still show today, not a future date
    const dateText = await page.locator('#wotd-viewing-date').textContent();
    expect(dateText).toBe('Today');
  });

  test('next button does not lose disabled state after API fetch', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    // Wait for the full load cycle
    await page.waitForTimeout(3000);

    const nextBtn = page.locator('#wotd-next');
    await expect(nextBtn).toBeDisabled();
    const classes = await nextBtn.getAttribute('class') || '';
    expect(classes).toContain('opacity-30');
  });
});
