import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, FakeQr, Img, Load, OfferLogo, Rolling, Sheet, Skeleton, Stack, useApp } from '../ui/pieces.jsx';
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
              {d.news?.length > 0 && <Novedades news={d.news} />}
              <InvitaQr />
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
              <AlDia empty={!d.news?.length} />
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

// Generador del QR de invitación: quien lo escanea va al alta de socio con tu
// referencia y, cuando se hace socio, tú sumas puntos.
function InvitaQr() {
  const { api, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const show = async () => { setInfo(await api('invite.info')); setOpen(true); };
  const url = info ? `https://www.startuc3m.es/panel/#${info.path}` : '';
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch { toast(url); } };
  const seed = [...(info?.ref ?? 'start')].reduce((n, c) => n + c.charCodeAt(0), 7);
  return (
    <Section title="Invita a alguien a Start">
      <div className="card news-row">
        <span className="news-ico is-brand"><Icon name="qr-code" size={19} /></span>
        <span className="grow">
          <span className="news-text" style={{ fontWeight: 700 }}>Tu QR para hacer socios</span>
          <span className="t-soft news-by">Quien lo escanee va directo al alta de socio. Si se hace socio, tú sumas puntos.</span>
        </span>
        <button className="btn btn--lime press" onClick={show}>Generar QR</button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Tu QR de invitación">
        {info && (
          <>
            <div style={{ width: 220, maxWidth: '70%', margin: '0 auto', padding: 14, background: '#fff', color: '#13133d', borderRadius: 16 }}><FakeQr seed={seed} label="QR de invitación para hacerse socio" /></div>
            <p className="t-soft" style={{ textAlign: 'center', fontSize: 14 }}>Enséñalo o comparte el enlace. Por cada socio nuevo que entre con él sumas <b>{info.perInvite} puntos</b>.</p>
            <p className="num" style={{ textAlign: 'center', fontWeight: 700 }}>{info.count === 0 ? 'Aún no ha entrado nadie con tu QR' : `${info.count} ${info.count === 1 ? 'socio nuevo' : 'socios nuevos'} · +${info.earned} puntos`}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--soft press" onClick={copy}>Copiar enlace</button>
              <a className="btn btn--primary btn--block press" href={`#${info.path}`} onClick={() => setOpen(false)}>Probar el QR (demo)</a>
            </div>
          </>
        )}
      </Sheet>
    </Section>
  );
}

// Lo nuevo en Start: solo lo publicado la última semana en Oportunidades y Eventos.
function Novedades({ news }) {
  return (
    <Section title="Lo nuevo en Start" sub="Lo publicado esta semana en Oportunidades y Eventos">
      <ul className="card news">
        {news.map((n) => (
          <li key={`${n.kind}-${n.id}`}>
            <a className="news-row press" href={n.href}>
              {n.kind === 'offer' ? <OfferLogo company={n.company} size={40} /> : <span className="news-ico is-brand"><Icon name="calendar" size={19} /></span>}
              <span className="grow">
                <span className="news-kicker">{n.kind === 'offer' ? 'Oportunidad nueva' : 'Evento nuevo'} · {n.ago}</span>
                <span className="news-text" style={{ fontWeight: 700 }}>{n.title}</span>
                <span className="t-soft news-by">{n.by}</span>
              </span>
              <Icon name="chevron-right" className="t-soft" />
            </a>
          </li>
        ))}
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
