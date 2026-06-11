// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mcp from 'astro-mcp';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [mcp()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/scrabblewordsfinder/**'],
      },
    },
  },
});
