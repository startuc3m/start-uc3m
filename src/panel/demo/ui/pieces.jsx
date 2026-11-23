import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import logoFull from '../assets/start.svg?raw';
import logoWord from '../assets/start-wordmark.svg?raw';
import Icon from './Icon.jsx';

export const Ctx = createContext(null);

// Diálogos: el Tab no se escapa al contenido de detrás y, al cerrar, el foco vuelve
// a donde estaba (el botón que lo abrió).
export function useDialogFocus(ref, active = true) {
  useEffect(() => {
    if (!active) return;
    const back = document.activeElement;
    const onKey = (e) => {
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); if (back?.isConnected) back.focus?.({ preventScroll: true }); };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}
export const useApp = () => useContext(Ctx);

// Logo oficial (repo brand): se pinta el SVG tal cual, solo cambia el color.
export const Logo = ({ full = true, className = 'logo', label = 'Start, Emprendedores UC3M' }) => (
  <span className={className} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: full ? logoFull : logoWord }} style={{ display: 'block', lineHeight: 0 }} />
);

export const Avatar = ({ person, size = 44, lime = false, className = '' }) => (
  <span className={`avatar ${lime ? 'avatar--lime' : ''} ${className}`} style={{ '--s': `${size}px` }} aria-hidden="true">{person?.initials}</span>
);

export const Stack = ({ people = [] }) => (
  <span className="stack" aria-hidden="true">{people.slice(0, 3).map((x) => <Avatar key={x.id} person={x} size={26} />)}</span>
);

export const TypeTag = ({ code, family }) => <span className={`type-tag bg-${family?.color ?? 'lavender'}`}>{code}</span>;

export const Sello = ({ stamp, size = 84, rotate = 0, empty = false, className = '' }) => (
  <span className={`sello ${empty ? 'sello--empty' : `bg-${stamp.color}`} ${className}`} style={{ '--s': `${size}px`, rotate: `${rotate}deg` }} role="img" aria-label={empty ? 'Sello por conseguir' : `Sello ${stamp.name}, ${stamp.date}`}>
    <b>{empty ? '?' : stamp.label}</b>
    <span>{empty ? stamp?.date ?? '' : stamp.date}</span>
  </span>
);

const ROT = [-8, 6, -4, 5, -6, 8, -3, 4];
export const Sellos = ({ list, size = 84, next }) => (
  <div className="sellos">
    {list.map((s, i) => <Sello key={s.id} stamp={s} size={size} rotate={ROT[i % ROT.length]} />)}
    {next && <Sello stamp={{ date: next }} empty size={size} />}
  </div>
);

// Aro de nivel alrededor de la foto: progreso hacia el siguiente nivel.
export function LevelRing({ progress = 0, size = 84, children, animate = false }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const ref = useRef(null);
  useEffect(() => {
    // Se llena una sola vez por sesión: la primera vez es un premio, la décima sería ruido.
    if (!animate || !ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try { if (sessionStorage.getItem('pd-ring')) return; sessionStorage.setItem('pd-ring', '1'); } catch {}
    ref.current.animate([{ strokeDashoffset: c }, { strokeDashoffset: c * (1 - progress) }], { duration: 900, delay: 250, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
  }, [animate, progress, c]);
  return (
    <span className="lvl" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff26" strokeWidth="4" />
        <circle ref={ref} cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--lime)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
      </svg>
      {children}
    </span>
  );
}

// QR de mentira pero estable: mismo número, mismo dibujo.
export function FakeQr({ seed = 42, label = 'Código QR para fichar' }) {
  const n = 21;
  let x = seed * 9301 + 49297;
  const cells = [];
  const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (finder(r, c)) continue;
    x = (x * 9301 + 49297) % 233280;
    if (x / 233280 > 0.52) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
  }
  const F = ({ r, c }) => <g><rect x={c} y={r} width="7" height="7" /><rect x={c + 1} y={r + 1} width="5" height="5" fill="#fff" /><rect x={c + 2} y={r + 2} width="3" height="3" /></g>;
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width="100%" height="100%" fill="currentColor" shapeRendering="crispEdges" role="img" aria-label={label}>
      {cells}<F r={0} c={0} /><F r={0} c={n - 7} /><F r={n - 7} c={0} />
    </svg>
  );
}

