import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './panel.css';
import './screens.css';
import { createDemoApi } from './api.js';
import { DEPTH, SECTION, back, interceptLinks, lastDir, savedScroll, useRoute } from './router.js';
import './motion.css';
import './shell.css';
import Icon from './ui/Icon.jsx';
import { Avatar, Ctx, Logo } from './ui/pieces.jsx';
import Celebracion from './ui/Celebracion.jsx';
import Toast from './ui/Toast.jsx';
import QrModal from './ui/QrModal.jsx';
import { flushSync } from 'react-dom';
import DemoPanel from './DemoPanel.jsx';
import { Avisos, Gente, Persona } from './screens/comunidad.jsx';
import { Inicio } from './screens/inicio.jsx';
import { PuntosCrear, PuntosEscanear, Ranking } from './screens/ranking.jsx';
import { Evento, Eventos } from './screens/eventos.jsx';
import { Ajustes, HazteSocio, Socio } from './screens/ajustes.jsx';
import { Mapa } from './screens/mapa.jsx';
import { Interesados, Oferta, Ofertas, Publicar } from './screens/ofertas.jsx';
import { Editar, Perfil } from './screens/perfil.jsx';
import { Acceso, Alta } from './screens/acceso.jsx';
import { Gestion } from './screens/gestion.jsx';

const SCREENS = { inicio: Inicio, gente: Gente, persona: Persona, mapa: Mapa, eventos: Eventos, evento: Evento, ofertas: Ofertas, oferta: Oferta, interesados: Interesados, publicar: Publicar, perfil: Perfil, editar: Editar, ajustes: Ajustes, socio: Socio, avisos: Avisos, ranking: Ranking, puntosCrear: PuntosCrear, puntosEscanear: PuntosEscanear, gestion: Gestion };
// Título pequeño de la barra de arriba (aparece al bajar, cuando el título grande ya no se ve).
const TITLE = { inicio: 'Inicio', gente: 'Comunidad', mapa: 'Comunidad', eventos: 'Eventos', evento: 'Evento', ofertas: 'Oportunidades', oferta: 'Oportunidad', interesados: 'Interesados', publicar: 'Publicar', perfil: 'Mi perfil', editar: 'Editar perfil', ajustes: 'Ajustes', socio: 'Membresía', avisos: 'Avisos', persona: 'Perfil', ranking: 'Comunidad', puntosCrear: 'QR de puntos', puntosEscanear: 'Puntos', gestion: 'Gestión' };
const NAV = [['inicio', '#/inicio', 'home', 'Inicio'], ['comunidad', '#/comunidad', 'users', 'Comunidad'], ['eventos', '#/eventos', 'calendar', 'Eventos'], ['ofertas', '#/ofertas', 'target', 'Oportunidades']];
const GESTION_ROUTES = ['gestion', 'publicar', 'puntosCrear'];
const TABS = ['inicio', 'comunidad', 'eventos', 'ofertas', 'perfil'];

// La barra de arriba solo enseña lo que sirve en cada pantalla.
function Actions({ name, me, unread }) {
  if (name === 'inicio') return (
    <>
      <a className="glass-btn press" href="#/comunidad/gente" aria-label="Buscar personas"><Icon name="search" size={21} /></a>
      <a className="glass-btn press pd-bell" href="#/avisos" aria-label={unread ? `Avisos, ${unread} sin leer` : 'Avisos'}><Icon name="bell" size={21} />{unread > 0 && <span key={unread} className="dot" />}</a>
    </>
  );
  if (name === 'eventos') return <a className="glass-btn press" href="#/eventos/mias" aria-label="Mis entradas"><Icon name="ticket" size={21} /></a>;
  if (name === 'ofertas' && me.canPublish) return <a className="glass-btn glass-btn--brand press" href="#/ofertas/publicar" aria-label="Publicar oportunidad"><Icon name="plus" size={22} /></a>;
  if (name === 'perfil') return <a className="glass-btn press" href="#/ajustes" aria-label="Ajustes"><Icon name="settings" size={21} /></a>;
  return null;
}

function useScrolled() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(scrollY > 28);
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);
  return on;
}

const THEME_KEY = 'start-panel-theme';
const readTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; } };

