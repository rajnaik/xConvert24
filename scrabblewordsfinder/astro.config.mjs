// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  trailingSlash: 'always',
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
  },
});
