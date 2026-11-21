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

// Calendario: cada día con plan lleva el sello del evento (su color y su nombre), los
// eventos de varios días se unen con una franja, y al pasar el ratón o tocar un día se
// abre una ventanita con el evento y lo que puedes hacer (ir, ver tu entrada).
function Calendar({ all, onChange }) {
  const { api, openQr, celebrate, toast, wide } = useApp();
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
  const going = async (e) => {
    const on = !e.isGoing;
    onChange(e.id, { isGoing: on, goingCount: e.goingCount + (on ? 1 : -1) });
    setPop((p) => p && { ...p, e: { ...p.e, isGoing: on, goingCount: e.goingCount + (on ? 1 : -1) } });
    if (on) celebrate({ kind: 'going', title: '¡Te esperamos!', text: `Nos vemos en ${e.title}. En la puerta, enseña tu QR y el sello ${e.stamp.label} será tuyo.`, stamp: { ...e.stamp, pending: true } });
    try { await api('event.going', { id: e.id, on }); } catch (err) { onChange(e.id, { isGoing: e.isGoing, goingCount: e.goingCount }); toast(err.message); }
  };
  const W = 272;
  return (
    <section className="cal card" aria-label="Calendario de eventos" ref={box}>
      <div className="cal-h">
        <div className="grow">
          <h2 className="cal-title"><span key={`${month.y}${month.m}`} className={`cal-month cal-month--${dir}`}>{MONTHS[month.m]} <span className="t-soft">{month.y}</span></span></h2>
          <p className="t-soft cal-count">{inMonth.length ? `${inMonth.length} ${inMonth.length === 1 ? 'plan' : 'planes'}${inMonth.some((e) => e.isGoing) ? ` · ${inMonth.filter((e) => e.isGoing).length} con entrada` : ''}` : 'Sin planes este mes'}</p>
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
            <button key={key} className={`cal-day has-ev ${cls} ${e.isGoing ? 'is-going' : ''} ${pop?.e.id === e.id ? 'is-open' : ''} ${bandL ? 'band-l' : ''} ${bandR ? 'band-r' : ''}`}
              style={{ '--c': `var(--${e.stamp.color})` }}
              aria-label={`${i + 1} de ${MONTHS[month.m].toLowerCase()}: ${e.title}${e.isGoing ? ', tienes entrada' : ''}`} aria-haspopup="dialog" aria-expanded={pop?.e.id === e.id}
              onClick={(ev) => (pop?.e.id === e.id ? setPop(null) : open(e, ev.currentTarget))}
              onPointerEnter={(ev) => { if (ev.pointerType === 'mouse') { clearTimeout(hoverT.current); const el = ev.currentTarget; hoverT.current = setTimeout(() => open(e, el), 90); } }}
              onPointerLeave={(ev) => { if (ev.pointerType === 'mouse') { clearTimeout(hoverT.current); hoverT.current = setTimeout(() => setPop((p) => (p?.hover === false ? p : null)), 160); } }}>
              <span className="cal-stamp"><span className="num">{i + 1}</span></span>
              {hit.first && <span className="cal-lbl">{e.stamp.label}</span>}
              {e.isGoing && hit.first && <span className="cal-tick" aria-hidden="true"><Icon name="check" size={10} stroke={3.5} /></span>}
            </button>
          );
        })}
      </div>
      {pop && (
        <div className={`cal-pop ${pop.up ? 'is-up' : ''}`} role="dialog" aria-label={pop.e.title}
          style={{ left: Math.min(Math.max(pop.x - W / 2, 8), pop.w - W - 8), [pop.up ? 'bottom' : 'top']: pop.y, width: W, '--ax': `${pop.x - Math.min(Math.max(pop.x - W / 2, 8), pop.w - W - 8)}px` }}
          onPointerEnter={() => { clearTimeout(hoverT.current); }} onPointerLeave={(ev) => { if (ev.pointerType === 'mouse') hoverT.current = setTimeout(() => setPop(null), 200); }}>
          <PopBody e={pop.e} onGo={() => going(pop.e)} onQr={() => { setPop(null); openQr(); }} wide={wide} />
        </div>
      )}
    </section>
  );
}

function PopBody({ e, onGo, onQr }) {
  const { photos } = useApp();
  return (
    <>
      <a className="pop-cover" href={`#/evento/${e.id}`}><Img src={photos[e.cover]} alt="" /><Sello stamp={e.stamp} size={46} rotate={-10} empty={e.past && !e.attended} className="pop-sello" /></a>
      <div className="pop-body">
        <p className="t-mono pop-when">{e.when}</p>
        <a href={`#/evento/${e.id}`} className="pop-title">{e.title}</a>
        <p className="t-soft pop-where"><Icon name="map-pin" size={13} /> {e.where}</p>
        <div className="feed-row" style={{ gap: 8 }}><Stack people={e.goingPeople} /><span className="t-soft num" style={{ fontSize: 13 }}>{e.past ? `Fueron ${e.goingCount}` : `${e.goingCount} van`}</span>{!e.past && <span className="pop-rel">{e.relative}</span>}</div>
        <div className="pop-cta">
          {e.past ? <a className="btn btn--soft btn--block press" href={`#/evento/${e.id}`}>{e.attended ? 'Fuiste · ver evento' : 'Ver evento'}</a>
            : e.isGoing ? <><button className="btn btn--lime press" onClick={onQr}><Icon name="qr-code" size={16} /> Mi entrada</button><a className="btn btn--soft press" href={`#/evento/${e.id}`}>Ver evento</a></>
              : <><button className="btn btn--lime press" onClick={onGo}>Voy · {e.price.replace(' para socios', '')}</button><a className="btn btn--soft press" href={`#/evento/${e.id}`}>Ver</a></>}
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
