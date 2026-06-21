import { test, expect } from '@playwright/test';
test('debug mwb local', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  await page.addInitScript(() => {
    localStorage.removeItem('scbAchievements');
    localStorage.removeItem('swf-uid');
  });
  await page.goto('/');
  await page.waitForTimeout(5000);

  // Check if the main solver script ran (dictionary loading, etc.)
  const dictLoaded = await page.evaluate(() => {
    return !!(document.getElementById('two-letter-words')?.textContent?.includes(','));
  });
  console.log('DICTIONARY LOADED:', dictLoaded);
  
  // Check if saved-count was updated (sign that renderSavedWords ran)
  const savedCount = await page.locator('#saved-count').textContent();
  console.log('SAVED COUNT TEXT:', savedCount);

  const html = await page.locator('#saved-words-list').innerHTML();
  console.log('MWB HTML:', html.slice(0, 600));
  console.log('PAGE ERRORS:', JSON.stringify(errors.slice(0, 5)));
  console.log('CONSOLE ERRORS:', JSON.stringify(consoleLogs.filter(l => l.includes('[error]')).slice(0, 5)));

  const btnCount = await page.locator('#mwb-import-all-btn').count();
  console.log('IMPORT BTN COUNT:', btnCount);
  expect(btnCount).toBeGreaterThan(0);
});
