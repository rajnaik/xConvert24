import { test, expect, Page } from '@playwright/test';

/**
 * Blog Ask Page Tests (standalone /blog/ask/)
 * Verifies the full-page AI chat experience:
 * - Page structure and welcome state
 * - Rich answer formatting (bold, inline code, lists)
 * - Category-colored source cards with badges and scores
 * - Suggested question buttons
 * - Gradient avatar and bubble styling
 * - Error handling
 */

const ASK_PAGE = '/blog/ask/';

async function dismissCookieBanner(page: Page) {
  const acceptBtn = page.locator('#cookie-banner button', { hasText: 'Accept' });
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.locator('#cookie-banner').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
}

test.describe('Blog Ask Page — Positive', () => {
  test('page loads with correct title and heading', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await expect(page).toHaveTitle(/Ask AI/);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Ask AI — Scrabble Expert Assistant');
  });

  test('full-page chat container is visible', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const chatContainer = page.locator('#ask-ai-full');
    await expect(chatContainer).toBeVisible();
  });

  test('welcome message shows AI avatar with gradient styling', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const messages = page.locator('#ask-messages');
    // Avatar uses gradient from-purple-600 to-blue-600
    const avatar = messages.locator('.from-purple-600.to-blue-600').first();
    await expect(avatar).toBeVisible();
    await expect(avatar).toContainText('🧠');
  });

  test('welcome message displays topic cards (Strategy, Words, Rules, Tournaments)', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const messages = page.locator('#ask-messages');
    await expect(messages).toContainText('Strategy & tactics');
    await expect(messages).toContainText('Word lists & bingos');
    await expect(messages).toContainText('Rules & scoring');
    await expect(messages).toContainText('History & tournaments');
  });

  test('input field is visible and accepts text', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);
    const input = page.locator('#ask-input');
    await expect(input).toBeVisible();
    await input.fill('What are the best opening moves?');
    await expect(input).toHaveValue('What are the best opening moves?');
  });

  test('suggested question buttons are visible', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const suggestions = page.locator('.ask-suggest');
    await expect(suggestions).toHaveCount(6);
    await expect(suggestions.first()).toContainText('What are the best two-letter words?');
  });

  test('clicking a suggestion fills the input and submits', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'QI, ZA, and XI are top picks.', sources: [] })
      })
    );

    const firstSuggestion = page.locator('.ask-suggest').first();
    await firstSuggestion.click();

    // User message should appear after clicking suggestion
    const userMsg = page.locator('#ask-messages').getByText('What are the best two-letter words?');
    await expect(userMsg).toBeVisible({ timeout: 5000 });
  });

  test('submitting a question shows user bubble with gradient styling', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Great question!', sources: [] })
      })
    );

    await page.locator('#ask-input').fill('Test question');
    await page.locator('#ask-send').click();

    // User bubble uses from-blue-600 to-blue-700 gradient
    const userBubble = page.locator('#ask-messages .from-blue-600.to-blue-700');
    await expect(userBubble).toBeVisible({ timeout: 5000 });
    await expect(userBubble).toContainText('Test question');
  });

  test('AI response renders with border and gradient background', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Here is the answer.', sources: [] })
      })
    );

    await page.locator('#ask-input').fill('Question');
    await page.locator('#ask-send').click();

    // AI bubble uses from-gray-800/90 to-gray-900/90 with border
    const aiBubble = page.locator('#ask-messages .from-gray-800\\/90').last();
    await expect(aiBubble).toBeVisible({ timeout: 5000 });
    await expect(aiBubble).toContainText('Here is the answer.');
  });

  test('AI response renders bold markdown as styled spans', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'The word **QUIXOTIC** scores high.', sources: [] })
      })
    );

    await page.locator('#ask-input').fill('High scoring words?');
    await page.locator('#ask-send').click();

    // Bold text should render with font-semibold and text-white
    const boldSpan = page.locator('#ask-messages span.font-semibold.text-white', { hasText: 'QUIXOTIC' });
    await expect(boldSpan).toBeVisible({ timeout: 5000 });
  });

  test('AI response renders inline code with monospace styling', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Use the rack `AEINRST` for bingos.', sources: [] })
      })
    );

    await page.locator('#ask-input').fill('Best racks?');
    await page.locator('#ask-send').click();

    // Inline code should render with code element and font-mono
    const codeEl = page.locator('#ask-messages code.font-mono', { hasText: 'AEINRST' });
    await expect(codeEl).toBeVisible({ timeout: 5000 });
    await expect(codeEl).toHaveClass(/bg-gray-700/);
  });

  test('AI response shows category-colored source cards', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'QI and ZA are essential.',
          sources: [{ slug: 'best-two-letter-words-scrabble', title: 'Best Two-Letter Words', category: 'Two-Letter Words', score: 0.92 }]
        })
      })
    );

    await page.locator('#ask-input').fill('Two-letter words');
    await page.locator('#ask-send').click();

    // Source card link with correct href (trailing slash)
    const sourceCard = page.locator('#ask-messages a[href="/blog/best-two-letter-words-scrabble/"]');
    await expect(sourceCard).toBeVisible({ timeout: 5000 });
    await expect(sourceCard).toContainText('Best Two-Letter Words');

    // Card should have category-specific border (blue for Two-Letter Words)
    await expect(sourceCard).toHaveClass(/border-blue-500/);

    // Category badge text (uppercase badge span with specific styling)
    const badge = sourceCard.locator('span.uppercase.tracking-wider', { hasText: 'Two-Letter Words' });
    await expect(badge).toBeVisible();

    // Score percentage
    await expect(sourceCard).toContainText('92%');
  });

  test('sources section has Sources heading with book emoji', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Answer.', sources: [{ slug: 'test', title: 'Test', category: 'Strategy' }] })
      })
    );

    await page.locator('#ask-input').fill('Q');
    await page.locator('#ask-send').click();

    const sourcesHeader = page.locator('#ask-messages').getByText('Sources');
    await expect(sourcesHeader).toBeVisible({ timeout: 5000 });
  });

  test('question counter updates after submitting', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Done.', sources: [] })
      })
    );

    await page.locator('#ask-input').fill('Test');
    await page.locator('#ask-send').click();

    const counter = page.locator('#ask-counter');
    await expect(counter).toContainText('1/20 questions this hour', { timeout: 5000 });
  });
});

