import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Load, Logo, Skeleton, useApp } from '../ui/pieces.jsx';
import { back, go, useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';

function Toggle({ on, onChange, label, hint }) {
  return (
    <label className="set-row">
      <span className="grow"><span className="set-label">{label}</span>{hint && <span className="set-hint">{hint}</span>}</span>
      <input type="checkbox" role="switch" className="switch" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

const NOTIF = [['anuncios', 'Anuncios de Start'], ['eventos', 'Eventos y entradas'], ['ofertas', 'Oportunidades nuevas'], ['canales', 'Mensajes en canales'], ['mensajes', 'Mensajes directos']];

export function Ajustes() {
  const { api, me, themePref, setTheme, toast } = useApp();
  const q = useApi(api, 'prefs', {}, []);
  const set = (group, key) => async (value) => {
    q.setData((d) => ({ prefs: { ...d.prefs, [group]: { ...d.prefs[group], [key]: value } } }));
    try { await api('prefs.update', { group, key, value }); } catch (e) { q.reload(); toast(e.message); }
  };
  return (
    <>
      <PageTitle eyebrow="Mi perfil">Ajustes</PageTitle>
      <a className="card set-me press" href="#/perfil/editar">
        <Avatar person={me} size={52} lime />
        <span className="grow"><b>{me.name}</b><span className="t-soft" style={{ display: 'block', fontSize: 14 }}>Editar perfil, foto y enlaces</span></span>
        <Icon name="chevron-right" className="t-soft" />
      </a>
      <Load q={q} skeleton={<Skeleton h={200} n={2} />}>
        {({ prefs }) => (
          <div className="set-groups">
            <section className="set-group" aria-labelledby="s-cuenta">
              <h2 id="s-cuenta" className="set-h">Cuenta</h2>
              <div className="card set-card">
                <a className="set-row press" href="#/socio"><Icon name="badge-check" className="set-ico" /><span className="grow set-label">Membresía</span><span className="t-soft">Socio {me.member?.season}</span><Icon name="chevron-right" className="t-soft" /></a>
                {me.canManage && <a className="set-row press" href="#/admin"><Icon name="shield-check" className="set-ico" /><span className="grow set-label">Administración</span><span className="t-soft">IT</span><Icon name="chevron-right" className="t-soft" /></a>}
              </div>
            </section>
            <section className="set-group" aria-labelledby="s-avisos">
              <h2 id="s-avisos" className="set-h">Notificaciones</h2>
              <div className="card set-card">{NOTIF.map(([k, l]) => <Toggle key={k} label={l} on={prefs.notif[k]} onChange={set('notif', k)} />)}</div>
              <p className="set-foot">Los anuncios importantes de la Junta te llegan siempre también por correo.</p>
            </section>
            <section className="set-group" aria-labelledby="s-priv">
              <h2 id="s-priv" className="set-h">Privacidad</h2>
              <div className="card set-card">
                <Toggle label="Aparecer en Gente" hint="Otros socios pueden encontrarte." on={prefs.privacy.gente} onChange={set('privacy', 'gente')} />
                <Toggle label="Mostrar mi correo en el perfil" on={prefs.privacy.email} onChange={set('privacy', 'email')} />
                <Toggle label="CV para quien publica ofertas" hint="Solo cuando marcas «Me interesa»." on={prefs.privacy.cv} onChange={set('privacy', 'cv')} />
              </div>
            </section>
            <section className="set-group" aria-labelledby="s-tema">
              <h2 id="s-tema" className="set-h">Apariencia</h2>
              <div className="segmented" role="radiogroup" aria-labelledby="s-tema">
                {[['system', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, l]) => (
                  <a key={v} href="#/ajustes" role="radio" aria-checked={themePref === v} aria-current={themePref === v ? 'page' : undefined} onClick={(e) => { e.preventDefault(); setTheme(v); }}>{themePref === v && <span className="seg-bg" aria-hidden="true" />}<span className="seg-t">{l}</span></a>
                ))}
              </div>
            </section>
            <section className="set-group" aria-labelledby="s-ayuda">
              <h2 id="s-ayuda" className="set-h">Ayuda</h2>
              <div className="card set-card">
                <a className="set-row press" href="https://startuc3m.es" target="_blank" rel="noreferrer"><Icon name="globe" className="set-ico" /><span className="grow set-label">startuc3m.es</span><Icon name="external-link" size={16} className="t-soft" /></a>
                <div className="set-row"><Icon name="mail" className="set-ico" /><span className="grow set-label">Escribir a Start</span><span className="t-soft">startuc3m@gmail.com</span></div>
              </div>
            </section>
            <button className="btn btn--ghost btn--block press set-out" onClick={() => go('/acceso', { replace: true })}><Icon name="log-out" size={18} /> Cerrar sesión</button>
            <p className="set-foot" style={{ textAlign: 'center' }}>Start UC3M · Área de socios · Prototipo</p>
          </div>
        )}
      </Load>
    </>
  );
}

const PERKS = [['ticket', 'Venta anticipada de entradas'], ['users', 'Cañas cada mes y cena de Navidad'], ['briefcase', 'Canal de prácticas y empleo'], ['rocket', 'Descuento en Start Camp'], ['message-circle', 'Todos los canales de la comunidad'], ['badge-check', 'Tu carné con sellos y nivel']];

// Membresía (dentro de la app, para quien ya es socio).
export function Socio() {
  const { me } = useApp();
  const m = me.member;
  return (
    <>
      <div className="member-card">
        <Logo className="logo" />
        <span className="chip bg-lime">Activa</span>
        <p className="t-display member-season">Socio {m.season}_</p>
        <p className="member-meta">Válida hasta el {m.until} · Nº {String(me.number).padStart(4, '0')}</p>
      </div>
      <section aria-labelledby="perks">
        <h2 id="perks" className="t-h" style={{ marginBottom: 10 }}>Lo que tienes por ser socio</h2>
        <ul className="perks">{PERKS.map(([i, t]) => <li key={t}><span className="perk-ico"><Icon name={i} size={18} /></span>{t}</li>)}</ul>
      </section>
      <div className="card form">
        <b>Temporada 27/28</b>
        <p className="t-soft">La renovación se abre en junio y conservas tu número de socio.</p>
      </div>
    </>
  );
}

// Hazte socio: desde la pantalla de acceso, para quien aún no lo es. Pago simulado.
export function HazteSocio() {
  const { api, photos, refreshMe, celebrate } = useApp();
  const [plan, setPlan] = useState('curso');
  const [step, setStep] = useState('plan'); // plan → paying → ok
  const pay = async () => {
    setStep('paying');
    await Promise.all([api('member.join', { plan }), new Promise((r) => setTimeout(r, 1100))]);
    await refreshMe();
    setStep('ok');
    navigator.vibrate?.([12, 40, 12]);
    go('/alta/1', { replace: true });
    celebrate({ kind: 'welcome', title: '¡Ya eres socio!', text: 'Pago hecho. Ahora completa tu perfil y tendrás tu carné listo para el próximo evento.' });
  };
  return (
    <div className="hazte">
      <div className="hazte-hero" style={{ backgroundImage: `url(${photos.equipo})` }}>
        <button className="glass-btn press" onClick={() => back('/acceso')} aria-label="Volver"><Icon name="arrow-left" size={22} /></button>
        <div className="hazte-copy">
          <p className="t-mono" style={{ color: 'var(--lime)' }}>Temporada 26/27_</p>
          <h1 className="t-display">Hazte socio_</h1>
          <p>Eventos, comunidad, prácticas y tu carné de Start.</p>
        </div>
      </div>
      <div className="hazte-body">
        <div className="plans" role="radiogroup" aria-label="Elige tu cuota">
          {[['curso', 'Curso 26/27', '15 €', 'Hasta el 31 ago 2027'], ['carrera', 'Toda la carrera', '40 €', 'Hasta que acabes']].map(([k, t, p, n]) => (
            <button key={k} role="radio" aria-checked={plan === k} className={`plan press ${plan === k ? 'is-on' : ''}`} onClick={() => setPlan(k)}>
              <span className="plan-radio" aria-hidden="true" />
              <span className="grow"><b>{t}</b><span className="t-soft">{n}</span></span>
              <b className="plan-price num">{p}</b>
            </button>
          ))}
        </div>
        <p className="t-soft" style={{ fontSize: 13 }}>Precios de ejemplo: la cuota real la fija la Junta.</p>
        <ul className="perks perks--compact">{PERKS.slice(0, 4).map(([i, t]) => <li key={t}><span className="perk-ico"><Icon name={i} size={16} /></span>{t}</li>)}</ul>
        <div className="hazte-cta">
          <button className="btn btn--block btn-apple press" onClick={pay} disabled={step !== 'plan'}>{step === 'paying' ? 'Pagando…' : <>Pagar con <AppleLogo /> Pay</>}</button>
          <button className="btn btn--block btn--ghost press" onClick={pay} disabled={step !== 'plan'}><Icon name="credit-card" size={18} /> Pagar con tarjeta</button>
          <p className="t-soft" style={{ fontSize: 13, textAlign: 'center' }}>Demo: no se cobra nada.</p>
        </div>
      </div>
    </div>
  );
}

export const AppleLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.6c-.02-2.33 1.9-3.45 1.99-3.5-1.08-1.59-2.77-1.8-3.37-1.83-1.43-.15-2.8.84-3.53.84-.73 0-1.85-.82-3.04-.8-1.56.02-3.01.91-3.81 2.31-1.63 2.83-.42 7.01 1.17 9.3.78 1.12 1.7 2.38 2.91 2.33 1.17-.05 1.61-.75 3.02-.75 1.41 0 1.81.75 3.04.73 1.26-.02 2.05-1.14 2.82-2.27.89-1.3 1.25-2.56 1.27-2.63-.03-.01-2.44-.94-2.47-3.73ZM14.05 5.75c.64-.78 1.08-1.86.96-2.94-.93.04-2.05.62-2.72 1.4-.6.69-1.12 1.79-.98 2.85 1.04.08 2.1-.53 2.74-1.31Z" /></svg>
);
