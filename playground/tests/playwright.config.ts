import { defineConfig } from '@playwright/test';

const BASE = process.env.PG_TEST_URL || 'https://xsoft-playground.xconvert.workers.dev';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  use: {
    baseURL: BASE,
    headless: true,
    channel: 'chromium',
  },
  reporter: 'list',
});
