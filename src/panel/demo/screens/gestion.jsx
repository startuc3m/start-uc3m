import { useDeferredValue, useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, Load, Sheet, Skeleton, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';

// Gestión de la APP (no de la web). Editar la web (Start Skills, eventos, blog) es cosa
// del gestor de contenidos de la web y va aparte. Aquí solo lo que pasa dentro de la app:
// oportunidades, puntos y personas con su cargo. Reglas de docs/panel-roles.md (PR #87).

// Quién puede hacer qué dentro de la app. Columnas: socio, starter, responsable, IT autorizado, junta.
const MATRIX = [
  ['Usar la app, tener perfil y CV, fichar en eventos', ['✓', '✓', '✓', '✓', '✓']],
  ['Publicar oportunidades y ver a sus interesados', ['', '', '✓', '', '✓']],
  ['Sumar puntos', ['', '', 'Su departamento', '', 'A cualquiera']],
  ['Invitar personas', ['', '', '', '✓', '✓']],
  ['Cambiar tipo, departamento, cargo o acceso', ['', '', '', 'Salvo Junta', '✓']],
  ['Dar o quitar el cargo de Junta', ['', '', '', '', '✓']],
];
const COLS = ['Socio', 'Starter', 'Responsable', 'IT autorizado', 'Junta'];
export const colOf = (me) => (me.kind !== 'starter' ? 0 : me.position === 'junta' ? 4 : me.manage_users && me.department === 'IT' ? 3 : me.position === 'responsable' ? 2 : 1);

export function Gestion() {
  const { me } = useApp();
  const col = colOf(me);
  // En el móvil la tabla no cabe: se desplaza sola para que tu columna quede a la vista.
  const wrap = useRef(null);
  useEffect(() => {
    const w = wrap.current, th = w?.querySelector('thead .is-me');
    if (w && th && w.scrollWidth > w.clientWidth) w.scrollLeft = Math.max(0, th.offsetLeft + th.offsetWidth / 2 - w.clientWidth / 2 - 80);
  }, [col]);
  const actions = [
    me.canPublish && ['plus', 'Publicar una oportunidad', 'Prácticas, proyectos, becas… Te llegan los interesados con su CV.', '#/ofertas/publicar'],
    me.canPublish && ['briefcase', 'Tus oportunidades publicadas', 'Ver interesados, filtrar y contactar.', '#/ofertas/mias'],
    (me.position === 'responsable' || me.position === 'junta') && ['sparkles', 'Sumar puntos', me.position === 'junta' ? 'A cualquier Starter, para el Starter del mes.' : `A la gente de ${me.department}, para el Starter del mes.`, '#/ranking'],
    me.canManage && ['users', 'Personas e invitaciones', me.position === 'junta' ? 'Invitar, cambiar cargos y quitar acceso.' : 'Invitar, cambiar cargos y quitar acceso (salvo a la Junta).', '#/admin'],
  ].filter(Boolean);
  const { api } = useApp();
  const sum = useApi(api, 'gestion.summary', {}, []);
  const st = sum.data;
  const stats = st ? [
    st.people && ['users', st.people.total, 'personas en la app', `${st.people.starters} del equipo · ${st.people.pending} invitación pendiente`, '#/admin'],
    st.offers && ['briefcase', st.offers.published, st.offers.published === 1 ? 'oportunidad publicada' : 'oportunidades publicadas', `${st.offers.interested} interesados · ${st.offers.fresh} nuevos`, '#/ofertas/mias'],
    st.points && ['sparkles', st.points.team, 'Starters a los que puedes dar puntos', st.points.given ? `Has dado ${st.points.given} puntos este mes` : `De ${st.points.scope}`, '#/ranking'],
  ].filter(Boolean) : [];
  return (
    <>
      <PageTitle eyebrow="Mi perfil" sub="Lo que puedes hacer dentro de la app con tu cargo.">Gestión</PageTitle>
      {stats.length > 0 && (
        <ul className="gest-stats">
          {stats.map(([icon, n, label, sub, href]) => <li key={label}><a className="card gest-stat press" href={href}><span className="gest-ico"><Icon name={icon} size={20} /></span><b className="num">{n}</b><span className="gest-stat-l">{label}</span><span className="t-soft">{sub}</span></a></li>)}
        </ul>
      )}
      <div className="card gest-me">
        <Avatar person={me} size={52} lime />
        <span className="grow"><span className="t-mono t-soft">Tu cargo</span><b>{me.positionLabel}</b>{me.manage_users && me.position !== 'junta' && <span className="t-soft" style={{ fontSize: 13 }}>Con permiso para gestionar personas</span>}</span>
      </div>
      <section className="home-sec" aria-label="Lo que puedes hacer">
        <h2 className="t-h home-h">Lo que puedes hacer</h2>
        {actions.length === 0 ? (
          <p className="card form t-soft">Con tu cargo no hay nada que gestionar: usas la app como todo el mundo. Si necesitas algún permiso, pídeselo a IT o a la Junta.</p>
        ) : (
          <ul className="gest-actions">
            {actions.map(([icon, t, sub, href]) => (
              <li key={t}><a className="card gest-action press" href={href}><span className="gest-ico"><Icon name={icon} size={20} /></span><span className="grow"><b>{t}</b><span className="t-soft">{sub}</span></span><Icon name="chevron-right" className="t-soft" /></a></li>
            ))}
          </ul>
        )}
      </section>
      <section className="home-sec" aria-labelledby="matrix-t">
        <h2 id="matrix-t" className="t-h home-h">Quién puede hacer qué</h2>
        <div className="matrix-wrap card" ref={wrap}>
          <table className="matrix">
            <thead><tr><th scope="col"><span className="sr-only">Acción</span></th>{COLS.map((c, i) => <th key={c} scope="col" className={i === col ? 'is-me' : ''}>{c}{i === col && <span className="matrix-you">Tú</span>}</th>)}</tr></thead>
            <tbody>
              {MATRIX.map(([label, cells]) => (
                <tr key={label}><th scope="row">{label}</th>{cells.map((v, i) => <td key={i} className={i === col ? 'is-me' : ''}>{v === '✓' ? <Icon name="check" size={16} stroke={3} title="Sí" /> : v ? <span className="matrix-note">{v}</span> : <span className="matrix-no" aria-label="No">·</span>}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="set-foot">Nadie puede cambiarse sus propios permisos, y ser Responsable no da permiso para gestionar personas. Editar la web (Start Skills, eventos, blog) va aparte, en el gestor de contenidos de la web.</p>
      </section>
    </>
  );
}

// Personas e invitaciones (IT autorizado y Junta).
export function Admin() {
  const [tab, setTab] = useState('personas');
  return (
    <>
      <PageTitle eyebrow="Gestión" sub="Quién está en la app, con qué cargo, y a quién invitar.">Personas</PageTitle>
      <div className="segmented" role="tablist">
        {[['personas', 'Personas'], ['invitar', 'Invitar']].map(([k, l]) => <a key={k} href="#/admin" role="tab" aria-selected={tab === k} aria-current={tab === k ? 'page' : undefined} onClick={(e) => { e.preventDefault(); setTab(k); }}>{tab === k && <span className="seg-bg" aria-hidden="true" />}<span className="seg-t">{l}</span></a>)}
      </div>
      {tab === 'personas' ? <Personas /> : <Invitar />}
    </>
  );
}

function Personas() {
  const { api } = useApp();
  const q = useApi(api, 'members', {}, []);
  const [text, setText] = useState('');
  const needle = useDeferredValue(text).toLowerCase();
  const [edit, setEdit] = useState(null);
  return (
    <Load q={q} skeleton={<Skeleton h={64} n={6} />}>
      {(d) => {
        const list = d.members.filter((x) => !needle || `${x.name} ${x.positionLabel}`.toLowerCase().includes(needle));
        return (
          <>
            <label className="search"><Icon name="search" /><span className="sr-only">Buscar</span><input type="search" placeholder="Nombre, cargo o departamento" value={text} onChange={(e) => setText(e.target.value)} /></label>
            {list.length === 0 ? <Empty icon="search" title="Nadie coincide">Prueba con otro nombre.</Empty> : (
              <ul className="card members">
                {list.map((x) => (
                  <li key={x.id}>
                    <button className="member press" onClick={() => setEdit(x)}>
                      <Avatar person={x} size={42} />
                      <span className="grow"><b>{x.name}</b><span className="t-soft">{x.positionLabel}{x.manage_users && x.position !== 'junta' ? ' · gestiona personas' : ''}</span></span>
                      {!x.active && <span className="state state--danger">Sin acceso</span>}
                      {x.editable ? <Icon name="chevron-right" className="t-soft" /> : <Icon name="lock" size={16} className="t-soft" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <EditMember x={edit} d={d} onClose={() => setEdit(null)} onSaved={q.reload} />
          </>
        );
      }}
    </Load>
  );
}

function EditMember({ x, d, onClose, onSaved }) {
  const { api, toast, refreshMe } = useApp();
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const cur = x && (f?.id === x.id ? f : { id: x.id, kind: x.kind, department: x.department ?? 'IT', position: x.position, active: x.active });
  const set = (patch) => { setErr(''); setF({ ...cur, ...patch }); };
  const save = async () => {
    setBusy(true); setErr('');
    try {
      await api('member.change', cur);
      toast(`Guardado: ${x.name.split(' ')[0]}`);
      onClose(); onSaved(); refreshMe();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Sheet open={Boolean(x)} onClose={onClose} title={x ? x.name : ''}>
      {x && (!x.editable ? (
        <p className="card form t-soft"><Icon name="lock" size={16} /> {x.why}.</p>
      ) : (
        <div className="acceso-form">
          <div className="field"><label>Tipo</label>
            <div className="pills" role="radiogroup">{[['socio', 'Socio'], ['starter', 'Starter (equipo)']].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={cur.kind === k} aria-pressed={cur.kind === k} className="pill press" onClick={() => set({ kind: k, ...(k === 'socio' ? { position: 'miembro' } : {}) })}>{l}</button>)}</div>
          </div>
          {cur.kind === 'starter' && (
            <>
              <div className="field"><label htmlFor="m-dep">Departamento</label>
                <select id="m-dep" className="input" value={cur.department} onChange={(e) => set({ department: e.target.value })}>{d.departments.map((dep) => <option key={dep}>{dep}</option>)}</select>
              </div>
              <div className="field"><label>Cargo</label>
                <div className="pills" role="radiogroup">
                  {[['miembro', 'Miembro'], ['responsable', 'Responsable'], ['junta', 'Junta']].map(([k, l]) => (
                    <button key={k} type="button" role="radio" aria-checked={cur.position === k} aria-pressed={cur.position === k} className="pill press" disabled={k === 'junta' && !d.isJunta} onClick={() => set({ position: k })}>{l}</button>
                  ))}
                </div>
                {!d.isJunta && <p className="t-soft" style={{ fontSize: 13 }}>Solo la Junta da el cargo de Junta.</p>}
              </div>
            </>
          )}
          <label className="set-row" style={{ padding: '4px 0' }}><span className="grow"><span className="set-label">Acceso a la app</span><span className="set-hint">Si lo quitas, no puede entrar; no se borra nada.</span></span><input type="checkbox" role="switch" className="switch" checked={cur.active} onChange={(e) => set({ active: e.target.checked })} /></label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn btn--primary btn--block press" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      ))}
    </Sheet>
  );
}

function Invitar() {
  const { toast } = useApp();
  const [text, setText] = useState('Nora Prieto <nora.prieto@alumnos.uc3m.es>\nivan.soler@alumnos.uc3m.es\ncorreo-mal');
  const rows = text.split(/\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*)<(.+)>$/);
    const email = (m ? m[2] : l).trim();
    return { line: l, name: m ? m[1].trim() : '', email, ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) };
  });
  const ok = rows.filter((r) => r.ok).length;
  return (
    <div className="two-col">
      <div className="col-main">
        <div className="card form">
          <div className="field"><label htmlFor="inv">Pega correos, uno por línea (hasta 100)</label><textarea id="inv" className="input" rows={6} value={text} onChange={(e) => setText(e.target.value)} /></div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((r, i) => <li key={i} className="feed-row" style={{ fontSize: 15 }}><Icon name={r.ok ? 'check' : 'x'} size={16} className={r.ok ? '' : 'err'} /><span className="grow">{r.name && <b>{r.name} · </b>}{r.email}</span>{!r.ok && <span className="err" style={{ fontSize: 14 }}>Correo inválido</span>}</li>)}
          </ul>
          <p className="t-soft" style={{ fontSize: 13 }}>Entran como socios. El cargo y el departamento se cambian después, en Personas.</p>
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
  );
}
