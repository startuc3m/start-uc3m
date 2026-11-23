import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Empty, FakeQr, Img, Load, Sello, Skeleton, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { TODAY, EVENT_POINT_OPTIONS } from '../data.js';
import { PageTitle } from './comunidad.jsx';

const TABS = [['proximos', '/eventos', 'Próximos'], ['pasados', '/eventos/pasados', 'Pasados']];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function Eventos({ path }) {
  const { api } = useApp();
  const tab = path.endsWith('/pasados') ? 'pasados' : 'proximos';
  const q = useApi(api, 'events', { tab }, [tab]);
  return (
    <>
      <PageTitle sub="Lo que se viene en Start. En cada evento, escanea su QR para llevarte el sello (y puntos, si vale).">Eventos</PageTitle>
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
      <a className="pop-cover" href={`#/evento/${e.id}`}><Img src={photos[e.cover]} alt="" /><Sello stamp={e.stamp} size={46} rotate={-10} empty={!e.hasStamp} className="pop-sello" /></a>
      <div className="pop-body">
        <p className="t-mono pop-when">{e.when}</p>
        <a href={`#/evento/${e.id}`} className="pop-title">{e.title}</a>
        <p className="t-soft pop-where"><Icon name="map-pin" size={13} /> {e.where}</p>
        {!e.past && <div className="feed-row" style={{ gap: 8 }}><span className="pop-rel">{e.relative}</span></div>}
        <div className="pop-cta">
          {e.ticketUrl && !e.past && <a className="btn btn--lime press" href={e.ticketUrl} target="_blank" rel="noreferrer">Entradas <Icon name="external-link" size={14} /></a>}
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
      <span className="cover"><Img src={photos[e.cover]} alt="" />
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

// Lo que da el QR del evento. Todos ven cuántos puntos vale; la Junta lo cambia aquí
// y tiene el QR para proyectarlo en la puerta.
function EventPoints({ e, onChange }) {
  const { api, toast } = useApp();
  const set = async (n) => {
    try { const r = await api('event.points', { id: e.id, points: n }); onChange(r.event); toast(n ? `Este evento vale ${n} puntos` : 'Este evento no vale puntos'); }
    catch (err) { toast(err.message); }
  };
  return (
    <div className="card form" style={{ gap: 10 }}>
      <span className="feed-row"><Icon name="sparkles" size={18} /><span className="grow"><b>{e.points > 0 ? `El QR de este evento da ${e.points} puntos` : 'El QR de este evento da solo el sello'}</b><span className="t-soft" style={{ display: 'block', fontSize: 13 }}>{e.points > 0 ? 'Escanéalo en la puerta: te llevas el sello y los puntos, una vez.' : 'No suma puntos al ranking.'}</span></span></span>
      {e.canSetPoints && (
        <>
          <div className="pills" role="radiogroup" aria-label="Puntos del evento (Junta)">
            {EVENT_POINT_OPTIONS.map((v) => <button key={v} type="button" role="radio" aria-checked={e.points === v} aria-pressed={e.points === v} className="pill press" onClick={() => set(v)}>{v ? `+${v}` : 'Sin puntos'}</button>)}
          </div>
          <div style={{ width: 200, maxWidth: '70%', margin: '0 auto', padding: 12, background: '#fff', color: '#13133d', borderRadius: 16 }}><FakeQr seed={[...e.id].reduce((a, c) => a + c.charCodeAt(0), 7)} label={`QR del evento ${e.title}`} /></div>
          <p className="t-soft num" style={{ textAlign: 'center', fontSize: 13, margin: 0 }}>Proyéctalo en la puerta · {e.scanCount} {e.scanCount === 1 ? 'escaneo' : 'escaneos'}</p>
          {e.qrPath && <a className="btn btn--lime btn--block press" href={`#${e.qrPath}`}>Probar escaneo (demo)</a>}
        </>
      )}
    </div>
  );
}

// La Junta pega aquí la página externa donde se compran o reservan las entradas.
function TicketLink({ e, onChange }) {
  const { api, toast } = useApp();
  const [url, setUrl] = useState(e.ticketUrl ?? '');
  const [busy, setBusy] = useState(false);
  const save = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    try { const r = await api('event.link', { id: e.id, url: url.trim() }); onChange(r.event); toast('Enlace guardado'); }
    catch (err) { toast(err.message); }
    finally { setBusy(false); }
  };
  return (
    <form className="card form" style={{ gap: 10 }} onSubmit={save}>
      <div className="field">
        <label htmlFor={`tk-${e.id}`}>Enlace de las entradas</label>
        <input id={`tk-${e.id}`} className="input" type="url" inputMode="url" placeholder="https://…" value={url} onChange={(ev) => setUrl(ev.target.value)} />
      </div>
      <button type="submit" className="btn btn--soft btn--block press" disabled={busy}>Guardar</button>
    </form>
  );
}

export function Evento({ params }) {
  const { api, photos } = useApp();
  const q = useApi(api, 'event', { id: params.id }, [params.id]);
  return (
    <Load q={q} skeleton={<><div className="skel" style={{ aspectRatio: '16/9' }} /><Skeleton h={48} n={4} /></>}>
      {({ event: e }) => (
        <div className="evento">
          <div className="ev-hero"><Img src={photos[e.cover]} alt={`Foto de ${e.title}`} /><span className="date"><b>{e.day}</b><span>{e.month}</span></span></div>
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
          {e.canSetPoints && <TicketLink e={e} onChange={(ev) => q.setData({ event: ev })} />}
          <EventPoints e={e} onChange={(ev) => q.setData({ event: ev })} />
          <div className="card ev-stamp">
            <Sello stamp={e.stamp} size={64} rotate={-8} empty={!e.hasStamp} />
            <span><b>{e.hasStamp ? `Ya tienes el sello ${e.stamp.label}` : `Sello ${e.stamp.label}`}</b><span className="t-soft" style={{ display: 'block', fontSize: 14 }}>{e.hasStamp ? 'Está en tu perfil.' : 'Se consigue escaneando el QR del evento en la puerta.'}</span></span>
          </div>
        </div>
      )}
    </Load>
  );
}
