import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// Rutas por hash: la web es estática, así que /panel/demo/#/oferta/growth se puede
// recargar y compartir sin reescrituras en Vercel.
const ROUTES = [
  ['/acceso', 'acceso'],
  ['/hazte-socio', 'hazteSocio'],
  ['/alta/:paso', 'alta'],
  ['/inicio', 'inicio'],
  ['/comunidad', 'canales'],
  ['/comunidad/gente', 'gente'],
  ['/comunidad/mapa', 'mapa'],
  ['/mapa/:tipo', 'mapa'],
  ['/canal/:id', 'canal'],
  ['/persona/:id', 'persona'],
  ['/eventos', 'eventos'],
  ['/eventos/mias', 'eventos'],
  ['/eventos/pasados', 'eventos'],
  ['/evento/:id', 'evento'],
  ['/ofertas', 'ofertas'],
  ['/ofertas/interesan', 'ofertas'],
  ['/ofertas/mias', 'ofertas'],
  ['/ofertas/publicar', 'publicar'],
  ['/oferta/:id', 'oferta'],
  ['/oferta/:id/interesados', 'interesados'],
  ['/perfil', 'perfil'],
  ['/perfil/editar', 'editar'],
  ['/ajustes', 'ajustes'],
  ['/socio', 'socio'],
  ['/avisos', 'avisos'],
  ['/ranking', 'ranking'],
  ['/admin', 'admin'],
  ['/gestion', 'gestion'],
];

export function match(path) {
  for (const [pattern, name] of ROUTES) {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}/?$`);
    const m = path.match(re);
    if (m) return { name, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])), path };
  }
  return { name: 'inicio', params: {}, path: '/inicio' };
}

// Pestaña de la barra inferior a la que pertenece cada pantalla.
export const SECTION = { inicio: 'inicio', avisos: 'inicio', ranking: 'inicio', canales: 'comunidad', gente: 'comunidad', mapa: 'comunidad', canal: 'comunidad', persona: 'comunidad', eventos: 'eventos', evento: 'eventos', ofertas: 'ofertas', oferta: 'ofertas', interesados: 'ofertas', publicar: 'ofertas', perfil: 'perfil', editar: 'perfil', ajustes: 'perfil', socio: 'perfil', admin: 'perfil', gestion: 'perfil' };
// Profundidad: decide si la transición entra desde la derecha (push) o vuelve (pop).
export const DEPTH = { persona: 1, canal: 1, evento: 1, oferta: 1, interesados: 2, publicar: 1, editar: 1, avisos: 1, ranking: 1, ajustes: 1, socio: 2, admin: 2, gestion: 1 };

const read = () => (typeof location === 'undefined' ? '/inicio' : location.hash.replace(/^#/, '') || '/inicio');

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
// Posición de scroll de cada pantalla, para volver exactamente a donde estabas.
const scrollMemory = new Map();
export let lastDir = 'none';
export const savedScroll = (path) => scrollMemory.get(path) ?? 0;

let pending = null; // destino de una navegación en curso (contra el doble toque)
let navId = 0;

function navigate(update, to, { skip = false, pop = false } = {}) {
  const a = depthOf(current), b = depthOf(to);
  const dir = b > a ? 'push' : b < a || pop ? 'pop' : 'none';
  if (typeof scrollY !== 'undefined') scrollMemory.set(current, scrollY);
  lastDir = pop ? 'pop' : dir;
  const run = () => { pending = null; update(); };
  if (skip || typeof document === 'undefined' || !document.startViewTransition) return run();
  const root = document.documentElement;
  const mine = ++navId;
  root.dataset.nav = reduced() ? 'fade' : dir;
  const t = document.startViewTransition(() => flushSync(run));
  // Solo limpia quien puso la marca: una transición saltada no deja sin dirección a la siguiente.
  t.finished.finally(() => { if (mine === navId) delete root.dataset.nav; });
}

if (typeof window !== 'undefined') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!history.state?.app) history.replaceState({ app: true, root: true }, '', location.href);
  // Atrás/adelante del navegador. Si Safari ya animó el gesto de volver, no repetimos.
  // (Cambiar el hash a mano también dispara popstate, así que no hace falta escuchar hashchange,
  // que además llegaría antes de que la transición capture la pantalla vieja.)
  addEventListener('popstate', (e) => { const to = read(); navigate(() => set(to), to, { skip: e.hasUAVisualTransition, pop: true }); });
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, () => current, () => '/inicio');
  return match(path);
}

export function go(path, { replace = false } = {}) {
  if (path === (pending ?? current)) return;
  pending = path;
  navigate(() => {
    // Las entradas propias llevan una marca: así «volver» nunca saca de la app.
    if (replace) history.replaceState({ app: true }, '', `#${path}`);
    else history.pushState({ app: true }, '', `#${path}`);
    set(path);
  }, path);
}
export const back = (fallback = '/inicio') => (history.state?.app && !history.state.root ? history.back() : go(fallback, { replace: true }));

// Los enlaces internos (#/…) pasan por go() para tener transición.
export function interceptLinks(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href^="#/"]');
  if (!a || a.target) return;
  e.preventDefault();
  go(a.getAttribute('href').slice(1));
}

// Pide datos al api y avisa de carga, error y recarga. Guarda la última respuesta de
// cada petición: al volver a una pantalla se pinta al instante con lo que había (y el
// scroll puede volver a su sitio) mientras se pide de nuevo por detrás.
const cache = new Map();
export const clearApiCache = () => cache.clear();

export function useApi(api, action, input, deps = []) {
  const key = `${action}:${JSON.stringify(input ?? {})}`;
  const [state, set] = useState(() => ({ data: cache.get(key) ?? null, error: null, loading: true }));
  const seq = useRef(0);
  const run = useCallback(async () => {
    const id = ++seq.current;
    set((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api(action, input);
      cache.set(key, data);
      if (id === seq.current) set({ data, error: null, loading: false });
    } catch (e) {
      if (id === seq.current) set({ data: null, error: e.message, loading: false });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return {
    ...state,
    reload: run,
    setData: (fn) => set((s) => {
      const data = typeof fn === 'function' ? fn(s.data) : fn;
      cache.set(key, data);
      return { ...s, data };
    }),
  };
}
