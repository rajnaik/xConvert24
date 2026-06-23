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
      testDir: './tests/pages',
      testMatch: /mobile/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'smoke',
      testDir: './tests',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