test.describe('Blog Ask Page — Tailwind Safelist', () => {
  test('hidden safelist div exists to preserve dynamic CSS classes', async ({ page }) => {
    await page.goto(ASK_PAGE);
    // The safelist div must exist so Tailwind doesn't purge JS-generated classes
    const safelist = page.locator('#ask-ai-full').locator('..').locator('div.hidden').first();
    await expect(safelist).toBeAttached();
  });

  test('safelist div is not visible to users', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const safelist = page.locator('article div.hidden').first();
    await expect(safelist).toBeHidden();
  });

  test('safelist contains category color classes for source cards', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const safelistHTML = await page.locator('article div.hidden').first().innerHTML();
    // Verify key category color classes are safelisted
    expect(safelistHTML).toContain('border-purple-500/40');
    expect(safelistHTML).toContain('border-blue-500/40');
    expect(safelistHTML).toContain('border-amber-500/40');
    expect(safelistHTML).toContain('border-green-500/40');
    expect(safelistHTML).toContain('border-gray-600');
  });

  test('safelist contains formatting classes for bold and inline code', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const safelistHTML = await page.locator('article div.hidden').first().innerHTML();
    // Bold text class
    expect(safelistHTML).toContain('text-white');
    expect(safelistHTML).toContain('font-semibold');
    // Inline code class
    expect(safelistHTML).toContain('font-mono');
    expect(safelistHTML).toContain('bg-gray-700');
    expect(safelistHTML).toContain('text-purple-300');
  });
});

