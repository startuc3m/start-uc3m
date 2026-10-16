// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Todo se prerenderiza en estático. Las funciones de socios siguen en api/
// (funciones de Vercel), fuera de Astro.
export default defineConfig({
  site: 'https://startuc3m.es',
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
