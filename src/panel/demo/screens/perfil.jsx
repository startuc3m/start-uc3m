import { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Load, OfferLogo, Sellos, Skeleton, useApp } from '../ui/pieces.jsx';
import { back, useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';
import { FAMILIES, TYPE_NAMES, familyOf } from '../data.js';

export function Perfil() {
  const { api, me, toast, wide } = useApp();
  const offers = useApi(api, 'offers', { tab: 'interesan' }, []);
  const lvl = me.level;
  const missing = lvl.next ? lvl.next.from - lvl.count : 0;
  return (
    <>
      <PageTitle eyebrow="Mi perfil" action={wide && <ProfileActions toast={toast} me={me} />}>Así te conoce Start</PageTitle>
      <div className="two-col two-col--profile">
        <div className="col-left">
          <Carne person={me} own animateRing />
          {!wide && <ProfileActions toast={toast} me={me} />}
          <section className="card level-card" aria-label="Tu nivel">
            <p className="t-mono t-soft">Nivel {lvl.n}</p>
            <div className="section-h"><h2 style={{ fontSize: 20, fontWeight: 700 }}>{lvl.name}</h2>{lvl.next && <span className="t-soft num">{lvl.count} / {lvl.next.from} sellos</span>}</div>
            <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lvl.progress * 100)} aria-label="Progreso al siguiente nivel"><i style={{ width: `${lvl.progress * 100}%` }} /></div>
            <p className="t-soft">{lvl.next ? `${missing} ${missing === 1 ? 'sello más' : 'sellos más'} y serás ${lvl.next.name}. El próximo: Start to Invest, el 30 nov.` : 'Has llegado al nivel más alto. Leyenda.'}</p>
          </section>
          <CvCard />
        </div>
        <div className="col-right">
          <Gestion me={me} />
          <section aria-label="Tus sellos">
            <div className="section-h"><h2 className="t-h">Tus sellos · <span className="num">{me.stampList.length}</span></h2><a className="link" href="#/eventos">Próximo: Start to Invest</a></div>
            <Sellos list={me.stampList} next="30 NOV" />
          </section>
          <section aria-label="Personalidad">
            <p className="t-mono t-soft" style={{ marginBottom: 8 }}>Personalidad</p>
            <a className={`card feed-row press bg-${me.family.color}`} href={`#/mapa/${me.type}`} style={{ padding: 16, border: 0, color: 'var(--ink-fixed)' }}>
              <span className="grow"><span className="t-mono" style={{ display: 'block' }}>{me.family.name}</span><b style={{ fontSize: 18 }}>{me.type} · {TYPE_NAMES[me.type]}</b></span>
              <span style={{ fontWeight: 600 }}>Ver en el mapa</span><Icon name="chevron-right" />
            </a>
            <p className="t-soft" style={{ fontSize: 14, marginTop: 8 }}>
              <a href="#/perfil/editar" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Cambiar personalidad</a> · ¿No la sabes? <a href="https://www.16personalities.com/es/test-de-personalidad" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Haz el test de 16personalities</a>
            </p>
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
          <Enlaces me={me} />
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
  const [f, setF] = useState({ name: me.name, career: me.career, course: me.course, linkedin: me.linkedin, bio: me.bio, type: me.type, instagram: me.links?.instagram ?? '', web: me.links?.web ?? '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const { instagram, web, ...rest } = f;
      const handle = /linkedin\.com\/in\/([^/?#]+)/.exec(f.linkedin)?.[1] ?? me.links?.linkedin;
      await api('profile.update', { ...rest, links: { ...me.links, linkedin: handle, instagram: instagram.replace(/^@/, '').trim(), web: web.trim() } });
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
        <div className="form-row">
          <div className="field"><label htmlFor="p-ig">Instagram</label><input id="p-ig" className="input" value={f.instagram} onChange={set('instagram')} placeholder="@usuario" autoCapitalize="off" /></div>
          <div className="field"><label htmlFor="p-w">Web</label><input id="p-w" className="input" value={f.web} onChange={set('web')} placeholder="tuweb.com" inputMode="url" autoCapitalize="off" /></div>
        </div>
        <div className="field"><label htmlFor="p-b">Una frase sobre ti</label><input id="p-b" className="input" value={f.bio} onChange={set('bio')} maxLength={90} /></div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: 6 }}>Personalidad</legend>
          <p className="t-soft" style={{ fontSize: 14 }}>Toca tu tipo. ¿No lo sabes? <a href="https://www.16personalities.com/es/test-de-personalidad" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Haz el test de 16personalities (10 min)</a>{f.type && <> · Familia: {familyOf(f.type).name}</>}</p>
          <div className="type-picker">
            {FAMILIES.map((fam) => (
              <div key={fam.id} className={`family bg-${fam.color}`} style={{ padding: 12 }}>
                <p className="t-mono">{fam.name}</p>
                <div className="types">{fam.codes.map((c) => <button key={c} type="button" className="type press" aria-pressed={f.type === c} aria-current={f.type === c ? 'true' : undefined} onClick={() => setF({ ...f, type: c })} title={TYPE_NAMES[c]}>{c}</button>)}</div>
              </div>
            ))}
          </div>
        </fieldset>
        {err && !['name', 'linkedin'].includes(err.field) && <p className="err" role="alert">{err.message}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost press" onClick={() => back('/perfil')}>Cancelar</button>
          <button className="btn btn--primary press" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </>
  );
}

// Entrada a Gestión: solo si tu cargo te deja gestionar algo dentro de la app.
function Gestion({ me }) {
  const n = [me.canPublish, me.position === 'responsable' || me.position === 'junta'].filter(Boolean).length;
  if (!n) return null;
  return (
    <a className="card gest-entry press" href="#/gestion">
      <span className="gest-ico"><Icon name="shield-check" size={20} /></span>
      <span className="grow"><b>Gestión</b><span className="t-soft">{me.positionLabel} · {[me.canPublish && 'oportunidades', (me.position === 'responsable' || me.position === 'junta') && 'puntos'].filter(Boolean).join(', ')}</span></span>
      <Icon name="chevron-right" className="t-soft" />
    </a>
  );
}

// Tus enlaces: salen en tu perfil y viajan con tu QR (quien lo escanea se guarda tu contacto).
export const LINKS = [
  ['linkedin', 'LinkedIn', 'linkedin', (v) => `https://www.linkedin.com/in/${v}`, (v) => `in/${v}`],
  ['instagram', 'Instagram', 'instagram', (v) => `https://instagram.com/${v}`, (v) => `@${v}`],
  ['email', 'Correo', 'mail', (v) => `mailto:${v}`, (v) => v],
  ['web', 'Web', 'globe', (v) => (v.startsWith('http') ? v : `https://${v}`), (v) => v.replace(/^https?:\/\//, '')],
];
function Enlaces({ me }) {
  const set = LINKS.filter(([k]) => me.links?.[k]);
  return (
    <section aria-labelledby="links-t">
      <div className="section-h" style={{ marginBottom: 4 }}><h2 id="links-t" className="t-h">Tus enlaces</h2><a className="link" href="#/perfil/editar">Editar</a></div>
      <p className="t-soft" style={{ fontSize: 14, marginBottom: 10 }}>Van también en tu QR: quien lo escanea se guarda tu contacto.</p>
      <ul className="card links">
        {set.map(([k, label, icon, href, show]) => (
          <li key={k}><a className="link-row press" href={href(me.links[k])} target="_blank" rel="noreferrer"><Icon name={icon} className="set-ico" /><span className="grow"><span className="t-soft" style={{ display: 'block', fontSize: 13 }}>{label}</span><span className="link-val">{show(me.links[k])}</span></span><Icon name="external-link" size={16} className="t-soft" /></a></li>
        ))}
        {set.length < LINKS.length && <li><a className="link-row link-row--add press" href="#/perfil/editar"><Icon name="plus" className="set-ico" /><span className="grow">Añadir {LINKS.filter(([k]) => !me.links?.[k]).map(([, l]) => l.toLowerCase()).join(' o ')}</span></a></li>}
      </ul>
    </section>
  );
}

// Tu CV: privado. Solo lo ve quien publica una oferta a la que te apuntas.
function CvCard() {
  const { api, me, refreshMe, toast } = useApp();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    if (file.type && file.type !== 'application/pdf') return toast('Sube el CV en PDF');
    setBusy(true);
    await api('cv.upload', { name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` });
    await refreshMe(); setBusy(false); toast('CV guardado');
  };
  return (
    <section className="card cv-card" aria-labelledby="cv-t">
      <div className="section-h">
        <h2 id="cv-t" className="t-h">Tu CV</h2>
        <span className="cv-private"><Icon name="lock" size={13} /> Privado</span>
      </div>
      {me.cv ? (
        <div className="cv-file">
          <span className="cv-ico"><Icon name="file-text" size={22} /></span>
          <span className="grow"><b>{me.cv.name}</b><span className="t-soft">{me.cv.size} · actualizado {me.cv.updated}</span></span>
          <button className="btn btn--soft btn--icon press" aria-label="Cambiar CV" onClick={() => input.current?.click()} disabled={busy}><Icon name="upload" size={18} /></button>
          <button className="btn btn--soft btn--icon press" aria-label="Quitar CV" onClick={async () => { await api('cv.remove'); await refreshMe(); toast('CV quitado'); }}><Icon name="trash" size={18} /></button>
        </div>
      ) : (
        <button className="cv-drop press" onClick={() => input.current?.click()} disabled={busy}>
          <Icon name="upload" size={22} /><b>{busy ? 'Subiendo…' : 'Sube tu CV en PDF'}</b><span className="t-soft">Hasta 5 MB</span>
        </button>
      )}
      <p className="t-soft" style={{ fontSize: 14 }}>No es público. Cuando marcas «Me interesa» en una oferta, quien la publica puede verlo para filtrar y escribirte.</p>
      <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    </section>
  );
}
