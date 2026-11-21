import { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Logo, Sheet, useApp } from '../ui/pieces.jsx';
import { go } from '../router.js';
import { FAMILIES, TYPE_NAMES } from '../data.js';
import { PageTitle } from './comunidad.jsx';

export function Acceso() {
  const { photos } = useApp();
  const [mail, setMail] = useState(false);
  const [email, setEmail] = useState('nora.prieto@alumnos.uc3m.es');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState({});
  const enter = (e) => {
    e.preventDefault();
    const x = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) x.email = 'Escribe el correo con el que te invitaron.';
    if (pass.length < 8) x.pass = 'La contraseña tiene al menos 8 caracteres.';
    setErr(x);
    if (!Object.keys(x).length) go('/alta/1');
  };
  return (
    <div className="acceso">
      <div className="acceso-photo" style={{ backgroundImage: `url(${photos.sala})` }} aria-hidden="true" />
      <div className="acceso-top"><Logo className="logo" /><span className="t-mono">Desde 2013</span></div>
      <div className="acceso-panel">
        <p className="t-mono" style={{ color: 'var(--lime)' }}>Área de socios_</p>
        <h1 className="t-display acceso-h">Somos gente haciendo cosas_</h1>
        <div className="acceso-btns">
          <button className="btn btn--block btn-apple-w press" onClick={() => go('/alta/1')}><GoogleG /> Continuar con Google</button>
          <button className="btn btn--block btn-text press" onClick={() => setMail(true)} aria-expanded={mail}><Icon name="mail" size={20} /> Entrar con tu correo</button>
        </div>
        <p className="acceso-join">¿Aún no eres socio? <a href="#/hazte-socio">Hazte socio</a></p>
      </div>
      <Sheet open={mail} onClose={() => setMail(false)} title="Entra con tu correo">
        <form className="acceso-form" onSubmit={enter} noValidate>
          <div className="field">
            <label htmlFor="acc-mail">Correo de la invitación</label>
            <input id="acc-mail" className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr({}); }} aria-invalid={Boolean(err.email)} aria-describedby={err.email ? 'acc-err' : undefined} />
            {err.email && <p id="acc-err" className="err">{err.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="acc-pass">Contraseña</label>
            <input id="acc-pass" className="input" type="password" autoComplete="current-password" value={pass} onChange={(e) => { setPass(e.target.value); setErr({}); }} aria-invalid={Boolean(err.pass)} aria-describedby={err.pass ? 'acc-perr' : undefined} />
            {err.pass && <p id="acc-perr" className="err">{err.pass}</p>}
          </div>
          <button className="btn btn--primary btn--block press">Entrar</button>
          <p className="t-soft" style={{ fontSize: 14, textAlign: 'center' }}>¿Primera vez? Usa el enlace de tu invitación para crear la contraseña. <a href="#/acceso" onClick={(e) => e.preventDefault()} style={{ color: 'var(--brand-text)', fontWeight: 600 }}>He olvidado la contraseña</a></p>
        </form>
      </Sheet>
    </div>
  );
}

