// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Todo se prerenderiza en estático salvo /api/* (formularios), que corre en Node.
export default defineConfig({
  // En GitHub Pages la web cuelga de /WebStartUC3M (BASE_PATH lo pone el workflow).
  site: process.env.SITE_URL ?? 'https://www.startuc3m.es',
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
