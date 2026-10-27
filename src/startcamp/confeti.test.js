import { vi } from 'vitest';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import confetti from 'canvas-confetti';
import { COLORES_CONFETI, lanzarConfeti } from './confeti.js';

function movimientoReducido(activo) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: activo });
}

beforeEach(() => {
  vi.resetAllMocks();
  delete window.matchMedia;
});

test('una ráfaga desde cada esquina de abajo con los colores del brand kit', async () => {
  await lanzarConfeti();
  expect(confetti).toHaveBeenCalledTimes(2);
  const [izquierda, derecha] = confetti.mock.calls.map(([opciones]) => opciones);
  expect(izquierda.origin).toEqual({ x: 0, y: 1 });
  expect(derecha.origin).toEqual({ x: 1, y: 1 });
  for (const opciones of [izquierda, derecha]) {
    expect(opciones.colors).toEqual(['#333399', '#b6b8e7', '#8ee1e6', '#f5e443', '#d6ff4f']);
    expect(opciones.disableForReducedMotion).toBe(true);
  }
  expect(COLORES_CONFETI).toHaveLength(5);
});

test('con prefers-reduced-motion no se lanza', async () => {
  movimientoReducido(true);
  await lanzarConfeti();
  expect(confetti).not.toHaveBeenCalled();
});

test('sin prefers-reduced-motion sí se lanza', async () => {
  movimientoReducido(false);
  await lanzarConfeti();
  expect(confetti).toHaveBeenCalledTimes(2);
});

test('si la librería falla no lanza error', async () => {
  confetti.mockImplementation(() => {
    throw new Error('sin canvas');
  });
  await expect(lanzarConfeti()).resolves.toBeUndefined();
});

test('si la librería no carga no lanza error', async () => {
  vi.resetModules();
  vi.doMock('canvas-confetti', () => {
    throw new Error('no carga');
  });
  const { lanzarConfeti: lanzar } = await import('./confeti.js');
  await expect(lanzar()).resolves.toBeUndefined();
  vi.doUnmock('canvas-confetti');
});
