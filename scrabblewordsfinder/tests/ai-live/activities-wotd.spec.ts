import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Activities WOTD (Word of the Day)
 * 
 * Tests:
 * 1. Go to /activities/
 * 2. Click "Explore WOTD" button (if visible)
 * 3. Verify enriched sections appear: Fun fact, Origin, Spelling tip, Did you know?, In other languages
 * 4. Check "Save to WordBench" or "Saved" button exists
 * 5. Click "Lookup" button
 * 6. Click "Memorised" checkbox
 */

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('AI Live — Activities WOTD', () => {
  test.setTimeout(60000);

  test('WOTD explore shows all enriched sections', async ({ page }) => {
    // Step 1: Go to activities page
    await page.goto(`${BASE}/activities/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000); // Let WOTD panel load from API

    // Step 2: Click "Explore WOTD" button if visible
    const exploreBtn = page.locator('#wotd-explore-btn');
    if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreBtn.click();
      await page.waitForTimeout(5000); // Let enriched content + languages load
    }

    // Step 3: Verify enriched panel is visible
    const enrichedPanel = page.locator('#wotd-enriched');
    await expect(enrichedPanel).toBeVisible({ timeout: 15000 });

    // Wait for fields to be populated (display changes from none to visible via JS)
    await page.waitForTimeout(2000);

    // Fun fact — check it's attached and has content (may be display:none if empty)
    const funFact = page.locator('#wotd-fact');
    await expect(funFact).toBeAttached();
    const funFactVisible = await funFact.isVisible();
    if (funFactVisible) {
      const funFactText = await funFact.textContent();
      expect(funFactText!.length).toBeGreaterThan(10);
    }

    // Origin
    const origin = page.locator('#wotd-origin');
    await expect(origin).toBeAttached();

    // Spelling tip
    const spelling = page.locator('#wotd-spelling');
    await expect(spelling).toBeAttached();

    // Did you know? (cultural note)
    const cultural = page.locator('#wotd-cultural');
    await expect(cultural).toBeAttached();

    // In other languages — this section loads async
    const languages = page.locator('#wotd-languages');
    await expect(languages).toBeVisible({ timeout: 15000 });
    const langText = await languages.textContent();
    expect(langText).toContain('languages');

    // Step 4: Check "Save to WordBench" or "Saved" button exists
    const saveBtn = page.locator('#wotd-add-workbench');
    await expect(saveBtn).toBeVisible();
    const saveBtnText = await saveBtn.textContent();
    expect(saveBtnText).toMatch(/Save|Saved|WordBench/i);

    // Step 5: Click "Lookup" button
    const lookupBtn = page.locator('#wotd-fetch-meaning');
    await expect(lookupBtn).toBeVisible();
    await lookupBtn.click();
    await page.waitForTimeout(2000);

    // Step 6: Click "Memorised" checkbox
    const memorisedCheckbox = page.locator('#wotd-memorised-checkbox');
    await expect(memorisedCheckbox).toBeVisible();
    await memorisedCheckbox.check();

    // Verify checkbox is checked
    await expect(memorisedCheckbox).toBeChecked();
  });
});
