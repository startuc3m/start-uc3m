import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, Img, Load, Sello, Skeleton, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { TODAY, EVENT_POINT_OPTIONS } from '../data.js';
import { PageTitle } from './comunidad.jsx';

const TABS = [['proximos', '/eventos', 'Próximos'], ['pasados', '/eventos/pasados', 'Pasados']];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
// La foto del evento: una clave de `photos` o una URL (la que suba la Junta).
const coverSrc = (photos, e) => photos[e.cover] ?? e.cover;
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function Eventos({ path }) {
  const { api } = useApp();
  const tab = path.endsWith('/pasados') ? 'pasados' : 'proximos';
  const q = useApi(api, 'events', { tab }, [tab]);
  return (
    <>
      <PageTitle sub="Lo que se viene en Start. Las entradas, en el enlace de cada evento.">Eventos</PageTitle>
      <Load q={q} skeleton={<><div className="skel" style={{ height: 300 }} /><Skeleton h={220} n={2} /></>}>
        {(d) => (
          <div className="two-col two-col--events">
            <div className="col-main">
              <Calendar all={d.all} />
              <nav className="segmented" aria-label="Eventos">
                {TABS.map(([k, href, label]) => <a key={k} href={`#${href}`} aria-current={tab === k ? 'page' : undefined}>{tab === k && <span className="seg-bg" aria-hidden="true" />}<span className="seg-t">{label}</span></a>)}
              </nav>
              {d.events.length === 0 ? (
                <Empty icon="calendar" title="No hay eventos por ahora">En cuanto la Junta publique el siguiente, lo verás aquí.</Empty>
              ) : (
                <ul className="ev-list">
                  {d.events.map((e) => (
                    <li key={e.id} style={{ position: 'relative' }}>
                      <EventCard e={e} />
                      {/* Fuera de la tarjeta (que ya es un enlace) para no anidar enlaces. */}
                      {e.ticketUrl && !e.past && (
                        <a className="btn btn--lime press" href={e.ticketUrl} target="_blank" rel="noreferrer" aria-label={`Entradas de ${e.title} (se abre fuera de la app)`}
                          style={{ position: 'absolute', top: 12, right: 12, minHeight: 36, padding: '0 12px', fontSize: 13, borderRadius: 999, gap: 6 }}>
                          Entradas <Icon name="external-link" size={14} />
                        </a>
                      )}
                      {e.photosUrl && e.past && (
                        <a className="btn btn--soft press" href={e.photosUrl} target="_blank" rel="noreferrer" aria-label={`Fotos de ${e.title} (se abre fuera de la app)`}
                          style={{ position: 'absolute', top: 12, right: 12, minHeight: 36, padding: '0 12px', fontSize: 13, borderRadius: 999, gap: 6 }}>
                          <Icon name="camera" size={14} /> Fotos
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Load>
    </>
  );
}

// Calendario: cada día con plan lleva el sello del evento (su color y su nombre), los
// eventos de varios días se unen con una franja, y al pasar el ratón o tocar un día se
// abre una ventanita con el evento y un enlace para verlo.
function Calendar({ all }) {
  const [y0, m0] = TODAY.split('-').map(Number);
  const [month, setMonth] = useState({ y: y0, m: m0 - 1 });
  const [dir, setDir] = useState('');
  const [pop, setPop] = useState(null); // { e, x, y, up }
  const box = useRef(null);
  const hoverT = useRef(0);
  const byDay = useMemo(() => {
    const map = {};
    for (const e of all) {
      const start = new Date(`${e.date}T12:00:00`), end = new Date(`${e.end ?? e.date}T12:00:00`);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const k = iso(d.getFullYear(), d.getMonth(), d.getDate());
        (map[k] ??= []).push({ e, first: +d === +start, last: +d === +end });
      }
    }
    return map;
  }, [all]);
  useEffect(() => {
    if (!pop) return;
    const out = (ev) => { if (!ev.target.closest?.('.cal-pop, .cal-day')) setPop(null); };
    const key = (ev) => ev.key === 'Escape' && setPop(null);
    addEventListener('pointerdown', out); addEventListener('keydown', key);
    return () => { removeEventListener('pointerdown', out); removeEventListener('keydown', key); };
  }, [pop]);
  const first = new Date(month.y, month.m, 1);
  const offset = (first.getDay() + 6) % 7; // semana que empieza en lunes
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const move = (n) => { setPop(null); setDir(n > 0 ? 'next' : 'prev'); setMonth(({ y, m }) => ({ y: m + n > 11 ? y + 1 : m + n < 0 ? y - 1 : y, m: (m + n + 12) % 12 })); };
  const prefix = iso(month.y, month.m, 1).slice(0, 7);
  const inMonth = all.filter((e) => e.date.startsWith(prefix) || (e.end ?? '').startsWith(prefix));
  const open = (e, el) => {
    const c = box.current.getBoundingClientRect(), r = el.getBoundingClientRect();
    const up = r.top - c.top > c.height * 0.55;
    setPop({ e, x: r.left - c.left + r.width / 2, y: up ? c.bottom - r.top + 6 : r.bottom - c.top + 6, up, w: c.width });
  };
  const W = 272;
  return (
    <section className="cal card" aria-label="Calendario de eventos" ref={box}>
      <div className="cal-h">
        <div className="grow">
          <h2 className="cal-title"><span key={`${month.y}${month.m}`} className={`cal-month cal-month--${dir}`}>{MONTHS[month.m]} <span className="t-soft">{month.y}</span></span></h2>
          <p className="t-soft cal-count">{inMonth.length ? `${inMonth.length} ${inMonth.length === 1 ? 'plan' : 'planes'}` : 'Sin planes este mes'}</p>
        </div>
        <button className="cal-nav press" onClick={() => move(-1)} aria-label="Mes anterior"><Icon name="chevron-left" size={20} /></button>
        <button className="cal-nav press" onClick={() => move(1)} aria-label="Mes siguiente"><Icon name="chevron-right" size={20} /></button>
      </div>
      <div className={`cal-grid cal-grid--${dir}`} key={`${month.y}${month.m}`}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((w) => <span key={w} className="cal-wd" aria-hidden="true">{w}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`x${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = iso(month.y, month.m, i + 1);
          const hit = byDay[key]?.[0];
          const past = key < TODAY;
          const cls = `${past ? 'is-past' : ''} ${key === TODAY ? 'is-today' : ''}`;
          if (!hit) return <span key={key} className={`cal-day ${cls}`}><span className="cal-n num">{i + 1}</span></span>;
          const { e } = hit;
          const col = (i + offset) % 7;
          const bandL = !hit.first && col !== 0, bandR = !hit.last && col !== 6;
          return (
            <button key={key} className={`cal-day has-ev ${cls} ${pop?.e.id === e.id ? 'is-open' : ''} ${bandL ? 'band-l' : ''} ${bandR ? 'band-r' : ''}`}
              style={{ '--c': `var(--${e.stamp.color})` }}
              aria-label={`${i + 1} de ${MONTHS[month.m].toLowerCase()}: ${e.title}`} aria-haspopup="dialog" aria-expanded={pop?.e.id === e.id}
              onClick={(ev) => (pop?.e.id === e.id ? setPop(null) : open(e, ev.currentTarget))}
              onPointerEnter={(ev) => { if (ev.pointerType === 'mouse') { clearTimeout(hoverT.current); const el = ev.currentTarget; hoverT.current = setTimeout(() => open(e, el), 90); } }}
              onPointerLeave={(ev) => { if (ev.pointerType === 'mouse') { clearTimeout(hoverT.current); hoverT.current = setTimeout(() => setPop((p) => (p?.hover === false ? p : null)), 160); } }}>
              <span className="cal-stamp"><span className="num">{i + 1}</span></span>
              {hit.first && <span className="cal-lbl">{e.stamp.label}</span>}
            </button>
          );
        })}
      </div>
      {pop && (
        <div className={`cal-pop ${pop.up ? 'is-up' : ''}`} role="dialog" aria-label={pop.e.title}
          style={{ left: Math.min(Math.max(pop.x - W / 2, 8), pop.w - W - 8), [pop.up ? 'bottom' : 'top']: pop.y, width: W, '--ax': `${pop.x - Math.min(Math.max(pop.x - W / 2, 8), pop.w - W - 8)}px` }}
          onPointerEnter={() => { clearTimeout(hoverT.current); }} onPointerLeave={(ev) => { if (ev.pointerType === 'mouse') hoverT.current = setTimeout(() => setPop(null), 200); }}>
          <PopBody e={pop.e} />
        </div>
      )}
    </section>
  );
}

function PopBody({ e }) {
  const { photos } = useApp();
  return (
    <>
      <a className="pop-cover" href={`#/evento/${e.id}`}><Img src={coverSrc(photos, e)} alt="" /><Sello stamp={e.stamp} size={46} rotate={-10} empty={!e.hasStamp} className="pop-sello" /></a>
      <div className="pop-body">
        <p className="t-mono pop-when">{e.when}</p>
        <a href={`#/evento/${e.id}`} className="pop-title">{e.title}</a>
        <p className="t-soft pop-where"><Icon name="map-pin" size={13} /> {e.where}</p>
        {!e.past && <div className="feed-row" style={{ gap: 8 }}><span className="pop-rel">{e.relative}</span></div>}
        <div className="pop-cta">
          {e.ticketUrl && !e.past && <a className="btn btn--lime press" href={e.ticketUrl} target="_blank" rel="noreferrer">Entradas <Icon name="external-link" size={14} /></a>}
          {e.photosUrl && e.past && <a className="btn btn--soft press" href={e.photosUrl} target="_blank" rel="noreferrer"><Icon name="camera" size={14} /> Fotos</a>}
          <a className="btn btn--soft btn--block press" href={`#/evento/${e.id}`}>Ver evento</a>
        </div>
      </div>
    </>
  );
}

function EventCard({ e }) {
  const { photos } = useApp();
  return (
    <a className="card ev-card press" href={`#/evento/${e.id}`}>
      <span className="cover"><Img src={coverSrc(photos, e)} alt="" />
        <span className="date"><b>{e.day}</b><span>{e.month}</span></span>
      </span>
      <span className="body">
        <span className="ev-tags">{e.membersOnly && <span className="chip bg-lavender">Solo socios</span>}{e.few && <span className="chip bg-yellow">{e.few}</span>}{e.points > 0 && <span className="chip bg-lime num">+{e.points} pts</span>}<span className="t-mono t-soft">{e.kind}</span></span>
        <b className="title">{e.title}</b>
        <span className="t-soft">{e.when} · {e.where}</span>
        <span className="feed-row"><span className="grow t-soft">{e.relative}</span><b className="ev-price">{e.price}</b></span>
      </span>
    </a>
  );
}

// Lo que da asistir: el sello del evento y, si la Junta lo decide, puntos. El equipo de
// Eventos confirma quién vino y 24 h después se reparten solos. La Junta fija los puntos aquí.
function EventPoints({ e, onChange }) {
  const { api, toast } = useApp();
  const set = async (n) => {
    try { const r = await api('event.points', { id: e.id, points: n }); onChange(r.event); toast(n ? `Este evento vale ${n} puntos` : 'Este evento no vale puntos'); }
    catch (err) { toast(err.message); }
  };
  const soft = e.pointsGiven
    ? (e.attended ? 'Asististe: ya los tienes.' : `Se dieron el ${e.pointsAt} a quien asistió.`)
    : `Se confirma quién asiste y se dan 24 h después (${e.pointsAt}).`;
  return (
    <div className="card form" style={{ gap: 12 }}>
      <div className="feed-row" style={{ gap: 14 }}>
        <Sello stamp={e.stamp} size={64} rotate={-8} empty={!e.hasStamp} />
        <span className="grow">
          <b>{e.points > 0 ? `Asistir da ${e.points} puntos y el sello ${e.stamp.label}` : `Asistir da el sello ${e.stamp.label}`}</b>
          <span className="t-soft" style={{ display: 'block', fontSize: 14 }}>{soft}</span>
        </span>
      </div>
      {e.canSetPoints && (
        <div className="pills" role="radiogroup" aria-label="Puntos por asistir (Junta)">
          {EVENT_POINT_OPTIONS.map((v) => <button key={v} type="button" role="radio" aria-checked={e.points === v} aria-pressed={e.points === v} className="pill press" onClick={() => set(v)}>{v ? `+${v}` : 'Sin puntos'}</button>)}
        </div>
      )}
    </div>
  );
}

// Los apuntados (entran por el enlace de entradas, fuera de la app). Solo los ven el
// Eventos, RRHH y la Junta, que marcan quién vino: a esos les llegan el sello y los
// puntos 24 h después del evento.
function Attendees({ e, onChange }) {
  const { api, toast } = useApp();
  const q = useApi(api, 'event.attendees', { id: e.id }, [e.id]);
  const [busy, setBusy] = useState(null);
  const locked = !e.started || e.pointsGiven;
  const toggle = async (p) => {
    if (locked || busy) return;
    setBusy(p.id);
    try {
      const r = await api('event.attendance', { id: e.id, person: p.id, on: !p.confirmed });
      q.setData((d) => ({ ...d, people: r.people }));
      onChange(r.event);
    } catch (err) { toast(err.message); }
    finally { setBusy(null); }
  };
  const confirmed = q.data?.people.filter((p) => p.confirmed).length ?? 0;
  return (
    <section className="form" style={{ gap: 10 }} aria-labelledby={`ap-${e.id}`}>
      <div className="feed-row">
        <h2 id={`ap-${e.id}`} className="t-h grow num" style={{ margin: 0 }}>Apuntados · {e.signupCount}</h2>
        <span className="chip bg-lavender">Solo Eventos, RRHH y Junta</span>
      </div>
      <p className="t-soft" style={{ fontSize: 14, margin: 0 }} aria-live="polite">
        {!e.started ? 'Podrás confirmar la asistencia el día del evento.'
          : e.pointsGiven ? `Asistencia cerrada: los puntos se dieron el ${e.pointsAt}.`
          : <>Marca quién ha venido. Los puntos y el sello se dan el {e.pointsAt}. <b className="num">{confirmed} {confirmed === 1 ? 'confirmado' : 'confirmados'}</b></>}
      </p>
      <Load q={q} skeleton={<Skeleton h={72} n={3} />}>
        {(d) => d.people.length === 0 ? <Empty icon="users" title="Aún no se ha apuntado nadie">Se apuntan con el enlace de entradas.</Empty> : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.people.map((p) => (
              <li key={p.id} className="card feed-row" style={{ padding: 12, gap: 12 }}>
                <Avatar person={p} size={44} />
                <span className="grow" style={{ minWidth: 0 }}>
                  <a href={`#/persona/${p.id}`} style={{ fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</a>
                  <span className="t-soft" style={{ display: 'block', fontSize: 14 }}>{p.career} · {p.course}</span>
                </span>
                <button type="button" className={`btn press ${p.confirmed ? 'btn--lime' : 'btn--soft'}`} style={{ minHeight: 38, padding: '0 14px', fontSize: 14, gap: 6, borderRadius: 999 }}
                  aria-pressed={p.confirmed} aria-label={`Asistió: ${p.name}`} disabled={locked || busy === p.id} onClick={() => toggle(p)}>
                  {p.confirmed && <Icon name="check" size={15} stroke={3} />}Asistió
                </button>
              </li>
            ))}
          </ul>
        )}
      </Load>
    </section>
  );
}

// La Junta pega aquí un enlace externo: la página de las entradas o la carpeta de fotos.
function LinkForm({ e, action, field, label, done = 'Enlace guardado', onChange }) {
  const { api, toast } = useApp();
  const [url, setUrl] = useState(e[field] ?? '');
  const [busy, setBusy] = useState(false);
  const save = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    try { const r = await api(action, { id: e.id, url: url.trim() }); onChange(r.event); toast(done); }
    catch (err) { toast(err.message); }
    finally { setBusy(false); }
  };
  const id = `${field}-${e.id}`;
  return (
    <form className="card form" style={{ gap: 10 }} onSubmit={save}>
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input id={id} className="input" type="url" inputMode="url" placeholder="https://…" value={url} onChange={(ev) => setUrl(ev.target.value)} />
      </div>
      <button type="submit" className="btn btn--soft btn--block press" disabled={busy}>Guardar</button>
    </form>
  );
}

// Miniatura del evento (una sola): la Junta sube otra y sustituye a la actual.
function EventPhoto({ e, onChange }) {
  const { api, photos, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const pick = async (cover) => {
    if (busy || cover === e.cover) return;
    setBusy(true);
    try { const r = await api('event.photo', { id: e.id, cover }); onChange(r.event); toast('Foto cambiada'); }
    catch (err) { toast(err.message); }
    finally { setBusy(false); }
  };
  const upload = (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (file) pick(URL.createObjectURL(file));
  };
  // Una sola miniatura: se ve la actual y subir otra la sustituye.
  return (
    <div className="card form" style={{ gap: 10 }}>
      <b>Miniatura del evento</b>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ display: 'block', position: 'relative', width: 120, aspectRatio: '4 / 3', borderRadius: 12, overflow: 'hidden', background: 'var(--paper-2)', flex: 'none' }}>
          <Img src={photos[e.cover] ?? e.cover} alt={`Miniatura de ${e.title}`} />
        </span>
        <label className="btn btn--soft press" style={{ minHeight: 44, gap: 6, cursor: 'pointer' }}>
          <Icon name="upload" size={16} /> {busy ? 'Subiendo…' : 'Cambiar miniatura'}
          <input type="file" accept="image/*" className="sr-only" onChange={upload} disabled={busy} />
        </label>
      </div>
      <p className="t-soft" style={{ fontSize: 13 }}>Solo hay una: la nueva sustituye a la actual.</p>
    </div>
  );
}

export function Evento({ params }) {
  const { api, photos } = useApp();
  const q = useApi(api, 'event', { id: params.id }, [params.id]);
  return (
    <Load q={q} skeleton={<><div className="skel" style={{ aspectRatio: '16/9' }} /><Skeleton h={48} n={4} /></>}>
      {({ event: e }) => (
        <div className="evento">
          <div className="ev-hero"><Img src={coverSrc(photos, e)} alt={`Foto de ${e.title}`} /><span className="date"><b>{e.day}</b><span>{e.month}</span></span></div>
          <div className="ev-tags">{e.membersOnly && <span className="chip bg-lavender">Solo socios</span>}{e.few && <span className="chip bg-yellow">{e.few}</span>}{e.points > 0 && <span className="chip bg-lime num">+{e.points} pts</span>}<span className="t-mono t-soft">{e.kind}</span></div>
          <h1 className="t-display ev-title">{e.title}_</h1>
          <div className="facts">
            <span className="fact"><Icon name="calendar" className="ico" />{e.when.split(' · ')[0]}</span>
            <span className="fact"><Icon name="timer" className="ico" />{e.time}{e.end ? ' · 3 días' : ''}</span>
            <span className="fact"><Icon name="map-pin" className="ico" />{e.where}</span>
            <span className="fact"><Icon name="euro" className="ico" />{e.price}</span>
          </div>
          <p className="ev-desc">{e.desc}</p>
          {!e.past && (e.ticketUrl ? (
            <div className="form" style={{ gap: 6 }}>
              <a className="btn btn--lime btn--block press" href={e.ticketUrl} target="_blank" rel="noreferrer">Entradas <Icon name="external-link" size={16} /></a>
              <span className="t-soft" style={{ fontSize: 13, textAlign: 'center' }}>Las entradas se compran o reservan fuera de la app.</span>
            </div>
          ) : <p className="t-soft" style={{ fontSize: 14, margin: 0 }}>Aún no hay enlace de entradas.</p>)}
          {e.photosUrl && <a className="btn btn--soft btn--block press" href={e.photosUrl} target="_blank" rel="noreferrer"><Icon name="camera" size={18} /> Ver las fotos</a>}
          {e.canSetPoints && (
            <>
              <EventPhoto e={e} onChange={(ev) => q.setData({ event: ev })} />
              <LinkForm key={`tk${e.id}`} e={e} action="event.link" field="ticketUrl" label="Enlace de las entradas" onChange={(ev) => q.setData({ event: ev })} />
              <LinkForm key={`al${e.id}`} e={e} action="event.album" field="photosUrl" label="Enlace a la carpeta de fotos" onChange={(ev) => q.setData({ event: ev })} />
            </>
          )}
          <EventPoints e={e} onChange={(ev) => q.setData({ event: ev })} />
          {e.canSeeAttendees && <Attendees e={e} onChange={(ev) => q.setData({ event: ev })} />}
        </div>
      )}
    </Load>
  );
}
