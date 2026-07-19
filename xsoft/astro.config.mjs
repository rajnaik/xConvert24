import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  trailingSlash: 'always',
  security: { checkOrigin: false },
  server: { port: 4325 },
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
  site: 'https://www.xsoftlimited.com',
});
