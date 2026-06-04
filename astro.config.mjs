// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mcp from 'astro-mcp';

// https://astro.build/config
export default defineConfig({
  integrations: [mcp()],
  vite: {
    plugins: [tailwindcss()],
  },
});
