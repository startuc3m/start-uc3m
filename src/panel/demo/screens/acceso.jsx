import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Logo, Sello, useApp } from '../ui/pieces.jsx';
import { go } from '../router.js';
import { FAMILIES, STAMPS, TYPE_NAMES } from '../data.js';
import { PageTitle } from './comunidad.jsx';

export function Acceso() {
  const [email, setEmail] = useState('nora.prieto@alumnos.uc3m.es');
  const [err, setErr] = useState('');
  const enter = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('Escribe el correo con el que te invitaron.'); return; }
    go('/alta/1');
  };
  return (
    <div className="acceso">
      <div className="acceso-brand">
        <Logo className="logo" />
        <div className="acceso-copy">
          <p className="t-mono only-desk" style={{ color: 'var(--lavender)' }}>Área de socios_</p>
          <h1 className="t-display">Tu carné de Start te espera_</h1>
          <p>Nora, te han invitado. Activa tu carné, ficha en los eventos y colecciona sellos.</p>
        </div>
        <div className="acceso-scene" aria-hidden="true">
          <Sello stamp={STAMPS.build} size={86} rotate={14} className="s1" />
          <Sello stamp={STAMPS.canas} size={86} rotate={-10} className="s2" />
          <div className="mini-carne">
            <div className="top"><Logo className="logo" /><span className="t-mono">26/27</span></div>
            <div className="mid"><span className="ph"><Icon name="camera" size={20} /></span><span><b>Nora Prieto</b><em className="num">Nº 0057</em></span></div>
            <span className="t-mono" style={{ color: 'var(--lavender)' }}>Te está esperando</span>
          </div>
          <span className="t-marker note">¡este es el tuyo!</span>
        </div>
      </div>
      <form className="acceso-form" onSubmit={enter} noValidate>
        <h2 className="t-display only-desk" style={{ fontSize: 40 }}>Entra en Start_</h2>
        <p className="only-desk card" style={{ background: 'var(--lime)', color: 'var(--ink-fixed)', border: 0, padding: 14 }}><b>Tienes una invitación de Start.</b><br />Entra con tu correo para activar tu carné y completar tu perfil.</p>
        <button type="button" className="btn btn--ghost btn--block press" onClick={() => go('/alta/1')}>Continuar con Google</button>
        <div className="field">
          <label htmlFor="acc-mail">Correo electrónico</label>
          <input id="acc-mail" className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} aria-invalid={Boolean(err)} aria-describedby={err ? 'acc-err' : undefined} />
          {err && <p id="acc-err" className="err">{err}</p>}
        </div>
        <button className="btn btn--primary btn--block press" style={{ justifyContent: 'space-between' }}>Seguir con mi correo <span aria-hidden="true">→</span></button>
        <a href="#/acceso" className="t-soft" style={{ fontSize: 14 }} onClick={(e) => e.preventDefault()}>¿Has olvidado la contraseña?</a>
      </form>
    </div>
  );
}

const STEPS = ['Tu foto', 'Qué estudias', 'Tu personalidad', 'Listo'];
export function Alta({ params }) {
  const { api, me, refreshMe, celebrate } = useApp();
  const step = Math.min(Math.max(Number(params.paso) || 1, 1), 4);
  const [f, setF] = useState({ career: me.career, course: me.course, type: me.type });
  const nextStep = async () => {
    if (step === 3) await api('profile.update', { ...f, name: me.name });
    if (step < 4) return go(`/alta/${step + 1}`, { replace: true });
    await api('onboarding.done');
    await refreshMe();
    go('/comunidad', { replace: true });
    celebrate({ kind: 'welcome', title: '¡Bienvenido a Start!', text: 'Tu carné ya está activo. Enséñalo en el próximo evento y consigue tu primer sello.' });
  };
  return (
    <div className="alta">
      <div className="alta-top">
        <div className="steps" aria-label={`Paso ${step} de 4`}>{STEPS.map((s, i) => <i key={s} className={i < step ? 'on' : ''} />)}</div>
        <button className="t-soft press" onClick={() => go('/comunidad', { replace: true })}>Lo hago luego</button>
      </div>
      <p className="t-mono" style={{ color: 'var(--brand-text)' }}>Paso {step} de 4</p>
      {step === 1 && (
        <>
          <h1 className="t-display" style={{ fontSize: 40 }}>Ponle cara a tu carné_</h1>
          <p className="t-soft">Es lo primero que verá la gente en Comunidad.</p>
          <button className="photo-drop press" onClick={nextStep}><Avatar person={me} size={120} /><span><Icon name="camera" size={18} /> Hacer o subir una foto</span></button>
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
        </>
      )}
      {step === 4 && (
        <>
          <h1 className="t-display" style={{ fontSize: 40 }}>Tu carné está listo_</h1>
          <Carne person={{ ...me, ...f }} own />
          <p className="t-soft">Enséñalo en cada evento: te llevas un sello y subes de nivel.</p>
        </>
      )}
      <div className="alta-cta"><button className="btn btn--primary btn--block press" onClick={nextStep}>{step === 4 ? 'Entrar en Start' : 'Seguir'}</button></div>
    </div>
  );
}

export function Admin() {
  const { toast } = useApp();
  const [text, setText] = useState('Nora Prieto <nora.prieto@alumnos.uc3m.es>\nivan.soler@alumnos.uc3m.es\ncorreo-mal');
  const rows = text.split(/\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*)<(.+)>$/);
    const email = (m ? m[2] : l).trim();
    return { line: l, name: m ? m[1].trim() : '', email, ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) };
  });
  const ok = rows.filter((r) => r.ok).length;
  return (
    <>
      <PageTitle eyebrow="Administración">Invitar a Start</PageTitle>
      <div className="two-col">
        <div className="col-main">
          <div className="card form">
            <div className="field"><label htmlFor="inv">Pega correos, uno por línea</label><textarea id="inv" className="input" rows={6} value={text} onChange={(e) => setText(e.target.value)} /></div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.map((r, i) => <li key={i} className="feed-row" style={{ fontSize: 15 }}><Icon name={r.ok ? 'check' : 'x'} size={16} className={r.ok ? '' : 'err'} /><span className="grow">{r.name && <b>{r.name} · </b>}{r.email}</span>{!r.ok && <span className="err" style={{ fontSize: 14 }}>Correo inválido</span>}</li>)}
            </ul>
            <button className="btn btn--primary press" disabled={!ok} onClick={() => toast(`${ok} invitaciones enviadas (demo)`)}><Icon name="mail" size={18} /> Enviar {ok} {ok === 1 ? 'invitación' : 'invitaciones'}</button>
          </div>
        </div>
        <aside className="col-side">
          <div className="card form">
            <p className="t-h">Últimas invitaciones</p>
            {[['Nora Prieto', 'Aceptada', 'ok'], ['Iván Soler', 'Aceptada', 'ok'], ['Elena Vidal', 'Pendiente', 'warn'], ['Mario Ortega', 'Rebotó', 'danger']].map(([n, s, c]) => (
              <div key={n} className="feed-row"><span className="grow">{n}</span><span className={`state state--${c}`}>{s}</span></div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
