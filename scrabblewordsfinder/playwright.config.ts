import { defineConfig, devices } from '@playwright/test';

/**
 * Run tests by category:
 *   npx playwright test --project=solver
 *   npx playwright test --project=activities
 *   npx playwright test --project=admin
 *   npx playwright test --project=api
 *   npx playwright test --project=blog
 *   npx playwright test --project=pages
 *   npx playwright test --project=seo
 *   npx playwright test --project="Live AI Tests"
 *
 * Run all:
 *   npx playwright test
 *
 * Run mobile-specific:
 *   npx playwright test --project=mobile
 */

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  workers: 4,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'solver',
      testDir: './tests/solver',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'activities',
      testDir: './tests/activities',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'blog',
      testDir: './tests/blog',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'pages',
      testDir: './tests/pages',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'seo',
      testDir: './tests/seo',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testDir: './tests/mobile',
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
    {
      name: 'quick',
      testDir: './tests/quick/solver',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'quick-chat',
      testDir: './tests/quick/chat',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'site-check',
      testDir: './tests/quick/site-check',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'quick-diamond',
      testDir: './tests/quick',
      testMatch: /diamond-mines\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'DiamondHunt',
      testDir: './tests/DiamondHunt',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'smoke',
      testDir: './tests',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'live-ai',
      testDir: './tests/ai-live',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