// Carné Start. `own` = el tuyo (con QR y número); si no, el de otra persona (con su frase).
export function Carne({ person, own = false, animateRing = false, className = '' }) {
  const lvl = person.level;
  const app = useApp();
  return (
    <article className={`carne ${className}`} aria-label={own ? 'Tu carné de Start' : `Carné de ${person.name}`}>
      <div className="top">
        <Logo className="logo" />
        {own ? <span className="season">CARNÉ DE SOCIO<br />TEMPORADA 26/27</span> : <TypeTag code={person.type} family={person.family} />}
      </div>
      <div className="mid">
        <LevelRing progress={lvl.progress} animate={animateRing}><Avatar person={person} size={64} /></LevelRing>
        <div style={{ minWidth: 0 }}>
          <p className="name">{person.name}</p>
          <p className="sub">{[!own && person.university, !own && person.career, !own && person.course, roleLine(person), own && person.type].filter(Boolean).join(' · ')}</p>
          {own ? <p className="big num">Nº {String(person.number).padStart(4, '0')}</p> : <p className="big">NIVEL {lvl.n}<small>{lvl.name}</small></p>}
        </div>
        {own && (
          <button className="qr press" onClick={() => app?.openQr()} aria-label="Ampliar el QR para fichar" style={{ viewTransitionName: app?.qrOpen ? 'none' : 'my-qr' }}>
            <FakeQr seed={person.number} />
          </button>
        )}
      </div>
      {own ? (
        <div className="bottom"><span>TOCA EL QR PARA FICHAR</span><button className="press" onClick={() => app?.openQr()} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#fff' }}><Icon name="maximize" size={14} /> AMPLIAR</button></div>
      ) : person.bio && <p className="bio">{person.bio}</p>}
    </article>
  );
}

export const OfferLogo = ({ company, size = 48 }) => (
  <span className="logo-sq" style={{ '--s': `${size}px`, background: company.color }} aria-hidden="true">
    {company.isStart ? <span style={{ fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: size * 0.42 }}>s_</span> : company.initial}
  </span>
);

