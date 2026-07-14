// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react()],
  trailingSlash: 'always',
  security: { checkOrigin: false },
  server: { port: 4321 },
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
    server: { strictPort: true },
    ssr: {
      optimizeDeps: {
        exclude: ['astro/virtual-modules/middleware.js', '@cloudflare/unenv-preset'],
      },
    },
  },
});
