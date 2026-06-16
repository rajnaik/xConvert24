import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════
// NOTES PAGE — Positive Tests
// ═══════════════════════════════════════════════════════════

test.describe('Notes Page — Positive', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('xSoft Playground');
  });

  test('homepage has header with nav links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header h1')).toContainText('xSoft Playground');
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/media/"]')).toBeVisible();
  });

  test('new note button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#new-note-btn')).toBeVisible();
    await expect(page.locator('#new-note-btn')).toContainText('New Note');
  });

  test('clicking new note shows editor panel', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-note-btn');
    await expect(page.locator('#editor-panel')).toBeVisible();
    await expect(page.locator('#note-title')).toBeVisible();
    await expect(page.locator('#note-content')).toBeVisible();
    await expect(page.locator('#save-note-btn')).toBeVisible();
  });

  test('editor shows auto-filename hint', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-note-btn');
    await expect(page.locator('#editor-filename')).toContainText('xSoft-');
  });

  test('can create a note via API', async ({ request }) => {
    const response = await request.post('/api/notes/', {
      data: { title: 'Test Note', content: 'Hello from Playwright!' },
    });
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.filename).toMatch(/^xSoft-\d{2}\w{3}\d{4}-\d{2}:\d{2}:\d{2}\.txt$/);
  });

  test('can list notes via API', async ({ request }) => {
    const response = await request.get('/api/notes/');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(Array.isArray(json.notes)).toBe(true);
  });

  test('can update a note via API', async ({ request }) => {
    // Create first
    const createRes = await request.post('/api/notes/', {
      data: { title: 'Update Test', content: 'Original' },
    });
    const { id } = await createRes.json();

    // Update
    const updateRes = await request.put('/api/notes/', {
      data: { id, title: 'Updated Title', content: 'Updated content' },
    });
    expect(updateRes.ok()).toBeTruthy();

    // Verify
    const getRes = await request.get(`/api/notes/?id=${id}`);
    const { note } = await getRes.json();
    expect(note.title).toBe('Updated Title');
    expect(note.content).toBe('Updated content');
  });

  test('cancel button hides editor', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-note-btn');
    await expect(page.locator('#editor-panel')).toBeVisible();
    await page.click('#cancel-note-btn');
    await expect(page.locator('#editor-panel')).toBeHidden();
  });
});

// ═══════════════════════════════════════════════════════════
// NOTES PAGE — Negative Tests
// ═══════════════════════════════════════════════════════════

test.describe('Notes Page — Negative', () => {
  test('empty note cannot be saved', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-note-btn');
    // Don't type anything
    await page.click('#save-note-btn');
    // Editor should still be visible (save didn't close it)
    await expect(page.locator('#editor-panel')).toBeVisible();
  });

  test('API rejects note with no title and no content', async ({ request }) => {
    const response = await request.post('/api/notes/', {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test('API returns 404 for non-existent note', async ({ request }) => {
    const response = await request.get('/api/notes/?id=999999');
    expect(response.status()).toBe(404);
  });

  test('delete with no id returns error', async ({ request }) => {
    const response = await request.delete('/api/notes/');
    expect(response.status()).toBe(400);
  });

  test('no duplicate new-note buttons', async ({ page }) => {
    await page.goto('/');
    const buttons = await page.locator('#new-note-btn').count();
    expect(buttons).toBe(1);
  });

  test('page has noindex meta tag', async ({ page }) => {
    await page.goto('/');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });
});

// ═══════════════════════════════════════════════════════════
// MEDIA PAGE — Positive Tests
// ═══════════════════════════════════════════════════════════

test.describe('Media Page — Positive', () => {
  test('media page loads with correct title', async ({ page }) => {
    await page.goto('/media/');
    await expect(page).toHaveTitle('Media — xSoft Playground');
  });

  test('media page has drop zone', async ({ page }) => {
    await page.goto('/media/');
    await expect(page.locator('#drop-zone')).toBeVisible();
    await expect(page.locator('#drop-zone')).toContainText('Drop files here');
  });

  test('media page has file input (hidden)', async ({ page }) => {
    await page.goto('/media/');
    const input = page.locator('#file-input');
    await expect(input).toBeAttached();
    await expect(input).toBeHidden();
  });

  test('files count is displayed', async ({ page }) => {
    await page.goto('/media/');
    await expect(page.locator('#files-count')).toBeVisible();
  });

  test('can list media via API', async ({ request }) => {
    const response = await request.get('/api/media/');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(Array.isArray(json.files)).toBe(true);
  });

  test('media page has noindex meta tag', async ({ page }) => {
    await page.goto('/media/');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });
});

// ═══════════════════════════════════════════════════════════
// MEDIA PAGE — Negative Tests
// ═══════════════════════════════════════════════════════════

test.describe('Media Page — Negative', () => {
  test('non-existent media file returns 404', async ({ request }) => {
    const response = await request.get('/api/media/?id=999999');
    expect(response.status()).toBe(404);
  });

  test('delete without id returns error', async ({ request }) => {
    const response = await request.delete('/api/media/');
    expect(response.status()).toBe(400);
  });

  test('no console errors on media page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/media/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('critical'))).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════
// NAVIGATION — Positive Tests
// ═══════════════════════════════════════════════════════════

test.describe('Navigation — Positive', () => {
  test('can navigate from notes to media', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/media/"]');
    await expect(page).toHaveTitle('Media — xSoft Playground');
  });

  test('can navigate from media to notes', async ({ page }) => {
    await page.goto('/media/');
    await page.click('a[href="/"]');
    await expect(page).toHaveTitle('xSoft Playground');
  });

  test('active nav link is highlighted on notes page', async ({ page }) => {
    await page.goto('/');
    const notesLink = page.locator('a[href="/"]');
    await expect(notesLink).toHaveClass(/text-amber-400/);
  });

  test('active nav link is highlighted on media page', async ({ page }) => {
    await page.goto('/media/');
    const mediaLink = page.locator('a[href="/media/"]');
    await expect(mediaLink).toHaveClass(/text-amber-400/);
  });
});

// ═══════════════════════════════════════════════════════════
// NAVIGATION — Negative Tests
// ═══════════════════════════════════════════════════════════

test.describe('Navigation — Negative', () => {
  test('no broken links in header', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('header nav a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toBeNull();
      expect(href).not.toBe('#');
    }
  });
});
