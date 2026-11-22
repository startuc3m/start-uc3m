import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Empty, Img, Load, Rolling, Sello, Skeleton, Stack, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { TODAY } from '../data.js';
import { NextTicket, PageTitle } from './comunidad.jsx';

const TABS = [['proximos', '/eventos', 'Próximos'], ['mias', '/eventos/mias', 'Mis entradas'], ['pasados', '/eventos/pasados', 'Pasados']];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function Eventos({ path }) {
  const { api } = useApp();
  const tab = path.endsWith('/mias') ? 'mias' : path.endsWith('/pasados') ? 'pasados' : 'proximos';
  const q = useApi(api, 'events', { tab }, [tab]);
  // Ir desde la ventanita del calendario actualiza también la lista de abajo.
  const patch = (id, v) => q.setData((d) => ({ ...d, all: d.all.map((e) => (e.id === id ? { ...e, ...v } : e)), events: d.events.map((e) => (e.id === id ? { ...e, ...v } : e)) }));
  const next = q.data?.events.find((e) => e.isGoing && !e.past);
  return (
    <>
      <PageTitle sub="Apúntate, entra con tu QR y gana sellos.">Eventos</PageTitle>
      <Load q={q} skeleton={<><div className="skel" style={{ height: 300 }} /><Skeleton h={220} n={2} /></>}>
        {(d) => (
          <div className="two-col two-col--events">
            <div className="col-main">
              {tab === 'proximos' && next && <div className="only-mobile-block"><NextTicket e={next} /></div>}
              <Calendar all={d.all} onChange={patch} />
              <nav className="segmented" aria-label="Eventos">
                {TABS.map(([k, href, label]) => <a key={k} href={`#${href}`} aria-current={tab === k ? 'page' : undefined}>{tab === k && <span className="seg-bg" aria-hidden="true" />}<span className="seg-t">{label}</span></a>)}
              </nav>
              {d.events.length === 0 ? (
                tab === 'mias'
                  ? <Empty icon="ticket" title="Aún no tienes entradas" action={<a className="btn btn--primary press" href="#/eventos">Ver próximos eventos</a>}>Pulsa «Voy» en un evento y tu entrada aparecerá aquí.</Empty>
                  : <Empty icon="calendar" title="No hay eventos por ahora">En cuanto la Junta publique el siguiente, lo verás aquí.</Empty>
              ) : (
                <ul className="ev-list">
                  {d.events.map((e) => <li key={e.id}><EventCard e={e} /></li>)}
                </ul>
              )}
            </div>
            <aside className="col-side">{next && <NextTicket e={next} />}</aside>
          </div>
        )}
      </Load>
    </>
  );
}

