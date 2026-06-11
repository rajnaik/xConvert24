import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 0,
  workers: 1, // Extensions require single worker
  reporter: [['list']],
  use: {
    headless: false, // Extensions don't work in headless
  },
  projects: [
    { name: 'swf-extension', testMatch: 'swf.spec.ts' },
  ],
});
