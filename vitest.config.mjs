import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Tests de las islas React (src/socios). La web Astro no tiene tests de
// componente: se valida con el build.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // api/: lógica de servidor que se puede probar sin red (p. ej. el mapeo a Notion).
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.{js,mjs}'],
    setupFiles: ['./vitest.setup.mjs'],
    globals: true,
  },
});
