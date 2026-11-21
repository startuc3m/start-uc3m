import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Rutas por hash: la web es estática, así que /panel/demo/#/oferta/growth se puede
// recargar y compartir sin reescrituras en Vercel.
const ROUTES = [
  ['/acceso', 'acceso'],
  ['/alta/:paso', 'alta'],
  ['/comunidad', 'paraTi'],
  ['/comunidad/gente', 'gente'],
  ['/persona/:id', 'persona'],
  ['/mapa', 'mapa'],
  ['/mapa/:tipo', 'mapa'],
  ['/ofertas', 'ofertas'],
  ['/ofertas/interesan', 'ofertas'],
  ['/ofertas/mias', 'ofertas'],
  ['/ofertas/publicar', 'publicar'],
  ['/oferta/:id', 'oferta'],
  ['/oferta/:id/interesados', 'interesados'],
  ['/perfil', 'perfil'],
  ['/perfil/editar', 'editar'],
  ['/avisos', 'avisos'],
  ['/admin', 'admin'],
];

export function match(path) {
  for (const [pattern, name] of ROUTES) {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}/?$`);
    const m = path.match(re);
    if (m) return { name, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])), path };
  }
  return { name: 'paraTi', params: {}, path: '/comunidad' };
}

// Pestaña de la barra inferior a la que pertenece cada pantalla.
export const SECTION = { paraTi: 'comunidad', gente: 'comunidad', persona: 'comunidad', mapa: 'mapa', ofertas: 'ofertas', oferta: 'ofertas', interesados: 'ofertas', publicar: 'ofertas', perfil: 'perfil', editar: 'perfil', avisos: 'comunidad', admin: 'admin' };
// Profundidad: decide si la transición entra desde la derecha (push) o vuelve (pop).
export const DEPTH = { persona: 1, oferta: 1, interesados: 2, publicar: 1, editar: 1, avisos: 1 };

const read = () => (typeof location === 'undefined' ? '/comunidad' : location.hash.replace(/^#/, '') || '/comunidad');

// Estado propio y síncrono (no el evento hashchange, que llega tarde): así cada
// navegación cabe dentro de document.startViewTransition y se anima con dirección.
let current = read();
const subs = new Set();
const subscribe = (cb) => { subs.add(cb); return () => subs.delete(cb); };
const set = (p) => { if (p !== current) { current = p; subs.forEach((f) => f()); } };

const depthOf = (p) => DEPTH[match(p).name] ?? 0;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// push: entra desde la derecha. pop: vuelve. none: cambio de sección, instantáneo
// (se hace decenas de veces al día); solo se mueven los indicadores con nombre.
function navigate(update, to, { skip = false } = {}) {
  const a = depthOf(current), b = depthOf(to);
  const dir = b > a ? 'push' : b < a ? 'pop' : 'none';
  if (skip || typeof document === 'undefined' || !document.startViewTransition) return update();
  const root = document.documentElement;
  root.dataset.nav = reduced() ? 'fade' : dir;
  const t = document.startViewTransition(() => flushSync(update));
  t.finished.finally(() => { delete root.dataset.nav; });
}

if (typeof window !== 'undefined') {
  // Atrás/adelante del navegador. Si Safari ya animó el gesto de volver, no repetimos.
  // (Cambiar el hash a mano también dispara popstate, así que no hace falta escuchar hashchange,
  // que además llegaría antes de que la transición capture la pantalla vieja.)
  addEventListener('popstate', (e) => { const to = read(); navigate(() => set(to), to, { skip: e.hasUAVisualTransition }); });
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, () => current, () => '/comunidad');
  return match(path);
}

export function go(path, { replace = false } = {}) {
  if (path === current) return;
  navigate(() => {
    if (replace) history.replaceState(null, '', `#${path}`);
    else history.pushState(null, '', `#${path}`);
    set(path);
  }, path);
}
export const back = (fallback = '/comunidad') => (history.length > 1 ? history.back() : go(fallback, { replace: true }));

// Los enlaces internos (#/…) pasan por go() para tener transición.
export function interceptLinks(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href^="#/"]');
  if (!a || a.target) return;
  e.preventDefault();
  go(a.getAttribute('href').slice(1));
}

// Pide datos al api y avisa de carga, error y recarga.
export function useApi(api, action, input, deps = []) {
  const [state, set] = useState({ data: null, error: null, loading: true });
  const seq = useRef(0);
  const run = useCallback(async () => {
    const id = ++seq.current;
    set((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api(action, input);
      if (id === seq.current) set({ data, error: null, loading: false });
    } catch (e) {
      if (id === seq.current) set({ data: null, error: e.message, loading: false });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run, setData: (fn) => set((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
}