function useWide() {
  const [wide, setWide] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = matchMedia('(min-width: 1024px)');
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

function useSystemDark() {
  const [dark, setDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
}

// Tocar la pestaña en la que ya estás te sube arriba del todo (como en Instagram).
function scrollTopIfHere(e, href) {
  if (location.hash === href && scrollY > 0) {
    e.preventDefault();
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

export default function PanelDemo({ photos }) {
  const demo = useMemo(() => createDemoApi(), []);
  const { api } = demo;
  const route = useRoute();
  const wide = useWide();
  const systemDark = useSystemDark();
  const [themePref, setThemePref] = useState(readTheme);
  const theme = themePref === 'system' ? (systemDark ? 'dark' : 'light') : themePref;
  const [me, setMe] = useState(null);
  const [unread, setUnread] = useState(0);
  const [toastMsg, setToastMsg] = useState(null); // { id, text }
  const [party, setParty] = useState(null);
  const [nonce, setNonce] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const toastTimer = useRef(0);
  const scrolled = useScrolled();

  const refreshMe = useCallback(async () => {
    const [{ me: m }, n] = await Promise.all([api('me'), api('notifications').catch(() => ({ items: [] }))]);
    setMe(m);
    setUnread(n.items.filter((x) => x.unread).length);
  }, [api]);
  useEffect(() => { refreshMe(); }, [refreshMe]);

  // toast('Texto') o toast('Texto', { label: 'Deshacer', run }) para avisos con acción.
  const toast = useCallback((text, action) => {
    clearTimeout(toastTimer.current);
    setToastMsg({ id: Date.now(), text, action });
    toastTimer.current = setTimeout(() => setToastMsg(null), action ? 4500 : 2600);
  }, []);
  const dismissToast = useCallback(() => { clearTimeout(toastTimer.current); setToastMsg(null); }, []);
  const setTheme = (t) => { setThemePref(t); try { localStorage.setItem(THEME_KEY, t); } catch {} };

  // Color de la barra del navegador según tema y pantalla.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = route.name === 'acceso' || route.name === 'hazteSocio' ? '#13133d' : theme === 'dark' ? '#0e0e26' : '#f8f8fc';
    document.documentElement.style.colorScheme = theme;
    document.body.style.background = theme === 'dark' ? '#0e0e26' : '#f8f8fc';
  }, [theme, route.name]);

  // Al avanzar, la pantalla nueva empieza arriba; al volver, donde la dejaste (los datos
  // salen de la caché de useApi, así que la página ya tiene su altura). En layout effect
  // para que la View Transition fotografíe ya la posición buena. Abrir un tipo del mapa
  // no es cambiar de pantalla: ahí no se toca el scroll.
  const prevName = useRef(route.name);
  useLayoutEffect(() => {
    const same = prevName.current === route.name && route.name === 'mapa';
    prevName.current = route.name;
    if (same) return;
    const target = lastDir === 'pop' ? savedScroll(route.path) : 0;
    window.scrollTo(0, target);
    // Si la página aún no llega a esa altura (fotos, listas que entran), se reintenta un momento.
    if (target > 0 && scrollY < target - 2) {
      const until = performance.now() + 600;
      const retry = () => { scrollTo(0, target); if (scrollY < target - 2 && performance.now() < until) requestAnimationFrame(retry); };
      requestAnimationFrame(retry);
    }
  }, [route.path]); // eslint-disable-line react-hooks/exhaustive-deps

  // El QR pequeño del carné crece hasta la ventana (y vuelve) con una transición de elemento compartido.
  const morphQr = useCallback((open) => {
    const run = () => flushSync(() => setQrOpen(open));
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return run();
    document.documentElement.dataset.nav = 'qr';
    document.startViewTransition(run).finished.finally(() => { if (document.documentElement.dataset.nav === 'qr') delete document.documentElement.dataset.nav; });
  }, []);
  const openQr = useCallback(() => morphQr(true), [morphQr]);
  const closeQr = useCallback(() => morphQr(false), [morphQr]);
  const closeParty = useCallback(() => setParty(null), []);

  if (!me) return <div className="pd" data-theme={theme}><div className="pd-boot" aria-busy="true"><Logo className="logo" /></div></div>;

  const ctx = { qrOpen, openQr, api, demo, photos, me, refreshMe, toast, celebrate: setParty, reloadScreen: () => setNonce((n) => n + 1), wide, theme, themePref, setTheme };
  const bare = route.name === 'acceso' || route.name === 'alta' || route.name === 'hazteSocio';
  const Screen = SCREENS[route.name] ?? Inicio;
  const section = SECTION[route.name];
  const deep = Boolean(DEPTH[route.name]);
  const tab = TABS.indexOf(section);
  // Bloque «Gestión» del menú lateral: solo lo que tu cargo te deja hacer.
  const gestion = [
    (me.canPublish || me.canManage || ['responsable', 'junta'].includes(me.position)) && ['gestion', '#/gestion', 'shield-check', 'Resumen'],
    me.canPublish && ['publicar', '#/ofertas/publicar', 'plus', 'Publicar oportunidad'],
    me.position === 'junta' && ['puntosCrear', '#/puntos/crear', 'qr-code', 'QR de puntos'],
  ].filter(Boolean);
  const goBack = () => back(route.name === 'avisos' ? '/inicio' : route.name === 'ajustes' ? '/perfil' : route.name === 'socio' ? '/ajustes' : route.name === 'gestion' ? '/perfil' : `/${section === 'perfil' ? 'perfil' : section}`);

  return (
    <Ctx.Provider value={ctx}>
      <div className="pd" data-theme={theme} data-route={route.name} onClick={interceptLinks}>
        {bare ? (
          route.name === 'acceso' ? <Acceso /> : route.name === 'hazteSocio' ? <HazteSocio params={route.params} /> : <Alta params={route.params} />
        ) : (
          <div className={`pd-app ${deep ? 'is-deep' : ''}`}>
            <aside className="pd-side" aria-label="Menú">
              <div><Logo className="logo" /><p className="sub">ÁREA DE SOCIOS_</p></div>
              <nav aria-label="Secciones">
                {NAV.map(([k, href, icon, label]) => <a key={k} href={href} aria-current={section === k && !GESTION_ROUTES.includes(route.name) ? 'page' : undefined}><Icon name={icon} />{label}</a>)}
              </nav>
              {gestion.length > 0 && (
                <nav className="side-gest" aria-label="Gestión">
                  <p className="side-h">Gestión<span>{me.positionLabel}</span></p>
                  {gestion.map(([k, href, icon, label]) => <a key={k} href={href} aria-current={route.name === k ? 'page' : undefined}><Icon name={icon} />{label}</a>)}
                </nav>
              )}
              <button className="btn btn--lime btn--block press side-pass" onClick={openQr}><Icon name="qr-code" size={18} /> Mi QR de Start</button>
              <div className={`me ${section === 'perfil' && !GESTION_ROUTES.includes(route.name) && route.name !== 'ajustes' ? 'is-on' : ''}`}>
                <a className="me-link press" href="#/perfil" aria-label="Mi perfil">
                  <Avatar person={me} size={36} lime />
                  <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block' }}>{me.name.split(' ')[0]} {me.name.split(' ')[1]?.[0]}.</b><span className="t-soft" style={{ fontSize: 13 }}>{me.positionLabel}</span></span>
                </a>
                <a className="me-gear press" href="#/ajustes" aria-label="Ajustes" aria-current={route.name === 'ajustes' ? 'page' : undefined}><Icon name="settings" size={19} /></a>
              </div>
            </aside>
            <div className="pd-main">
              <header className={`pd-top ${scrolled ? 'is-scrolled' : ''}`}>
                {deep
                  ? <button className="glass-btn press" onClick={goBack} aria-label="Volver"><Icon name="chevron-left" size={24} /></button>
                  : <button className="glass-btn press only-mobile" onClick={openQr} aria-label="Mi QR de Start" style={{ viewTransitionName: qrOpen ? 'none' : undefined }}><Icon name="qr-code" size={21} /></button>}
                <span className="pd-top-title" aria-hidden={!scrolled}>{TITLE[route.name]}</span>
                <span className="pd-top-acts"><Actions name={route.name} me={me} unread={unread} /></span>
              </header>
              <main className={`pd-screen pd-screen--${route.name}`} key={`${route.name === 'mapa' ? 'mapa' : route.path}#${nonce}`}>
                <Screen params={route.params} path={route.path} />
              </main>
            </div>
            <nav className="pd-tabbar" aria-label="Secciones">
              <span className="ind" aria-hidden="true" style={{ transform: `translateX(${Math.max(0, tab) * 100}%)`, opacity: tab < 0 ? 0 : 1 }} />
              {NAV.map(([k, href, icon, label]) => <a key={k} className="press" href={href} aria-current={section === k ? 'page' : undefined} onClick={(e) => scrollTopIfHere(e, href)}><span className="tb-ico"><Icon name={icon} size={22} /></span>{label}</a>)}
              <a className="press" href="#/perfil" aria-current={section === 'perfil' ? 'page' : undefined} onClick={(e) => scrollTopIfHere(e, '#/perfil')}><span className="tb-ico"><Avatar person={me} size={24} lime className={section === 'perfil' ? 'is-on' : ''} /></span>Yo</a>
            </nav>
          </div>
        )}
        <Toast msg={toastMsg} onAction={dismissToast} />
        {qrOpen && <QrModal onClose={closeQr} />}
        {party && <Celebracion party={party} onClose={closeParty} />}
        <DemoPanel />
      </div>
    </Ctx.Provider>
  );
}
