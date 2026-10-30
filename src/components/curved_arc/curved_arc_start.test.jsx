import React from 'react';
import { vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CurvedArcStart from './curved_arc_start';

const participants = [
  { user_id: '1', nombre: 'Ana', rol: 'Diseño', estado_grupo: 'Busco grupo', intereses: [] },
  { user_id: '2', nombre: 'Luis', rol: 'Tecnología', estado_grupo: 'Tengo grupo', intereses: [] },
];

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

test('la rueda bloquea el scroll y gira el arco también sobre la ficha', async () => {
  render(<CurvedArcStart participants={participants} />);
  const event = new WheelEvent('wheel', { deltaY: 600, bubbles: true, cancelable: true });
  fireEvent(screen.getByRole('heading', { name: 'Ana' }), event);
  expect(event.defaultPrevented).toBe(true);
  expect(screen.getByRole('region')).toHaveAttribute('data-lenis-prevent');
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Luis' })).toBeInTheDocument();
});

test.each([1, 100, 1200])('cada pulso avanza una tarjeta, aunque deltaY sea %s', async (deltaY) => {
  render(<CurvedArcStart participants={[...participants, { ...participants[0], user_id: '3', nombre: 'Eva' }]} />);
  const arc = screen.getByRole('region');
  fireEvent.wheel(arc, { deltaY });
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Luis' })).toBeInTheDocument();
  fireEvent.wheel(arc, { deltaY });
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Eva' })).toBeInTheDocument();
  fireEvent.wheel(arc, { deltaY: -deltaY });
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Luis' })).toBeInTheDocument();
});

test('una ráfaga breve avanza solo una tarjeta y no acumula saltos', async () => {
  render(<CurvedArcStart participants={[...participants, { ...participants[0], user_id: '3', nombre: 'Eva' }]} />);
  const arc = screen.getByRole('region');
  for (let i = 0; i < 5; i++) {
    fireEvent.wheel(arc, { deltaY: 120 - i * 5 });
    await act(async () => { await vi.advanceTimersByTimeAsync(40); });
  }
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Luis' })).toBeInTheDocument();
  fireEvent.wheel(arc, { deltaY: 120 });
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Eva' })).toBeInTheDocument();
});

test('el scroll continuo vuelve a avanzar sin mover el ratón ni esperar silencio', async () => {
  render(<CurvedArcStart participants={[...participants, { ...participants[0], user_id: '3', nombre: 'Eva' }]} />);
  const arc = screen.getByRole('region');
  for (let i = 0; i < 12; i++) {
    fireEvent.wheel(arc, { deltaY: 120 });
    await act(async () => { await vi.advanceTimersByTimeAsync(40); });
  }
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Eva' })).toBeInTheDocument();
});

test('permite desplazar horizontalmente la fila de intereses sin mover el arco', () => {
  render(<CurvedArcStart participants={[{ ...participants[0], intereses: ['Hardware y robótica', 'Impacto social', 'Educación'] }]} />);
  const event = new WheelEvent('wheel', { deltaX: 100, deltaY: 0, bubbles: true, cancelable: true });
  fireEvent(screen.getByText('Hardware y robótica'), event);
  expect(event.defaultPrevented).toBe(false);
  expect(screen.getByText('Impacto social')).toBeInTheDocument();
  expect(screen.getByText('Educación')).toBeInTheDocument();
});

test('solo hay un desplegable de filtros, sin la cabecera anterior', () => {
  render(<CurvedArcStart participants={participants} />);
  expect(screen.queryByText('HACKATHON · PLAYER CARDS')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar participantes' }), { target: { value: 'Tecnología' } });
  expect(screen.getByRole('heading', { name: 'Luis' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Seleccionar a Ana, Diseño' })).not.toBeInTheDocument();
});

test('libera el bloqueo y los temporizadores al salir del directorio', () => {
  const { unmount } = render(<CurvedArcStart participants={participants} />);
  const element = screen.getByRole('region');
  fireEvent.wheel(element, { deltaY: 600 });
  unmount();
  const event = new WheelEvent('wheel', { deltaY: 600, cancelable: true });
  element.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

test('las biografías largas pueden desplazarse dentro de la ficha', () => {
  render(<CurvedArcStart participants={participants} />);
  const content = screen.getByLabelText('Datos del participante');
  Object.defineProperties(content, { scrollHeight: { value: 500 }, clientHeight: { value: 200 } });
  const event = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
  fireEvent(content, event);
  expect(event.defaultPrevented).toBe(false);
  content.scrollTop = 300;
  const atEnd = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
  fireEvent(content, atEnd);
  expect(atEnd.defaultPrevented).toBe(true);
});

test('en móvil solo captura el scroll que empieza sobre el arco', async () => {
  vi.stubGlobal('innerWidth', 390);
  render(<CurvedArcStart participants={participants} />);
  const content = screen.getByLabelText('Datos del participante');
  const reading = new WheelEvent('wheel', { deltaY: 600, bubbles: true, cancelable: true });
  fireEvent(content, reading);
  expect(reading.defaultPrevented).toBe(false);
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
  const rotating = new WheelEvent('wheel', { deltaY: 600, bubbles: true, cancelable: true });
  fireEvent(screen.getByRole('button', { name: 'Seleccionar a Ana, Diseño' }), rotating);
  expect(rotating.defaultPrevented).toBe(true);
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(screen.getByRole('heading', { name: 'Luis' })).toBeInTheDocument();
});

test('muestra la foto firmada, vuelve a iniciales si falla y acepta una firma nueva', () => {
  const { container, rerender } = render(<CurvedArcStart participants={[{ ...participants[0], foto_url: 'https://firmada/ana' }]} />);
  const avatar = container.querySelector('.player-card-avatar');
  expect(avatar.querySelector('img')).toHaveAttribute('src', 'https://firmada/ana');
  fireEvent.error(avatar.querySelector('img'));
  expect(avatar.querySelector('img')).toBeNull();
  expect(avatar).toHaveTextContent('A');
  rerender(<CurvedArcStart participants={[{ ...participants[0], foto_url: 'https://firmada/ana-nueva' }]} />);
  expect(avatar.querySelector('img')).toHaveAttribute('src', 'https://firmada/ana-nueva');
});
