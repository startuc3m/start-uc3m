import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StartCampProfile from './StartCampProfile.jsx';
import * as api from './api.js';

vi.mock('./api.js', () => ({ CADUCIDAD_URL_FOTO_S: 3600, observarSesion: vi.fn(), obtenerParticipantes: vi.fn(), cerrarSesion: vi.fn() }));
vi.mock('./AvatarForm.jsx', () => ({ default: () => <input id="av-email" aria-label="Tu correo" /> }));
vi.mock('../components/curved_arc/curved_arc_start', () => ({ default: ({ participants }) => <div>{participants.map((p) => <p key={p.user_id}>{p.nombre}</p>)}</div> }));

let cambioSesion;
let unsubscribe;
beforeEach(() => {
  window.history.replaceState(null, '', '/eventos/start-camp/avatar');
  vi.clearAllMocks();
  unsubscribe = vi.fn();
  api.observarSesion.mockImplementation(async (cb) => { cambioSesion = cb; cb(false); return unsubscribe; });
  api.obtenerParticipantes.mockResolvedValue([{ user_id: '1', nombre: 'Participante real' }]);
});

test('sin sesión solo aparece el acceso por correo, sin consultar participantes', async () => {
  render(<StartCampProfile />);
  expect(await screen.findByLabelText('Tu correo')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Ver participantes' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Mi perfil' })).not.toBeInTheDocument();
  expect(api.obtenerParticipantes).not.toHaveBeenCalled();
});

test('al iniciar sesión abre el destino pendiente y al salir elimina los perfiles', async () => {
  const { act } = await import('@testing-library/react');
  window.history.replaceState(null, '', '?vista=participantes');
  const { unmount } = render(<StartCampProfile />);
  await screen.findByLabelText('Tu correo');
  expect(screen.getByText('Inicia sesión para ver al resto')).toBeInTheDocument();
  act(() => cambioSesion(true));
  expect(await screen.findByRole('button', { name: 'Ver participantes' })).toBeInTheDocument();
  expect(await screen.findByText('Participante real')).toBeInTheDocument();
  act(() => cambioSesion(false));
  expect(screen.queryByText('Participante real')).not.toBeInTheDocument();
  expect(screen.getByText('Inicia sesión para ver al resto')).toBeInTheDocument();
  unmount();
  expect(unsubscribe).toHaveBeenCalled();
});

test('un resultado vacío no muestra participantes de ejemplo', async () => {
  window.history.replaceState(null, '', '?vista=participantes');
  api.observarSesion.mockImplementation(async (cb) => { cb(true); return unsubscribe; });
  api.obtenerParticipantes.mockResolvedValue([]);
  render(<StartCampProfile />);
  expect(await screen.findByText('Aún no hay perfiles de participantes.')).toBeInTheDocument();
});

test('un error de red permite reintentar', async () => {
  window.history.replaceState(null, '', '?vista=participantes');
  api.observarSesion.mockImplementation(async (cb) => { cb(true); return unsubscribe; });
  api.obtenerParticipantes.mockRejectedValueOnce(new Error('red'));
  render(<StartCampProfile />);
  fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('Participante real')).toBeInTheDocument();
  await waitFor(() => expect(api.obtenerParticipantes).toHaveBeenCalledTimes(2));
});

test('renueva las fotos antes de una hora y cancela la renovación al salir', async () => {
  const { act } = await import('@testing-library/react');
  vi.useFakeTimers();
  try {
    window.history.replaceState(null, '', '?vista=participantes');
    api.observarSesion.mockImplementation(async (cb) => { cb(true); return unsubscribe; });
    const { unmount } = render(<StartCampProfile />);
    await act(async () => {});
    expect(api.obtenerParticipantes).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(55 * 60 * 1000); });
    expect(api.obtenerParticipantes).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(55 * 60 * 1000); });
    expect(api.obtenerParticipantes).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});
