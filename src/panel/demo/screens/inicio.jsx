import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Img, Load, OfferLogo, Rolling, Sello, Skeleton, Stack, burst, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { PullIndicator, usePull } from '../ui/Pull.jsx';
import { NextTicket, PageTitle } from './comunidad.jsx';
import { StarterMes } from './ranking.jsx';

// Inicio: lo tuyo y lo nuevo en Start. La estructura viene de la demo de Ángel, recortada:
// cada bloque responde a una pregunta («¿qué tengo?», «¿qué hay de nuevo?», «¿a quién
// conozco?») y los carruseles llevan pocas tarjetas para poder mirarlas una a una.
const FULL_DATE = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

export function Inicio() {
  const { api, me } = useApp();
  const q = useApi(api, 'home', {}, []);
  const { pull, refreshing } = usePull(q.reload);
  return (
    <>
      <PullIndicator pull={pull} refreshing={refreshing} />
      <PageTitle eyebrow={FULL_DATE.format(new Date('2026-11-21T12:00:00'))} sub="Lo tuyo y lo nuevo en Start hoy.">Hola, {me.name.split(' ')[0]}</PageTitle>
      <Load q={q} skeleton={<><div className="quick">{[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: 76 }} />)}</div><Skeleton h={130} n={3} /></>}>
        {(d) => (
          <div className="two-col">
            <div className="col-main home">
              <nav className="quick" aria-label="Resumen">
                <a className="quick-tile is-brand press" href="#/eventos"><b className="num"><Rolling value={d.counts.planes} /></b><span>planes próximos</span></a>
                <a className="quick-tile press" href="#/comunidad"><b className="num"><Rolling value={d.counts.gente} /></b><span>personas en Start</span></a>
                <a className="quick-tile press" href="#/ofertas"><b className="num"><Rolling value={d.counts.oportunidades} /></b><span>oportunidades abiertas</span></a>
              </nav>
              {d.nextEvent && <NextTicket e={d.nextEvent} />}
              {d.announcement && <Novedades d={d} onChange={q.setData} />}
              {d.starterOfMonth && <StarterMes s={d.starterOfMonth} compact />}
              {d.events.length > 0 && (
                <Section title="Próximos eventos" href="#/eventos">
                  <ul className="rail">{d.events.map((e) => <li key={e.id}><MiniEvent e={e} /></li>)}</ul>
                </Section>
              )}
              {d.offers.length > 0 && (
                <Section title="Oportunidades para ti" href="#/ofertas" sub="Lo que más se mueve entre la gente de Start">
                  <ul className="rail">{d.offers.map((o) => <li key={o.id}><MiniOffer o={o} /></li>)}</ul>
                </Section>
              )}
              {d.people.length > 0 && <div className="only-mobile-block"><GenteParaTi people={d.people} /></div>}
              {d.startups.length > 0 && (
                <Section title="Startups de socios" href="#/comunidad">
                  <ul className="rail">{d.startups.map((s) => <li key={s.id}><MiniStartup s={s} /></li>)}</ul>
                </Section>
              )}
              <AlDia empty={!d.announcement} />
            </div>
            <aside className="col-side">
              <Carne person={me} own />
              {d.people.length > 0 && <GenteParaTi people={d.people} />}
            </aside>
          </div>
        )}
      </Load>
    </>
  );
}

function Section({ title, href, sub, children }) {
  return (
    <section className="home-sec" aria-label={title}>
      <div className="section-h"><h2 className="t-h home-h">{title}</h2>{href && <a className="link" href={href}>Ver todo</a>}</div>
      {sub && <p className="t-soft home-sub">{sub}</p>}
      {children}
    </section>
  );
}

