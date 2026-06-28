import { test, expect } from '@playwright/test';

/**
 * BlogComments Component Tests
 * Verifies the threaded comment section renders correctly on blog pages.
 * The component is rendered via BlogLayout on any blog page with a slug.
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';
const NON_SLUG_PAGE = '/blog/'; // blog index — no slug, no comments

test.describe('BlogComments — Positive', () => {
  test('comments section exists on blog post pages', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const section = page.locator('#blog-comments-section');
    await expect(section).toBeAttached();
  });

  test('comments section has correct heading', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const heading = page.locator('#blog-comments-section h2');
    await expect(heading).toContainText('Comments');
  });

  test('comments section has data-blogid attribute', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const section = page.locator('#blog-comments-section');
    const blogid = await section.getAttribute('data-blogid');
    expect(blogid).toBeTruthy();
    expect(blogid).toBe('what-is-scrabble');
  });

  test('comment form is visible with required fields', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await expect(page.locator('#comment-form')).toBeAttached();
    await expect(page.locator('#comment-name')).toBeAttached();
    await expect(page.locator('#comment-text')).toBeAttached();
    await expect(page.locator('#comment-submit-btn')).toBeVisible();
  });

  test('comment form has name field with required attribute', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const nameInput = page.locator('#comment-name');
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(nameInput).toHaveAttribute('maxlength', '100');
  });

  test('comment form has textarea with character counter', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const textarea = page.locator('#comment-text');
    await expect(textarea).toHaveAttribute('required', '');
    await expect(textarea).toHaveAttribute('maxlength', '2000');
    const charCount = page.locator('#comment-char-count');
    await expect(charCount).toHaveText('0');
  });

  test('character counter updates when typing', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const textarea = page.locator('#comment-text');
    await textarea.fill('Hello world');
    const charCount = page.locator('#comment-char-count');
    await expect(charCount).toHaveText('11');
  });

  test('comments tree container exists', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const tree = page.locator('#comments-tree');
    await expect(tree).toBeAttached();
  });

  test('cancel reply button is initially hidden', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const cancelBtn = page.locator('#comment-cancel-reply');
    await expect(cancelBtn).toBeHidden();
  });

  test('submit button has correct label', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const submitBtn = page.locator('#comment-submit-btn');
    await expect(submitBtn).toHaveText('Post Comment');
  });
});

test.describe('BlogComments — Negative', () => {
  test('comments section does NOT appear on blog index page (no slug)', async ({ page }) => {
    await page.goto(NON_SLUG_PAGE);
    const section = page.locator('#blog-comments-section');
    await expect(section).toHaveCount(0);
  });

  test('no duplicate comment sections on a blog post', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const sections = page.locator('#blog-comments-section');
    const count = await sections.count();
    expect(count, 'Should have exactly one comments section').toBe(1);
  });

  test('no JavaScript errors from comments script on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_PAGE);
    await page.waitForLoadState('networkidle');
    const commentErrors = errors.filter(e => e.toLowerCase().includes('comment'));
    expect(commentErrors, `Comment-related JS errors: ${commentErrors.join('; ')}`).toHaveLength(0);
  });

  test('empty form submission does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_PAGE);
    // Try clicking submit without filling in required fields — browser validation should block
    await page.locator('#comment-submit-btn').click();
    expect(errors).toHaveLength(0);
    // Status message should remain hidden (no error shown for HTML5 validation)
    const status = page.locator('#comment-status');
    await expect(status).toBeHidden();
  });

  test('comment form does not have duplicate submit buttons', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const submitButtons = page.locator('#comment-form button[type="submit"]');
    const count = await submitButtons.count();
    expect(count, 'Should have exactly one submit button').toBe(1);
  });
});
