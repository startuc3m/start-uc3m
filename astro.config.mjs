// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// Web 100% estática, sin adaptador: Vercel sirve dist/ y, aparte, las
// funciones de socios de api/ (igual que con la web de CRA). Si hiciera
// falta un endpoint, va en api/ y no en src/pages/api/: con los dos a la
// vez, Vercel no sabe cuál servir.
export default defineConfig({
  // El dominio canónico es www: startuc3m.es redirige a www con un 308.
  site: 'https://www.startuc3m.es',
  output: 'static',
  // react: solo para las páginas de socios y privacidad (src/socios), que
  // vienen de la web anterior y se montan tal cual como islas.
  integrations: [
    // Fuera del sitemap: páginas de paso de socios (vuelta de Stripe, enlace personal).
    sitemap({ filter: (page) => !/\/socios\/(gracias|telefono)\/?$/.test(page) }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Solo en `npm run dev`: las funciones de api/ las levanta `npm run dev:api`
    // en el 3001. El webhook de Stripe apúntalo directo al 3001, no por aquí.
    server: { proxy: { '/api': 'http://localhost:3001' } },
  },
});
