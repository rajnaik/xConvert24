import { test, expect } from '@playwright/test';

/**
 * Settings Page Tests
 * Tests UID management, backup/restore, relink modal,
 * and localStorage nuke functionality.
 */

test.describe('Settings Page — Structure', () => {
  test('settings page loads correctly', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveTitle(/Settings/);
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('shows no-signup explanation', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=No Sign-Up Required')).toBeAttached();
    await expect(page.locator('text=localStorage')).toBeAttached();
  });

  test('has all main sections', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=Your User ID')).toBeAttached();
    await expect(page.locator('text=Backup & Restore')).toBeAttached();
    await expect(page.locator('text=Danger Zone')).toBeAttached();
  });
});

test.describe('Settings Page — User ID', () => {
  test('displays a user ID on load', async ({ page }) => {
    await page.goto('/settings');
    const uidDisplay = page.locator('#uid-display');
    const text = await uidDisplay.textContent();
    expect(text).toBeTruthy();
    expect(text?.length).toBeGreaterThan(8);
  });

  test('creates UID if none exists', async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBeTruthy();
    expect(uid!.length).toBeGreaterThan(8);
  });

  test('download UID button triggers file download', async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-abc123'));
    await page.reload();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#download-uid-btn').click(),
    ]);

    expect(download.suggestedFilename()).toBe('swf-uid.txt');
    const path = await download.path();
    const fs = await import('fs');
    const content = fs.readFileSync(path!, 'utf-8');
    expect(content).toContain('test-uid-abc123');
  });
});

test.describe('Settings Page — Relink Modal', () => {
  test('relink button opens modal', async ({ page }) => {
    await page.goto('/settings');
    const modal = page.locator('#relink-modal');
    await expect(modal).toHaveClass(/hidden/);
    await page.locator('#relink-uid-btn').click();
    await expect(modal).not.toHaveClass(/hidden/);
  });

  test('cancel button closes modal', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('#relink-uid-btn').click();
    await expect(page.locator('#relink-modal')).not.toHaveClass(/hidden/);
    await page.locator('#relink-cancel').click();
    await expect(page.locator('#relink-modal')).toHaveClass(/hidden/);
  });

  test('clicking backdrop closes modal', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('#relink-uid-btn').click();
    await expect(page.locator('#relink-modal')).not.toHaveClass(/hidden/);
    // Click on the backdrop (the modal container itself)
    await page.locator('#relink-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#relink-modal')).toHaveClass(/hidden/);
  });

  test('manual UID input accepts text', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('#relink-uid-btn').click();
    await page.locator('#relink-input').fill('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    await expect(page.locator('#relink-input')).toHaveValue('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  test('relink with valid UID updates localStorage', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('#relink-uid-btn').click();
    const newUid = 'relinked-uid-12345678';
    await page.locator('#relink-input').fill(newUid);

    page.on('dialog', dialog => dialog.accept());
    await page.locator('#relink-confirm').click();

    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBe(newUid);
  });

  test('relink with too-short UID shows alert', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('#relink-uid-btn').click();
    await page.locator('#relink-input').fill('abc');

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    await page.locator('#relink-confirm').click();
    expect(alertMessage).toContain('too short');
  });
});

test.describe('Settings Page — Backup & Restore', () => {
  test('backup button downloads JSON file', async ({ page }) => {
    await page.goto('/settings');
    // Set some data to back up
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'backup-test-uid');
      localStorage.setItem('scbAchievements', JSON.stringify([{ word: 'test', meaning: '' }]));
    });
    await page.reload();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#backup-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/swf-backup.*\.json$/);
    const path = await download.path();
    const fs = await import('fs');
    const content = JSON.parse(fs.readFileSync(path!, 'utf-8'));
    expect(content.version).toBe(1);
    expect(content.app).toBe('ScrabbleWordsFinder');
    expect(content.data['swf-uid']).toBe('backup-test-uid');
  });

  test('restore button opens file picker', async ({ page }) => {
    await page.goto('/settings');
    const fileInput = page.locator('#restore-file-input');
    await expect(fileInput).toHaveAttribute('type', 'file');
    await expect(fileInput).toHaveAttribute('accept', '.json');
  });
});

test.describe('Settings Page — Nuke localStorage', () => {
  test('nuke button requires confirmation', async ({ page }) => {
    await page.goto('/settings');
    let confirmCalled = false;
    page.on('dialog', async dialog => {
      confirmCalled = true;
      await dialog.dismiss(); // Cancel the nuke
    });
    await page.locator('#nuke-btn').click();
    expect(confirmCalled).toBeTruthy();
  });

  test('confirming nuke clears all localStorage', async ({ page }) => {
    await page.goto('/settings');
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'doomed-uid');
      localStorage.setItem('scbAchievements', '[]');
      localStorage.setItem('scbTileProb', '{}');
    });

    // Accept both confirm and alert dialogs
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#nuke-btn').click();
    await page.waitForTimeout(300);

    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBeNull();
    const achievements = await page.evaluate(() => localStorage.getItem('scbAchievements'));
    expect(achievements).toBeNull();
  });

  test('UID display shows "cleared" after nuke', async ({ page }) => {
    await page.goto('/settings');
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#nuke-btn').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#uid-display')).toContainText('cleared');
  });
});
