import { useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Empty, Img, Load, Rolling, Sello, Skeleton, Stack, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { TODAY } from '../data.js';
import { NextTicket, PageTitle } from './comunidad.jsx';

const TABS = [['proximos', '/eventos', 'Próximos'], ['mias', '/eventos/mias', 'Mis entradas'], ['pasados', '/eventos/pasados', 'Pasados']];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function Eventos({ path }) {
  const { api, wide } = useApp();
  const tab = path.endsWith('/mias') ? 'mias' : path.endsWith('/pasados') ? 'pasados' : 'proximos';
  const q = useApi(api, 'events', { tab }, [tab]);
  const [picked, setPicked] = useState(null);
  const list = useRef(null);
  // Tocar un día con evento lleva a su tarjeta y la marca un momento.
  const pick = (id) => {
    setPicked(id);
    const el = list.current?.querySelector(`[data-ev="${id}"]`);
    el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  };
  const next = q.data?.events.find((e) => e.isGoing && !e.past);
  return (
    <>
      <PageTitle sub="Apúntate, entra con tu QR y gana sellos.">Eventos</PageTitle>
      <Load q={q} skeleton={<><div className="skel" style={{ height: 300 }} /><Skeleton h={220} n={2} /></>}>
        {(d) => (
          <div className="two-col two-col--events">
            <div className="col-main">
              {tab === 'proximos' && next && <div className="only-mobile-block"><NextTicket e={next} /></div>}
              {!wide && <Calendar all={d.all} onPick={pick} />}
              <nav className="segmented" aria-label="Eventos">
                {TABS.map(([k, href, label]) => <a key={k} href={`#${href}`} aria-current={tab === k ? 'page' : undefined}>{tab === k && <span className="seg-bg" aria-hidden="true" />}<span className="seg-t">{label}</span></a>)}
              </nav>
              {d.events.length === 0 ? (
                tab === 'mias'
                  ? <Empty icon="ticket" title="Aún no tienes entradas" action={<a className="btn btn--primary press" href="#/eventos">Ver próximos eventos</a>}>Pulsa «Voy» en un evento y tu entrada aparecerá aquí.</Empty>
                  : <Empty icon="calendar" title="No hay eventos por ahora">En cuanto la Junta publique el siguiente, lo verás aquí.</Empty>
              ) : (
                <ul className="ev-list" ref={list}>
                  {d.events.map((e) => <li key={e.id} data-ev={e.id} className={picked === e.id ? 'is-picked' : ''} onAnimationEnd={() => setPicked(null)}><EventCard e={e} /></li>)}
                </ul>
              )}
            </div>
            <aside className="col-side">{next && <NextTicket e={next} />}<Calendar all={d.all} onPick={pick} /></aside>
          </div>
        )}
      </Load>
    </>
  );
}

function Calendar({ all, onPick }) {
  const [y0, m0] = TODAY.split('-').map(Number);
  const [month, setMonth] = useState({ y: y0, m: m0 - 1 });
  const [dir, setDir] = useState('');
  const byDay = useMemo(() => {
    const map = {};
    for (const e of all) {
      const start = new Date(`${e.date}T12:00:00`), end = new Date(`${e.end ?? e.date}T12:00:00`);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) (map[iso(d.getFullYear(), d.getMonth(), d.getDate())] ??= []).push(e);
    }
    return map;
  }, [all]);
  const first = new Date(month.y, month.m, 1);
  const offset = (first.getDay() + 6) % 7; // semana que empieza en lunes
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const move = (n) => { setDir(n > 0 ? 'next' : 'prev'); setMonth(({ y, m }) => ({ y: m + n > 11 ? y + 1 : m + n < 0 ? y - 1 : y, m: (m + n + 12) % 12 })); };
  const count = Object.keys(byDay).filter((k) => k.startsWith(iso(month.y, month.m, 1).slice(0, 7))).length;
  return (
    <section className="cal card" aria-label="Calendario de eventos">
      <div className="cal-h">
        <h2 className="cal-title"><span key={`${month.y}${month.m}`} className={`cal-month cal-month--${dir}`}>{MONTHS[month.m]} <span className="t-soft">{month.y}</span></span></h2>
        <span className="t-soft cal-count">{count ? `${count} ${count === 1 ? 'día con plan' : 'días con plan'}` : 'Sin planes'}</span>
        <button className="cal-nav press" onClick={() => move(-1)} aria-label="Mes anterior"><Icon name="chevron-left" size={20} /></button>
        <button className="cal-nav press" onClick={() => move(1)} aria-label="Mes siguiente"><Icon name="chevron-right" size={20} /></button>
      </div>
      <div className="cal-grid" role="grid" key={`${month.y}${month.m}`}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((w) => <span key={w} className="cal-wd" aria-hidden="true">{w}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`x${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = iso(month.y, month.m, i + 1);
          const evs = byDay[key] ?? [];
          const going = evs.some((e) => e.isGoing);
          const past = key < TODAY;
          const label = `${i + 1} de ${MONTHS[month.m].toLowerCase()}${evs.length ? `: ${evs.map((e) => e.title).join(', ')}` : ''}`;
          return evs.length ? (
            <button key={key} className={`cal-day has-ev press ${going ? 'is-going' : ''} ${past ? 'is-past' : ''} ${key === TODAY ? 'is-today' : ''}`} onClick={() => onPick(evs[0].id)} aria-label={label}>
              <span className="num">{i + 1}</span><i className="cal-dot" />
            </button>
          ) : <span key={key} className={`cal-day ${past ? 'is-past' : ''} ${key === TODAY ? 'is-today' : ''}`} aria-label={label}><span className="num">{i + 1}</span></span>;
        })}
      </div>
      <p className="cal-legend t-soft"><i className="cal-dot" /> Evento <i className="cal-dot cal-dot--going" /> Tienes entrada</p>
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
