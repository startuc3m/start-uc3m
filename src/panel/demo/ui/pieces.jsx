import { createContext, useContext, useEffect, useId, useRef } from 'react';
import logoFull from '../assets/start.svg?raw';
import logoWord from '../assets/start-wordmark.svg?raw';
import Icon from './Icon.jsx';

export const Ctx = createContext(null);
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
    if (!animate || !ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
export function FakeQr({ seed = 42 }) {
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
    <svg viewBox={`0 0 ${n} ${n}`} width="100%" height="100%" fill="currentColor" shapeRendering="crispEdges" role="img" aria-label="Código QR para fichar">
      {cells}<F r={0} c={0} /><F r={0} c={n - 7} /><F r={n - 7} c={0} />
    </svg>
  );
}

// Carné Start. `own` = el tuyo (con QR y número); si no, el de otra persona (con su frase).
export function Carne({ person, own = false, animateRing = false, onFlip, className = '' }) {
  const lvl = person.level;
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
          <p className="sub">{[person.career && !own ? person.career : null, person.course && !own ? person.course : null, person.role === 'starter' ? `Starter${person.dept ? (own ? ' · ' : ' en ') + person.dept : ''}` : 'Socio', own ? person.type : null].filter(Boolean).join(' · ')}</p>
          {own ? <p className="big num">Nº {String(person.number).padStart(4, '0')}</p> : <p className="big">NIVEL {lvl.n}<small>{lvl.name}</small></p>}
        </div>
        {own && <span className="qr"><FakeQr seed={person.number} /></span>}
      </div>
      {own ? (
        <div className="bottom"><span>ENSEÑA EL QR PARA FICHAR</span>{onFlip && <button className="press" onClick={onFlip} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#fff' }}><Icon name="rotate-ccw" size={14} /> GIRAR</button>}</div>
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

export function Sheet({ open, onClose, title, children }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={id}>
        <span className="grab" aria-hidden="true" />
        <div className="section-h"><h2 id={id} className="t-h" style={{ fontSize: 18 }}>{title}</h2><button className="press" onClick={onClose} aria-label="Cerrar"><Icon name="x" /></button></div>
        {children}
      </div>
    </>
  );
}

export const roleLine = (x) => (x.role === 'starter' ? `Starter${x.dept ? ` · ${x.dept}` : ''}` : x.role === 'socio' ? 'Socio' : '');