// Calendario al estilo Apple: cada día con plan lleva la foto del evento (como el calendario de
// Fotos), el día elegido se marca con un círculo y debajo aparece su agenda, entera y con lo que
// puedes hacer (ir, ver tu entrada). Los meses se pasan deslizando o con las flechas.
const WD_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function Calendar({ all, onChange }) {
  const { api, openQr, celebrate, toast, photos } = useApp();
  const [y0, m0, d0] = TODAY.split('-').map(Number);
  const [month, setMonth] = useState({ y: y0, m: m0 - 1 });
  const [dir, setDir] = useState('');
  const byDay = useMemo(() => {
    const map = {};
    for (const e of all) {
      const start = new Date(`${e.date}T12:00:00`), end = new Date(`${e.end ?? e.date}T12:00:00`);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        (map[iso(d.getFullYear(), d.getMonth(), d.getDate())] ??= []).push({ e, first: +d === +start, last: +d === +end });
      }
    }
    return map;
  }, [all]);
  // Día elegido: hoy, o el próximo día con plan si hoy no hay nada.
  const firstPick = useMemo(() => Object.keys(byDay).sort().find((k) => k >= TODAY) ?? TODAY, [byDay]);
  const [sel, setSel] = useState(firstPick);
  const move = (n) => { setDir(n > 0 ? 'next' : 'prev'); setMonth(({ y, m }) => ({ y: m + n > 11 ? y + 1 : m + n < 0 ? y - 1 : y, m: (m + n + 12) % 12 })); };
  const goToday = () => { setDir(month.y * 12 + month.m > y0 * 12 + m0 - 1 ? 'prev' : 'next'); setMonth({ y: y0, m: m0 - 1 }); setSel(TODAY); };
  // Deslizar el mes con el dedo (como en iOS).
  const touch = useRef(null);
  const onDown = (e) => { if (e.pointerType !== 'mouse') touch.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => { const t = touch.current; touch.current = null; if (!t) return; const dx = e.clientX - t.x; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - t.y)) move(dx < 0 ? 1 : -1); };
  const first = new Date(month.y, month.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const prefix = iso(month.y, month.m, 1).slice(0, 7);
  const inMonth = all.filter((e) => e.date.startsWith(prefix) || (e.end ?? '').startsWith(prefix));
  const going = async (e) => {
    const on = !e.isGoing;
    onChange(e.id, { isGoing: on, goingCount: e.goingCount + (on ? 1 : -1) });
    if (on) celebrate({ kind: 'going', title: '¡Te esperamos!', text: `Nos vemos en ${e.title}. En la puerta, enseña tu QR y el sello ${e.stamp.label} será tuyo.`, stamp: { ...e.stamp, pending: true } });
    try { await api('event.going', { id: e.id, on }); } catch (err) { onChange(e.id, { isGoing: e.isGoing, goingCount: e.goingCount }); toast(err.message); }
  };
  const selDate = new Date(`${sel}T12:00:00`);
  const selEvents = (byDay[sel] ?? []).map((h) => h.e);
  const nextAfter = Object.keys(byDay).sort().find((k) => k > sel);
  const rel = (k) => { const n = Math.round((new Date(`${k}T12:00:00`) - new Date(`${TODAY}T12:00:00`)) / 864e5); return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n === -1 ? 'Ayer' : n > 0 ? `En ${n} días` : `Hace ${-n} días`; };
  return (
    <section className="ac card" aria-label="Calendario de eventos">
      <header className="ac-h">
        <h2 className="ac-title"><span key={`${month.y}${month.m}`} className={`cal-month cal-month--${dir}`}>{MONTHS[month.m]}<span className="ac-year"> {month.y}</span></span></h2>
        <span className="ac-count">{inMonth.length ? `${inMonth.length} planes` : 'Sin planes'}</span>
        <button className="ac-today press" onClick={goToday}>Hoy</button>
        <button className="ac-nav press" onClick={() => move(-1)} aria-label="Mes anterior"><Icon name="chevron-left" size={20} /></button>
        <button className="ac-nav press" onClick={() => move(1)} aria-label="Mes siguiente"><Icon name="chevron-right" size={20} /></button>
      </header>
      <div className="ac-wd" aria-hidden="true">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((w, i) => <span key={i} className={i > 4 ? 'is-we' : ''}>{w}</span>)}</div>
      <div className={`ac-grid cal-grid--${dir}`} key={`${month.y}${month.m}`} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { touch.current = null; }}>
        {Array.from({ length: offset }, (_, i) => <span key={`x${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = iso(month.y, month.m, i + 1);
          const hit = byDay[key]?.[0];
          const e = hit?.e;
          const col = (i + offset) % 7;
          const cls = ['ac-day', key < TODAY && 'is-past', key === TODAY && 'is-today', key === sel && 'is-sel', e && 'has-ev', e?.isGoing && 'is-going',
            e && !hit.first && col !== 0 && 'join-l', e && !hit.last && col !== 6 && 'join-r'].filter(Boolean).join(' ');
          return (
            <button key={key} className={cls} onClick={() => setSel(key)} aria-pressed={key === sel}
              aria-label={`${WD_LONG[new Date(`${key}T12:00:00`).getDay()]} ${i + 1}${e ? `: ${e.title}${e.isGoing ? ', tienes entrada' : ''}` : ''}`}
              style={e ? { '--c': `var(--${e.stamp.color})` } : undefined}>
              {e && <span className="ac-ph" style={{ backgroundImage: `url(${photos[e.cover]})` }} aria-hidden="true" />}
              <span className="ac-n num">{i + 1}</span>
              {e && hit.first && <span className="ac-t">{e.title}</span>}
              {e && <i className="ac-bar" aria-hidden="true" />}
              {e?.isGoing && hit.first && <span className="ac-tick" aria-hidden="true"><Icon name="check" size={10} stroke={3.5} /></span>}
            </button>
          );
        })}
      </div>
      <div className="ac-agenda" aria-live="polite">
        <div className="ac-agenda-h"><b>{WD_LONG[selDate.getDay()][0].toUpperCase() + WD_LONG[selDate.getDay()].slice(1)}, {selDate.getDate()} de {MONTHS[selDate.getMonth()].toLowerCase()}</b><span className="t-soft">{rel(sel)}</span></div>
        {selEvents.length === 0 ? (
          <div className="ac-empty">
            <span className="t-soft">Nada este día.</span>
            {nextAfter && <button className="link-btn press" onClick={() => { const d = new Date(`${nextAfter}T12:00:00`); if (d.getMonth() !== month.m) { setDir('next'); setMonth({ y: d.getFullYear(), m: d.getMonth() }); } setSel(nextAfter); }}>Siguiente plan: {byDay[nextAfter][0].e.title} <Icon name="chevron-right" size={14} /></button>}
          </div>
        ) : (
          <ul className="ac-list">
            {selEvents.map((e) => (
              <li key={e.id} className="ac-item" style={{ '--c': `var(--${e.stamp.color})` }}>
                <span className="ac-time num">{e.end ? <>Varios<br />días</> : e.time}</span>
                <a className="ac-thumb press" href={`#/evento/${e.id}`} style={{ backgroundImage: `url(${photos[e.cover]})` }} aria-hidden="true" tabIndex={-1} />
                <span className="ac-info">
                  <a href={`#/evento/${e.id}`} className="ac-ititle">{e.title}</a>
                  <span className="t-soft ac-where"><Icon name="map-pin" size={12} /> {e.where}</span>
                  <span className="ac-meta"><Stack people={e.goingPeople} /><span className="t-soft num">{e.past ? `Fueron ${e.goingCount}` : `${e.goingCount} van`}</span></span>
                </span>
                <span className="ac-cta">
                  {e.past ? <a className="btn btn--soft press" href={`#/evento/${e.id}`}>{e.attended ? 'Fuiste' : 'Ver'}</a>
                    : e.isGoing ? <button className="btn btn--lime press" onClick={openQr}><Icon name="qr-code" size={15} /> Mi QR</button>
                      : <button className="btn btn--primary press" onClick={() => going(e)}>Voy</button>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function EventCard({ e }) {
  const { photos } = useApp();
  return (
    <a className="card ev-card press" href={`#/evento/${e.id}`}>
      <span className="cover"><Img src={photos[e.cover]} alt="" />
        <span className="date"><b>{e.day}</b><span>{e.month}</span></span>
        {e.isGoing && <span className="chip bg-lime ev-flag"><Icon name="check" size={13} /> Tienes entrada</span>}
        {e.attended && <span className="chip bg-lime ev-flag"><Icon name="check" size={13} /> Fuiste</span>}
      </span>
      <span className="body">
        <span className="ev-tags">{e.membersOnly && <span className="chip bg-lavender">Solo socios</span>}{e.few && <span className="chip bg-yellow">{e.few}</span>}<span className="t-mono t-soft">{e.kind}</span></span>
        <b className="title">{e.title}</b>
        <span className="t-soft">{e.when} · {e.where}</span>
        <span className="feed-row"><Stack people={e.goingPeople} /><span className="grow t-soft num">{e.past ? `Fueron ${e.goingCount}` : `${e.isGoing ? 'Tú y ' : ''}${e.goingCount - (e.isGoing ? 1 : 0)} más`}</span><b className="ev-price">{e.price}</b></span>
      </span>
    </a>
  );
}

export function Evento({ params }) {
  const { api, photos, celebrate, toast, openQr, me } = useApp();
  const q = useApi(api, 'event', { id: params.id }, [params.id]);
  const [busy, setBusy] = useState(false);
  return (
    <Load q={q} skeleton={<><div className="skel" style={{ aspectRatio: '16/9' }} /><Skeleton h={48} n={4} /></>}>
      {({ event: e }) => {
        const toggle = async () => {
          if (busy) return;
          const on = !e.isGoing;
          q.setData({ event: { ...e, isGoing: on, goingCount: e.goingCount + (on ? 1 : -1), goingPeople: on ? [me, ...e.goingPeople].slice(0, 3) : e.goingPeople.filter((x) => x.id !== me.id) } });
          if (on) celebrate({ kind: 'going', title: '¡Te esperamos!', text: `Nos vemos en ${e.title}, el ${e.day} de ${e.month.toLowerCase()}. En la puerta, enseña tu QR y el sello ${e.stamp.label} será tuyo.`, stamp: { ...e.stamp, pending: true } });
          setBusy(true);
          try { await api('event.going', { id: e.id, on }); if (!on) toast('Has dejado tu plaza'); } catch (err) { q.setData({ event: e }); toast(err.message); } finally { setBusy(false); }
        };
        return (
          <div className="evento">
            <div className="ev-hero"><Img src={photos[e.cover]} alt={`Foto de ${e.title}`} /><span className="date"><b>{e.day}</b><span>{e.month}</span></span></div>
            <div className="ev-tags">{e.membersOnly && <span className="chip bg-lavender">Solo socios</span>}{e.few && <span className="chip bg-yellow">{e.few}</span>}<span className="t-mono t-soft">{e.kind}</span></div>
            <h1 className="t-display ev-title">{e.title}_</h1>
            <div className="facts">
              <span className="fact"><Icon name="calendar" className="ico" />{e.when.split(' · ')[0]}</span>
              <span className="fact"><Icon name="timer" className="ico" />{e.time}{e.end ? ' · 3 días' : ''}</span>
              <span className="fact"><Icon name="map-pin" className="ico" />{e.where}</span>
              <span className="fact"><Icon name="euro" className="ico" />{e.price}</span>
            </div>
            <p className="ev-desc">{e.desc}</p>
            <div className="card ev-stamp">
              <Sello stamp={e.stamp} size={64} rotate={-8} empty={!e.attended} />
              <span><b>{e.attended ? `Conseguiste el sello ${e.stamp.label}` : `Sello ${e.stamp.label}`}</b><span className="t-soft" style={{ display: 'block', fontSize: 14 }}>{e.attended ? 'Está en tu perfil.' : e.past ? 'Se daba al fichar en la puerta.' : 'Lo consigues al fichar con tu QR en la puerta.'}</span></span>
            </div>
            <div className="feed-row"><Stack people={e.goingPeople} /><span className="grow t-soft num">{e.past ? `Fueron ${e.goingCount} personas` : <><Rolling value={e.goingCount} /> {e.isGoing ? 'van, tú también' : 'van'}</>}</span></div>
            {!e.past && (
              <div className="sticky-cta ev-cta">
                <div className="ev-cta-row">
                  {e.isGoing && <button className="btn btn--soft press" onClick={openQr}><Icon name="qr-code" size={18} /> Mi QR</button>}
                  <button className={`btn btn-morph btn--block ${e.isGoing ? 'btn--soft' : 'btn--lime'} press`} onClick={toggle} aria-pressed={e.isGoing}>
                    <span key={String(e.isGoing)} className="btn-label">{e.isGoing ? <><Icon name="check" size={18} className="check-draw" /> Tienes entrada</> : `Voy · ${e.price}`}</span>
                  </button>
                </div>
                <span className="t-soft" style={{ fontSize: 13 }}>{e.isGoing ? 'Toca «Tienes entrada» si al final no puedes ir.' : e.relative}</span>
              </div>
            )}
          </div>
        );
      }}
    </Load>
  );
}
