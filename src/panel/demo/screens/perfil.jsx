import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Load, OfferLogo, Sellos, Skeleton, useApp } from '../ui/pieces.jsx';
import { back, useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';
import { FAMILIES, TYPE_NAMES, familyOf } from '../data.js';

export function Perfil() {
  const { api, me, toast, wide } = useApp();
  const offers = useApi(api, 'offers', { tab: 'interesan' }, []);
  const [flipped, setFlipped] = useState(false);
  const lvl = me.level;
  const missing = lvl.next ? lvl.next.from - lvl.count : 0;
  return (
    <>
      <PageTitle eyebrow="Mi perfil" action={wide && <ProfileActions toast={toast} me={me} />}>Así te conoce Start</PageTitle>
      <div className="two-col two-col--profile">
        <div className="col-left">
          <Carne person={me} own animateRing onFlip={() => setFlipped(!flipped)} className={flipped ? 'is-flipped' : ''} />
          {!wide && <ProfileActions toast={toast} me={me} />}
          <section className="card level-card" aria-label="Tu nivel">
            <p className="t-mono t-soft">Nivel {lvl.n}</p>
            <div className="section-h"><h2 style={{ fontSize: 20, fontWeight: 700 }}>{lvl.name}</h2>{lvl.next && <span className="t-soft num">{lvl.count} / {lvl.next.from} sellos</span>}</div>
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lvl.progress * 100)} aria-label="Progreso al siguiente nivel"><i style={{ width: `${lvl.progress * 100}%` }} /></div>
            <p className="t-soft">{lvl.next ? `${missing} ${missing === 1 ? 'sello más' : 'sellos más'} y serás ${lvl.next.name}. El próximo: Start to Invest, el 30 nov.` : 'Has llegado al nivel más alto. Leyenda.'}</p>
          </section>
        </div>
        <div className="col-right">
          <section aria-label="Tus sellos">
            <div className="section-h"><h2 className="t-h">Tus sellos</h2><span className="t-soft num">{me.stampList.length}</span></div>
            <Sellos list={me.stampList} next="30 NOV" />
          </section>
          <section aria-label="Personalidad">
            <p className="t-mono t-soft" style={{ marginBottom: 8 }}>Personalidad</p>
            <a className={`card feed-row press bg-${me.family.color}`} href={`#/mapa/${me.type}`} style={{ padding: 16, border: 0, color: 'var(--ink-fixed)' }}>
              <span className="grow"><span className="t-mono" style={{ display: 'block' }}>{me.family.name}</span><b style={{ fontSize: 18 }}>{me.type} · {TYPE_NAMES[me.type]}</b></span>
              <span style={{ fontWeight: 600 }}>Ver en el mapa</span><Icon name="chevron-right" />
            </a>
          </section>
          <section aria-label="Ofertas que te interesan">
            <div className="section-h" style={{ marginBottom: 10 }}><h2 className="t-h">Te interesan{offers.data ? ` · ${offers.data.offers.length}` : ''}</h2><a className="link" href="#/ofertas/interesan">Ver todas</a></div>
            <Load q={offers} skeleton={<Skeleton h={64} n={2} />}>
              {(d) => d.offers.length === 0 ? <p className="t-soft">Ninguna todavía. <a href="#/ofertas" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Echa un vistazo</a>.</p> : (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {d.offers.map((o) => <li key={o.id}><a className="card feed-row press" href={`#/oferta/${o.id}`} style={{ padding: 12 }}><OfferLogo company={o.company} size={40} /><span className="grow"><b style={{ display: 'block' }}>{o.title}</b><span className="t-soft" style={{ fontSize: 14 }}>{o.company.name} · {o.deadline}</span></span><Icon name="chevron-right" className="t-soft" /></a></li>)}
                </ul>
              )}
            </Load>
          </section>
          {!wide && (
            <section aria-label="Ajustes" className="card settings">
              <a className="press" href="#/perfil/editar"><Icon name="user" /> Editar perfil</a>
              {me.canManage && <a className="press" href="#/admin"><Icon name="shield-check" /> Administración</a>}
              <a className="press" href="#/acceso"><Icon name="log-out" /> Cerrar sesión</a>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function ProfileActions({ me, toast }) {
  return (
    <div className="profile-actions">
      <a className="btn btn--soft press" href="#/perfil/editar"><Icon name="pencil" size={18} /> Editar perfil</a>
      <button className="btn btn--soft press" onClick={async () => {
        const url = `${location.origin}${location.pathname}#/persona/${me.id}`;
        try { if (navigator.share) await navigator.share({ title: 'Mi carné de Start', url }); else { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } } catch {}
      }}><Icon name="share" size={18} /> Compartir carné</button>
    </div>
  );
}

export function Editar() {
  const { api, me, toast, refreshMe } = useApp();
  const [f, setF] = useState({ name: me.name, career: me.career, course: me.course, linkedin: me.linkedin, bio: me.bio, type: me.type });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api('profile.update', f);
      await refreshMe();
      toast('Perfil guardado');
      back('/perfil');
    } catch (e2) {
      const field = /^(\w+):/.exec(e2.message)?.[1]?.toLowerCase();
      setErr({ field: field === 'nombre' ? 'name' : field, message: e2.message });
    } finally { setBusy(false); }
  };
  const fieldErr = (k) => err?.field === k ? { 'aria-invalid': true, 'aria-describedby': `e-${k}` } : {};
  return (
    <>
      <PageTitle eyebrow="Mi perfil">Edita tu perfil</PageTitle>
      <form className="card form" onSubmit={save} noValidate>
        <div className="feed-row" style={{ gap: 16 }}>
          <Avatar person={me} size={72} />
          <div className="grow"><b style={{ display: 'block' }}>Tu foto</b><span className="t-soft">Es lo primero que ve la gente en Comunidad.</span></div>
          <button type="button" className="btn btn--soft press" onClick={() => toast('En la demo no se suben fotos')}><Icon name="camera" size={18} /> Cambiar</button>
        </div>
        <div className="field"><label htmlFor="p-n">Nombre</label><input id="p-n" className="input" value={f.name} onChange={set('name')} autoComplete="name" {...fieldErr('name')} />{err?.field === 'name' && <p id="e-name" className="err">{err.message}</p>}</div>
        <div className="form-row">
          <div className="field"><label htmlFor="p-c">Carrera</label><input id="p-c" className="input" value={f.career} onChange={set('career')} /></div>
          <div className="field"><label htmlFor="p-cu">Curso</label><select id="p-cu" className="input" value={f.course} onChange={set('course')}>{['1.º', '2.º', '3.º', '4.º', '5.º', 'Máster'].map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="field"><label htmlFor="p-l">LinkedIn</label><input id="p-l" className="input" type="url" inputMode="url" value={f.linkedin} onChange={set('linkedin')} {...fieldErr('linkedin')} />{err?.field === 'linkedin' && <p id="e-linkedin" className="err">{err.message}</p>}</div>
        <div className="field"><label htmlFor="p-b">Una frase sobre ti</label><input id="p-b" className="input" value={f.bio} onChange={set('bio')} maxLength={90} /></div>
        <div className="field">
          <label htmlFor="p-t">Personalidad</label>
          <select id="p-t" className="input" value={f.type} onChange={set('type')}>{FAMILIES.map((fam) => <optgroup key={fam.id} label={fam.name}>{fam.codes.map((c) => <option key={c} value={c}>{c} · {TYPE_NAMES[c]}</option>)}</optgroup>)}</select>
          <p className="t-soft" style={{ fontSize: 14 }}>¿No lo sabes? <a href="https://www.16personalities.com/es/test-de-personalidad" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Haz el test (10 min)</a> · Familia: {familyOf(f.type).name}</p>
        </div>
        {err && !['name', 'linkedin'].includes(err.field) && <p className="err" role="alert">{err.message}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost press" onClick={() => back('/perfil')}>Cancelar</button>
          <button className="btn btn--primary press" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </>
  );
}
