import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

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
const subscribe = (cb) => { addEventListener('hashchange', cb); return () => removeEventListener('hashchange', cb); };

export function useRoute() {
  const path = useSyncExternalStore(subscribe, read, () => '/comunidad');
  return match(path);
}

export function go(path, { replace = false } = {}) {
  if (replace) history.replaceState(null, '', `#${path}`), dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = path;
}
export const back = (fallback = '/comunidad') => (history.length > 1 ? history.back() : go(fallback, { replace: true }));

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