test.describe('Blog Ask Page — FVT Rich Formatting', () => {
  test('numbered list renders as Steps card with numbered circles', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Here are the steps:\n\n1. Draw seven tiles from the bag\n2. Place your first word on the center star\n3. Score your points and draw new tiles',
          sources: []
        })
      })
    );

    await page.locator('#ask-input').fill('How to start a game?');
    await page.locator('#ask-send').click();

    // Steps card should appear with the purple border container
    const stepsCard = page.locator('#ask-messages .border-purple-500\\/30');
    await expect(stepsCard).toBeVisible({ timeout: 5000 });

    // "Steps" label should be visible
    await expect(stepsCard.locator('text=Steps')).toBeVisible();

    // Should have 3 numbered circle indicators
    const circles = stepsCard.locator('.rounded-full.bg-purple-900\\/50');
    await expect(circles).toHaveCount(3);

    // First circle should show "1"
    await expect(circles.nth(0)).toContainText('1');
    await expect(circles.nth(1)).toContainText('2');
    await expect(circles.nth(2)).toContainText('3');
  });

  test('bullet list renders as bordered items with arrow markers', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Key two-letter words:\n\n- QI scores 11 points\n- ZA scores 11 points\n- XI scores 9 points',
          sources: []
        })
      })
    );

    await page.locator('#ask-input').fill('Best short words?');
    await page.locator('#ask-send').click();

    // Bullet items should appear with the ▶ text marker
    const bulletMarkers = page.locator('#ask-messages span:has-text("▶")');
    await expect(bulletMarkers.first()).toBeVisible({ timeout: 5000 });
    await expect(bulletMarkers).toHaveCount(3);

    // Content text should be present
    await expect(page.locator('#ask-messages').getByText('QI scores 11 points')).toBeVisible();
    await expect(page.locator('#ask-messages').getByText('ZA scores 11 points')).toBeVisible();
  });

  test('regular paragraphs render without list styling', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Scrabble is a classic word game.\n\nIt was invented in 1938 by Alfred Mosher Butts.',
          sources: []
        })
      })
    );

    await page.locator('#ask-input').fill('What is Scrabble?');
    await page.locator('#ask-send').click();

    // Both paragraphs should be visible as text
    await expect(page.locator('#ask-messages').getByText('Scrabble is a classic word game')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#ask-messages').getByText('It was invented in 1938')).toBeVisible();

    // No Steps card should appear (no numbered lists)
    const stepsLabel = page.locator('#ask-messages').getByText('🧩 Steps');
    await expect(stepsLabel).toHaveCount(0);

    // No bullet markers should appear
    const bulletMarkers = page.locator('#ask-messages span:has-text("▶")');
    await expect(bulletMarkers).toHaveCount(0);
  });

  test('inline bold formatting works within numbered list items', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Top strategies:\n\n1. Use **blank tiles** wisely\n2. Learn **two-letter** words\n3. Control the **center** of the board',
          sources: []
        })
      })
    );

    await page.locator('#ask-input').fill('Strategy tips?');
    await page.locator('#ask-send').click();

    // Bold text within a Steps card
    const stepsCard = page.locator('#ask-messages .border-purple-500\\/30');
    await expect(stepsCard).toBeVisible({ timeout: 5000 });

    const boldSpans = stepsCard.locator('span.font-semibold.text-white');
    await expect(boldSpans.first()).toBeVisible();
    await expect(boldSpans).toHaveCount(3);
  });

  test('inline code works within bullet list items', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Useful racks:\n\n- Try the rack `AEINRST` for bingos\n- The rack `DEILNOR` is also strong',
          sources: []
        })
      })
    );

    await page.locator('#ask-input').fill('Good racks?');
    await page.locator('#ask-send').click();

    // Inline code within bullet items
    const bulletSection = page.locator('#ask-messages .border-purple-500\\/20').first();
    await expect(bulletSection).toBeVisible({ timeout: 5000 });

    const codeEls = page.locator('#ask-messages .border-purple-500\\/20 code.font-mono');
    await expect(codeEls.first()).toBeVisible();
    await expect(codeEls.first()).toContainText('AEINRST');
  });

  test('mixed content renders paragraphs, lists, and steps correctly', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Here is an overview of rack management.\n\n1. Keep a balanced rack\n2. Avoid too many vowels\n3. Trade if stuck\n\nKey points to remember:\n\n- Balance is important\n- Vowels and consonants should be mixed',
          sources: []
        })
      })
    );

    await page.locator('#ask-input').fill('Rack management overview');
    await page.locator('#ask-send').click();

    // Should have a Steps card (numbered list)
    const stepsCard = page.locator('#ask-messages .border-purple-500\\/30');
    await expect(stepsCard).toBeVisible({ timeout: 5000 });

    // Should also have bullet items
    const bulletItems = page.locator('#ask-messages .border-purple-500\\/20');
    await expect(bulletItems.first()).toBeVisible();
    expect(await bulletItems.count()).toBeGreaterThanOrEqual(2);

    // Should have a plain paragraph at the top
    const paragraphs = page.locator('#ask-messages p.text-sm.text-gray-300.leading-relaxed.mt-2');
    expect(await paragraphs.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Blog Ask Page — Negative', () => {
  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ASK_PAGE);
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('empty input does not submit', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    let apiCalled = false;
    await page.route('**/api/rag-query/', route => {
      apiCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'x', sources: [] }) });
    });

    await page.locator('#ask-send').click();
    await page.waitForTimeout(500);
    expect(apiCalled, 'API should not be called with empty input').toBe(false);
  });

  test('handles API 500 error with friendly message', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'fail' }) })
    );

    await page.locator('#ask-input').fill('Fail test');
    await page.locator('#ask-send').click();

    const errorMsg = page.locator('#ask-messages').getByText('something went wrong');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    expect(errors).toHaveLength(0);
  });

  test('handles rate limit (429) gracefully', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'rate limited' }) })
    );

    await page.locator('#ask-input').fill('Rate limit test');
    await page.locator('#ask-send').click();

    const limitMsg = page.locator('#ask-messages').getByText('question limit');
    await expect(limitMsg).toBeVisible({ timeout: 5000 });
  });

  test('source cards without category use gray fallback styling', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Info.', sources: [{ slug: 'unknown-post', title: 'Unknown Post' }] })
      })
    );

    await page.locator('#ask-input').fill('Test');
    await page.locator('#ask-send').click();

    const sourceCard = page.locator('#ask-messages a[href="/blog/unknown-post/"]');
    await expect(sourceCard).toBeVisible({ timeout: 5000 });
    // Fallback uses border-gray-600
    await expect(sourceCard).toHaveClass(/border-gray-600/);
  });

  test('source cards without score do not show percentage badge', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Answer.', sources: [{ slug: 'strategy-post', title: 'Strategy Post', category: 'Strategy' }] })
      })
    );

    await page.locator('#ask-input').fill('Strategy');
    await page.locator('#ask-send').click();

    const sourceCard = page.locator('#ask-messages a[href="/blog/strategy-post/"]');
    await expect(sourceCard).toBeVisible({ timeout: 5000 });

    // No percentage badge when score is missing
    const scoreBadge = sourceCard.locator('.font-mono');
    await expect(scoreBadge).toHaveCount(0);
  });

  test('send button is disabled while loading', async ({ page }) => {
    await page.goto(ASK_PAGE);
    await dismissCookieBanner(page);

    await page.route('**/api/rag-query/', async route => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'Done', sources: [] }) });
    });

    await page.locator('#ask-input').fill('Question');
    await page.locator('#ask-send').click();

    await expect(page.locator('#ask-send')).toBeDisabled();
  });

  test('no duplicate ask-ai-full containers', async ({ page }) => {
    await page.goto(ASK_PAGE);
    const count = await page.locator('#ask-ai-full').count();
    expect(count).toBe(1);
  });
});