const STEPS = ['Tu foto', 'Qué estudias', 'Tu personalidad', 'Listo'];
export function Alta({ params }) {
  const { api, me, refreshMe, celebrate } = useApp();
  const step = Math.min(Math.max(Number(params.paso) || 1, 1), 4);
  const [f, setF] = useState({ career: '', course: '', type: '', photo: false }); // alguien nuevo: todo por rellenar
  // Obligatorios (decisión del 17/11 en #87): foto, carrera y curso. Personalidad: un tipo o «No lo sé».
  const missing = step === 1 && !f.photo ? 'tu foto' : step === 2 && !f.career.trim() ? 'tu carrera' : step === 2 && !f.course ? 'tu curso' : step === 3 && !f.type ? 'tu personalidad (o «No lo sé»)' : null;
  // Dirección del último cambio de paso: avanzar entra por la derecha, volver por la izquierda.
  const prev = useRef(step);
  const dir = step >= prev.current ? 'fwd' : 'back';
  prev.current = step;
  const nextStep = async () => {
    if (missing) return;
    if (step === 3) await api('profile.update', { career: f.career, course: f.course, name: me.name, ...(f.type !== 'NS' ? { type: f.type } : {}) });
    if (step < 4) return go(`/alta/${step + 1}`, { replace: true });
    await api('onboarding.done');
    await refreshMe();
    go('/inicio', { replace: true });
    celebrate({ kind: 'welcome', title: '¡Bienvenido a Start!', text: 'Tu carné ya está activo. Enséñalo en el próximo evento y consigue tu primer sello.' });
  };
  return (
    <div className="alta">
      <div className="steps" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Paso ${step} de 4: ${STEPS[step - 1]}`}>
        {STEPS.map((s, i) => <i key={s}><b className={i < step ? 'on' : ''} /></i>)}
      </div>
      <div className="alta-top">
        {step > 1 ? <button className="alta-back press" onClick={() => go(`/alta/${step - 1}`, { replace: true })}><Icon name="arrow-left" size={18} /> Atrás</button> : <span className="t-mono" style={{ color: 'var(--brand-text)' }}>Paso 1 de 4</span>}
        <span className="t-soft" style={{ fontSize: 13 }}>Obligatorio para salir en Gente</span>
      </div>
      <div key={step} className={`alta-step alta-step--${dir}`}>
      {step > 1 && <p className="t-mono" style={{ color: 'var(--brand-text)' }}>Paso {step} de 4</p>}
      {step === 1 && (
        <>
          <h1 className="t-display" style={{ fontSize: 40 }}>Ponle cara a tu carné_</h1>
          <p className="t-soft">Es lo primero que verá la gente en Comunidad.</p>
          <button className={`photo-drop press ${f.photo ? 'is-done' : ''}`} onClick={async () => { await api('photo.upload'); setF({ ...f, photo: true }); navigator.vibrate?.(10); }}>
            {f.photo ? <span className="photo-ok"><Avatar person={me} size={120} /><span className="photo-check"><Icon name="check" size={18} stroke={3} /></span></span> : <span className="photo-empty"><Icon name="camera" size={34} /></span>}
            <span><Icon name="camera" size={18} /> {f.photo ? 'Cambiar foto' : 'Hacer o subir una foto'}</span>
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <h1 className="t-display" style={{ fontSize: 40 }}>¿Qué estudias?_</h1>
          <div className="field"><label htmlFor="a-c">Carrera</label><input id="a-c" className="input" value={f.career} onChange={(e) => setF({ ...f, career: e.target.value })} /></div>
          <div className="field"><label htmlFor="a-cu">Curso</label><div className="pills" role="radiogroup" id="a-cu">{['1.º', '2.º', '3.º', '4.º', 'Máster'].map((c) => <button key={c} type="button" role="radio" aria-checked={f.course === c} aria-pressed={f.course === c} className="pill press" onClick={() => setF({ ...f, course: c })}>{c}</button>)}</div></div>
        </>
      )}
      {step === 3 && (
        <>
          <h1 className="t-display" style={{ fontSize: 40 }}>¿Cuál es tu personalidad?_</h1>
          <p className="t-soft">Te ayuda a encontrar gente parecida (o justo lo contrario). <a href="https://www.16personalities.com/es/test-de-personalidad" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Haz el test</a> si no lo sabes.</p>
          <div className="type-picker">
            {FAMILIES.map((fam) => (
              <div key={fam.id} className={`family bg-${fam.color}`} style={{ padding: 12 }}>
                <p className="t-mono">{fam.name}</p>
                <div className="types">{fam.codes.map((c) => <button key={c} type="button" className="type press" aria-current={f.type === c ? 'true' : undefined} onClick={() => setF({ ...f, type: c })} title={TYPE_NAMES[c]}>{c}</button>)}</div>
              </div>
            ))}
          </div>
          <button type="button" className={`pill press type-ns`} aria-pressed={f.type === 'NS'} onClick={() => setF({ ...f, type: 'NS' })}>No lo sé todavía</button>
        </>
      )}
      {step === 4 && (
        <>
          <h1 className="t-display" style={{ fontSize: 40 }}>Tu carné está listo_</h1>
          <Carne person={{ ...me, career: f.career, course: f.course }} own />
          <p className="t-soft">Enséñalo en cada evento: te llevas un sello y subes de nivel.</p>
        </>
      )}
      </div>
      <div className="alta-cta">{missing && <p className="alta-missing">Falta {missing} para seguir.</p>}<button className={`btn btn--block press btn-next ${step === 4 ? 'btn--lime' : 'btn--primary'}`} onClick={nextStep} disabled={Boolean(missing)}>{step === 4 ? 'Entrar en Start' : 'Seguir'} <Icon name="arrow-right" size={18} /></button></div>
    </div>
  );
}

// Logo de Google para el botón de acceso (según su guía de marca para "Sign in with Google").
const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);