// Lo nuevo de la Junta: el último anuncio y la petición de apoyo.
function Novedades({ d, onChange }) {
  const { api, toast } = useApp();
  const btn = useRef(null);
  const s = d.support;
  const toggle = async () => {
    const on = !s.supported;
    onChange((x) => ({ ...x, support: { ...x.support, supported: on, count: x.support.count + (on ? 1 : -1) } }));
    if (on) { burst(btn.current); navigator.vibrate?.(12); }
    try { await api('support.toggle', { on }); } catch (e) { onChange((x) => ({ ...x, support: s })); toast(e.message); }
  };
  const left = Math.max(0, s.goal - s.count);
  return (
    <Section title="Lo nuevo en Start">
      <ul className="card news">
        <li>
          <div className="news-row">
            <span className="news-ico is-brand"><Icon name="megaphone" size={19} /></span>
            <span className="grow">
              <span className="news-kicker">Anuncio de la Junta · {d.announcement.at}</span>
              <span className="news-text">{d.announcement.text}</span>
              <span className="t-soft news-by">{d.announcement.person.name}</span>
            </span>
          </div>
        </li>
        <li className="news-row">
          <span className="news-ico"><Icon name="heart" size={19} /></span>
          <span className="grow">
            <span className="news-kicker">Start necesita tu apoyo</span>
            <span className="news-text">{s.title} · {s.where}</span>
            <span className="support-bar" role="progressbar" aria-valuemin={0} aria-valuemax={s.goal} aria-valuenow={s.count} aria-label="Apoyos"><i style={{ transform: `scaleX(${s.count / s.goal})` }} /></span>
            <span className="t-soft news-by num">{left ? `Faltan ${left} de ${s.goal} apoyos` : '¡Objetivo conseguido!'}</span>
          </span>
          <button ref={btn} className={`btn btn-morph news-btn ${s.supported ? 'btn--soft' : 'btn--lime'} press`} onClick={toggle} aria-pressed={s.supported}>
            <span key={String(s.supported)} className="btn-label">{s.supported ? <><Icon name="check" size={16} className="check-draw" /> Apoyado</> : 'Apoyar'}</span>
          </button>
        </li>
        {d.stamp && (
          <li>
            <a className="news-row press" href="#/perfil">
              <Sello stamp={d.stamp.stamp} size={44} rotate={-8} />
              <span className="grow"><span className="news-text">{d.stamp.count} personas consiguieron el sello {d.stamp.stamp.name}</span>{d.stamp.mine && <span className="t-marker news-mark">Tú también. Ya llevas {d.stamp.myCount}.</span>}</span>
            </a>
          </li>
        )}
      </ul>
    </Section>
  );
}

function MiniEvent({ e }) {
  const { photos } = useApp();
  return (
    <a className="card mini-ev press" href={`#/evento/${e.id}`}>
      <span className="mini-cover"><Img src={photos[e.cover]} alt="" /><span className="date"><b>{e.day}</b><span>{e.month}</span></span>{e.isGoing && <span className="mini-flag"><Icon name="check" size={12} /> Vas</span>}</span>
      <span className="mini-body"><b>{e.title}</b><span className="t-soft">{e.relative} · {e.where.split(',')[0]}</span></span>
    </a>
  );
}

export function MiniOffer({ o }) {
  return (
    <a className="card mini-of press" href={`#/oferta/${o.id}`}>
      <span className="feed-row"><OfferLogo company={o.company} size={40} /><span className={`chip bg-${o.kindColor}`}>{o.kind}</span></span>
      <b className="mini-t">{o.title}</b>
      <span className="t-soft">{o.company.name}{o.company.isStart ? '' : ' (ejemplo)'}</span>
      <span className="mini-foot"><span className={o.daysLeft != null && o.daysLeft <= 14 ? 'is-soon' : 't-soft'}>{o.daysLeft != null && o.daysLeft <= 14 ? `Cierra en ${o.daysLeft} días` : o.deadline}</span>{o.interestedCount > 0 && <span className="feed-row" style={{ gap: 6 }}><Stack people={o.interestedPeople} /><span className="t-soft num">{o.interestedCount}</span></span>}</span>
    </a>
  );
}

function MiniStartup({ s }) {
  return (
    <a className="card mini-st press" href={`#/persona/${s.founder.id}`}>
      <span className="feed-row"><span className="logo-sq" style={{ '--s': '40px', background: s.color }} aria-hidden="true">{s.name[0]}</span><span className="grow"><b style={{ display: 'block' }}>{s.name}</b><span className="t-soft" style={{ fontSize: 13 }}>{s.sector}</span></span></span>
      <span className="mini-pitch">{s.pitch}</span>
      <span className="mini-foot"><span className="chip bg-lime">{s.tag}</span><Avatar person={s.founder} size={26} /></span>
    </a>
  );
}

function GenteParaTi({ people }) {
  return (
    <Section title="Gente para ti" href="#/comunidad/gente">
      <ul className="card people-ti">
        {people.slice(0, 4).map((x) => (
          <li key={x.id} className="pti">
            <a href={`#/persona/${x.id}`} className="pti-who press"><Avatar person={x} size={44} /><span className="grow"><b>{x.name}</b><span className="pti-reason">{x.reason}</span><span className="t-soft pti-look">{x.looking}</span></span><Icon name="chevron-right" className="t-soft" /></a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// Final del Inicio: confirma que no te falta nada (y el check se dibuja al llegar).
function AlDia({ empty }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.6 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`aldia ${seen ? 'is-seen' : ''}`}>
      <span className="aldia-check"><Icon name="check" size={26} stroke={3} /></span>
      <p className="t-display aldia-t">Estás al día_</p>
      <p className="t-soft">{empty ? 'Cuando haya novedades, aparecerán aquí.' : 'Ya has visto todo lo nuevo de hoy en Start.'}</p>
      <a className="link" href="#/comunidad">Descubre tu comunidad</a>
    </div>
  );
}
