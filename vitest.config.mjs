import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Tests de las islas React (src/socios). La web Astro no tiene tests de
// componente: se valida con el build.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./vitest.setup.mjs'],
    globals: true,
  },
});