export const Skeleton = ({ h = 72, n = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy="true" aria-label="Cargando">
    {Array.from({ length: n }, (_, i) => <div key={i} className="skel" style={{ height: h }} />)}
  </div>
);

export const Empty = ({ icon = 'sparkles', title, children, action }) => (
  <div className="empty card"><Icon name={icon} size={28} /><p className="t-h">{title}</p>{children && <p className="t-soft">{children}</p>}{action}</div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="error-box card" role="alert"><Icon name="wifi-off" size={28} /><p className="t-h">{message}</p><button className="btn btn--soft press" onClick={onRetry}>Reintentar</button></div>
);

// Estado común de una pantalla con datos: cargando, error o contenido.
export function Load({ q, skeleton, children }) {
  if (q.error) return <ErrorBox message={q.error} onRetry={q.reload} />;
  if (!q.data) return skeleton ?? <Skeleton />;
  return children(q.data);
}

const DRAWER = 'cubic-bezier(.32,.72,0,1)';
const isWide = () => matchMedia('(min-width: 1024px)').matches;
const noMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hoja inferior (en escritorio, panel flotante). Entra con la curva de iOS, sale por
// donde entró y en el móvil se cierra arrastrando: por distancia o por un tirón rápido.
export function Sheet({ open, onClose, title, children }) {
  const id = useId();
  const [mounted, setMounted] = useState(open);
  const panel = useRef(null);
  const scrim = useRef(null);
  const drag = useRef(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!open) return;
    // Si se reabre mientras salía, se cancela la salida en vez de desmontar.
    if (leaving.current) { leaving.current = false; panel.current?.getAnimations().forEach((a) => a.cancel()); scrim.current?.getAnimations().forEach((a) => a.cancel()); }
    setMounted(true);
  }, [open]);
  useDialogFocus(panel, mounted);

  // Entrada
  useEffect(() => {
    if (!mounted || !open || !panel.current) return;
    panel.current.focus({ preventScroll: true });
    if (noMotion()) return;
    const from = isWide() ? 'translateY(12px) scale(.97)' : 'translateY(100%)';
    panel.current.animate([{ transform: from, opacity: isWide() ? 0 : 1 }, { transform: 'none', opacity: 1 }], { duration: isWide() ? 260 : 420, easing: DRAWER });
    scrim.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease' });
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Salida: anima desde donde esté (también a mitad de un arrastre) y luego desmonta.
  const exit = (after) => {
    if (leaving.current) return;
    leaving.current = true;
    const done = () => { if (!leaving.current) return; setMounted(false); after?.(); };
    if (!panel.current || noMotion()) return done();
    const now = getComputedStyle(panel.current).transform;
    const to = isWide() ? 'translateY(12px) scale(.97)' : 'translateY(100%)';
    panel.current.animate([{ transform: now === 'none' ? 'none' : now }, { transform: to, opacity: isWide() ? 0 : 1 }], { duration: 260, easing: DRAWER, fill: 'forwards' }).finished.then(done, done);
    scrim.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease', fill: 'forwards' });
  };
  useEffect(() => { if (!open && mounted) exit(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const requestClose = () => exit(onClose);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => e.key === 'Escape' && requestClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const onDown = (e) => {
    if (isWide() || e.button !== 0 || leaving.current) return;
    if (e.target.closest('button, a')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, t: performance.now(), id: e.pointerId };
    panel.current.getAnimations().forEach((a) => a.cancel());
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return; // un solo dedo: ignorar el segundo
    const dy = e.clientY - d.y;
    // Hacia arriba no hay tope duro: cede cada vez menos (fricción).
    const y = dy > 0 ? dy : -Math.sqrt(-dy) * 3;
    panel.current.style.transform = `translateY(${y}px)`;
    if (scrim.current) scrim.current.style.opacity = String(Math.max(0, 1 - dy / 400));
  };
  const onUp = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const dy = e.clientY - d.y;
    const v = dy / (performance.now() - d.t);
    if (dy > 120 || (v > 0.11 && dy > 10)) return requestClose();
    const now = panel.current.style.transform;
    panel.current.style.transform = '';
    if (scrim.current) scrim.current.style.opacity = '';
    panel.current.animate([{ transform: now || 'none' }, { transform: 'none' }], { duration: 300, easing: DRAWER });
  };

  if (!mounted) return null;
  return (
    <>
      <div ref={scrim} className="scrim" onClick={requestClose} />
      <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
        <div className="sheet-drag" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span className="grab" aria-hidden="true" />
          <div className="section-h"><h2 id={id} className="t-h" style={{ fontSize: 18 }}>{title}</h2><button className="press" onClick={requestClose} aria-label="Cerrar"><Icon name="x" /></button></div>
        </div>
        {children}
      </div>
    </>
  );
}

export const roleLine = (x) => x.positionLabel ?? (x.role === 'starter' ? `Starter${x.dept ? ` · ${x.dept}` : ''}` : 'Socio');

// Número que rueda al cambiar (sube: entra desde abajo; baja: desde arriba).
export function Rolling({ value }) {
  const prev = useRef(value);
  const ref = useRef(null);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value || !ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dir = value > from ? 1 : -1;
    ref.current.animate([{ transform: `translateY(${dir * 70}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.23,1,.32,1)' });
  }, [value]);
  return <span className="rolling"><span ref={ref} className="num">{value}</span></span>;
}

// Confeti pequeño que sale de un botón (para «Me interesa» a partir de la segunda vez).
export function burst(el, colors = ['#d6ff4f', '#8ee1e6', '#b6b8e7', '#f5e443']) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect();
  import('canvas-confetti').then(({ default: confetti }) => confetti({
    particleCount: 26, spread: 60, startVelocity: 22, gravity: 1.1, ticks: 90, scalar: 0.8, zIndex: 200, colors,
    origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight },
  }));
}

// Foto de portada que entra con un fundido cuando termina de cargar.
export function Img({ src, alt = '' }) {
  const [ok, setOk] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth) setOk(true); }, [src]);
  return <img ref={ref} src={src} alt={alt} className={`cover-img ${ok ? 'is-loaded' : ''}`} onLoad={() => setOk(true)} decoding="async" />;
}
