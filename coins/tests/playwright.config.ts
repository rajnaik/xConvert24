import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_URL || 'https://xcrypto24-staging.xconvert.workers.dev',
    headless: true,
  },
});
