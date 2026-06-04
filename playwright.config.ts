import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'https://xconvert24-com.xconvert.workers.dev',
    headless: true,
  },
});
