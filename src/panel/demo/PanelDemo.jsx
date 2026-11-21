import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './panel.css';
import './screens.css';
import { createDemoApi } from './api.js';
import { DEPTH, SECTION, back, interceptLinks, useRoute } from './router.js';
import './motion.css';
import Icon from './ui/Icon.jsx';
import { Avatar, Ctx, Logo } from './ui/pieces.jsx';
import Celebracion from './ui/Celebracion.jsx';
import Toast from './ui/Toast.jsx';
import QrModal from './ui/QrModal.jsx';
import { flushSync } from 'react-dom';
import DemoPanel from './DemoPanel.jsx';
import { Avisos, Gente, ParaTi, Persona } from './screens/comunidad.jsx';
import { Mapa } from './screens/mapa.jsx';
import { Interesados, Oferta, Ofertas, Publicar } from './screens/ofertas.jsx';
import { Editar, Perfil } from './screens/perfil.jsx';
import { Acceso, Admin, Alta } from './screens/acceso.jsx';

const SCREENS = { paraTi: ParaTi, gente: Gente, persona: Persona, mapa: Mapa, ofertas: Ofertas, oferta: Oferta, interesados: Interesados, publicar: Publicar, perfil: Perfil, editar: Editar, avisos: Avisos, admin: Admin };
const BACK_TITLE = { persona: 'Comunidad', oferta: 'Ofertas', interesados: 'Oferta', publicar: 'Ofertas', editar: 'Mi perfil', avisos: 'Avisos' };
const NAV = [['comunidad', '#/comunidad', 'users', 'Comunidad'], ['mapa', '#/mapa', 'orbit', 'Mapa'], ['ofertas', '#/ofertas', 'briefcase', 'Ofertas']];

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

  const refreshMe = useCallback(async () => {
    const [{ me: m }, n] = await Promise.all([api('me'), api('notifications').catch(() => ({ items: [] }))]);
    setMe(m);
    setUnread(n.items.filter((x) => x.unread).length);
  }, [api]);
  useEffect(() => { refreshMe(); }, [refreshMe]);

  const toast = useCallback((text) => {
    clearTimeout(toastTimer.current);
    setToastMsg({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);
  const setTheme = (t) => { setThemePref(t); try { localStorage.setItem(THEME_KEY, t); } catch {} };

  // Color de la barra del navegador según tema y pantalla.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = route.name === 'acceso' ? '#333399' : theme === 'dark' ? '#17173a' : '#ffffff';
    document.documentElement.style.colorScheme = theme;
    document.body.style.background = theme === 'dark' ? '#0e0e26' : '#f8f8fc';
  }, [theme, route.name]);

  // Cada pantalla empieza arriba (salvo al volver atrás, que el navegador restaura).
  useEffect(() => { window.scrollTo(0, 0); }, [route.path]);

  if (!me) return <div className="pd" data-theme={theme}><div className="pd-boot" aria-busy="true"><Logo className="logo" /></div></div>;

  // El QR pequeño del carné crece hasta la ventana (y vuelve) con una transición de elemento compartido.
  const morphQr = (open) => {
    const run = () => flushSync(() => setQrOpen(open));
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return run();
    document.documentElement.dataset.nav = 'qr';
    document.startViewTransition(run).finished.finally(() => { delete document.documentElement.dataset.nav; });
  };
  const ctx = { qrOpen, openQr: () => morphQr(true), api, demo, photos, me, refreshMe, toast, celebrate: setParty, reloadScreen: () => setNonce((n) => n + 1), wide, theme, themePref, setTheme };
  const bare = route.name === 'acceso' || route.name === 'alta';
  const Screen = SCREENS[route.name] ?? ParaTi;
  const section = SECTION[route.name];
  const deep = !wide && DEPTH[route.name];

  return (
    <Ctx.Provider value={ctx}>
      <div className="pd" data-theme={theme} data-route={route.name} onClick={interceptLinks}>
        {bare ? (
          route.name === 'acceso' ? <Acceso /> : <Alta params={route.params} />
        ) : (
          <div className={`pd-app ${deep ? 'is-deep' : ''}`}>
            <aside className="pd-side" aria-label="Menú">
              <div><Logo className="logo" /><p className="sub">ÁREA DE SOCIOS_</p></div>
              <nav>
                {NAV.map(([k, href, icon, label]) => <a key={k} href={href} aria-current={section === k ? 'page' : undefined}><Icon name={icon} />{label}</a>)}
                {me.canManage && <a href="#/admin" aria-current={section === 'admin' ? 'page' : undefined}><Icon name="shield-check" />Administración</a>}
                <a href="#/avisos" aria-current={route.name === 'avisos' ? 'page' : undefined}><Icon name="bell" />Avisos{unread > 0 && <span className="badge num">{unread}</span>}</a>
              </nav>
              <a className="me press" href="#/perfil" aria-current={section === 'perfil' ? 'page' : undefined} aria-label="Mi perfil y ajustes">
                <Avatar person={me} size={36} lime />
                <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block' }}>{me.name.split(' ')[0]} {me.name.split(' ')[1]?.[0]}.</b><span className="t-soft" style={{ fontSize: 13 }}>{me.role === 'starter' ? `Starter · ${me.dept}` : 'Socio'}</span></span>
                <Icon name="chevrons-up-down" size={16} className="t-soft" />
              </a>
            </aside>
            <div className="pd-main">
              {deep ? (
                <header className="pd-header pd-header--back">
                  <button className="press" onClick={() => back(`/${section === 'perfil' ? 'perfil' : section}`)} aria-label="Volver" style={{ display: 'flex', gap: 14, alignItems: 'center' }}><Icon name="arrow-left" size={22} />{BACK_TITLE[route.name]}</button>
                </header>
              ) : (
                <header className="pd-header">
                  <a href="#/comunidad" aria-label="Inicio"><Logo className="logo" /></a>
                  <a className="pd-bell press" href="#/avisos" aria-label={unread ? `Avisos, ${unread} sin leer` : 'Avisos'}><Icon name="bell" size={22} />{unread > 0 && <span className="dot" />}</a>
                </header>
              )}
              <main className={`pd-screen pd-screen--${route.name}`} key={`${route.path}#${nonce}`}>
                <Screen params={route.params} path={route.path} />
              </main>
            </div>
            <nav className="pd-tabbar" aria-label="Secciones">
              {NAV.map(([k, href, icon, label]) => <a key={k} className="press" href={href} aria-current={section === k ? 'page' : undefined}><Icon name={icon} size={22} />{label}</a>)}
              <a className="press" href="#/perfil" aria-current={section === 'perfil' ? 'page' : undefined}><Avatar person={me} size={26} lime className={section === 'perfil' ? 'is-on' : ''} />Perfil</a>
              <span className="ind" aria-hidden="true" style={{ transform: `translateX(${Math.max(0, ['comunidad', 'mapa', 'ofertas', 'perfil'].indexOf(section)) * 100}%)`, opacity: section === 'admin' ? 0 : 1 }} />
            </nav>
          </div>
        )}
        <Toast msg={toastMsg} />
        {qrOpen && <QrModal onClose={() => morphQr(false)} />}
        {party && <Celebracion party={party} onClose={() => setParty(null)} />}
        <DemoPanel />
      </div>
    </Ctx.Provider>
  );
}
