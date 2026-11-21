import { useDeferredValue, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Empty, FakeQr, Img, Load, OfferLogo, Rolling, Sello, Sellos, Skeleton, Stack, TypeTag, roleLine, useApp } from '../ui/pieces.jsx';
import { go, useApi } from '../router.js';
import { PullIndicator, usePull } from '../ui/Pull.jsx';

const COM_TABS = [['canales', '/comunidad', 'Canales'], ['mensajes', '/comunidad/mensajes', 'Mensajes'], ['gente', '/comunidad/gente', 'Gente'], ['mapa', '/comunidad/mapa', 'Mapa']];
// Cabecera común de Comunidad: título grande y las cuatro pestañas.
export function ComunidadHead({ current, badges = {} }) {
  return (
    <>
      <PageTitle sub="Los canales de Start, tus mensajes y la gente.">Comunidad</PageTitle>
      <div className="tabs" role="tablist" aria-label="Comunidad">
        {COM_TABS.map(([k, href, label]) => (
          <a key={k} href={`#${href}`} role="tab" aria-selected={current === k}>{label}{badges[k] > 0 && <span className="tab-badge num">{badges[k]}</span>}{current === k && <span className="tab-line" />}</a>
        ))}
      </div>
    </>
  );
}

export function PageTitle({ eyebrow, sub, children, action }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="t-mono only-desk" style={{ color: 'var(--brand-text)' }}>{eyebrow}_</p>}
        <h1 className="t-display">{children}_</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Para ti ---------- */
// Historias vistas: el aro se apaga cuando ya has entrado a ver a esa persona (como en Instagram).
const readSeen = () => { try { return JSON.parse(localStorage.getItem('pd-seen') || '[]'); } catch { return []; } };
const markSeen = (id) => { try { localStorage.setItem('pd-seen', JSON.stringify([...new Set([...readSeen(), id])])); } catch {} };

const FULL_DATE = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
export function Inicio() {
  const { api, photos, me } = useApp();
  const seen = readSeen();
  const q = useApi(api, 'feed', {}, []);
  const { pull, refreshing } = usePull(q.reload);
  return (
    <>
      <PullIndicator pull={pull} refreshing={refreshing} />
      <PageTitle eyebrow={FULL_DATE.format(new Date('2026-11-21T12:00:00'))} sub="Lo tuyo y lo nuevo en Start.">Hola, {me.name.split(' ')[0]}</PageTitle>
      <Load q={q} skeleton={<><div className="skel" style={{ height: 92 }} /><Skeleton h={260} n={2} /></>}>
        {(d) => (
          <div className="two-col">
            <div className="col-main">
              {d.nextEvent && <NextTicket e={d.nextEvent} />}
              {d.newcomers.length > 0 && (
                <section aria-labelledby="nuevos">
                  <div className="section-h" style={{ marginBottom: 10 }}><h2 id="nuevos" className="t-h">Nuevos en Start</h2><a className="link" href="#/comunidad/gente">Ver todos</a></div>
                  <ul className="stories">
                    {d.newcomers.map((x, i) => (
                      <li key={x.id}><a className={`story press ${seen.includes(x.id) ? 'story--seen' : ''}`} href={`#/persona/${x.id}`} onClick={() => markSeen(x.id)}><span className="ring"><Avatar person={x} size={60} /></span>{x.name.split(' ')[0]}</a></li>
                    ))}
                  </ul>
                </section>
              )}
              {d.items.length === 0 ? (
                <Empty icon="sparkles" title="Aún no hay nada por aquí" action={<a className="btn btn--primary press" href="#/comunidad/gente">Conoce a la gente de Start</a>}>Cuando haya eventos, ofertas o sellos nuevos, aparecerán aquí solos.</Empty>
              ) : d.items.map((it) => <FeedItem key={it.id} it={it} photos={photos} api={api} onChange={q.reload} />)}
            </div>
            <aside className="col-side">
              <Carne person={me} own />
              {d.sameCareer?.length > 0 && <SameCareer people={d.sameCareer} career={me.career} />}
            </aside>
          </div>
        )}
      </Load>
    </>
  );
}

// Tu próxima entrada: el plan más cercano al que vas, con el QR a mano para la puerta.
export function NextTicket({ e }) {
  const { openQr, me } = useApp();
  return (
    <section className="ticket" aria-label="Tu próxima entrada">
      <a className="ticket-main press" href={`#/evento/${e.id}`}>
        <span className="t-mono ticket-eyebrow"><Icon name="ticket" size={14} /> Tu próxima entrada</span>
        <b className="ticket-when">{e.relative}</b>
        <span className="ticket-title">{e.title}</span>
        <span className="ticket-meta">{e.when} · {e.where}</span>
      </a>
      <button className="ticket-qr press" onClick={openQr} aria-label="Abrir tu QR para entrar">
        <span className="qr-mini"><FakeQr seed={me.number} /></span>
        <span className="t-mono">Tu QR</span>
      </button>
    </section>
  );
}

function SameCareer({ people }) {
  return (
    <section aria-labelledby="misma">
      <div className="section-h" style={{ marginBottom: 10 }}><h2 id="misma" className="t-h">Estudian lo mismo que tú</h2><a className="link" href="#/comunidad/gente">Ver más</a></div>
      <ul className="mini-people">
        {people.map((x) => (
          <li key={x.id} className="card">
            <Avatar person={x} size={52} />
            <b>{x.name.split(' ')[0]}</b>
            <span className="t-soft">{x.career.replace('Ing. ', '')} · {x.course}</span>
            <a className="btn btn--soft press" href={`#/persona/${x.id}`} style={{ minHeight: 34, fontSize: 14, padding: '0 12px' }}>Ver perfil</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeedItem({ it, photos, api, onChange }) {
  const { celebrate, toast, openQr, me } = useApp();
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState({});
  if (it.kind === 'event') {
    const e = { ...it.event, ...local };
    const toggle = async () => {
      if (busy) return;
      const on = !e.isGoing;
      setLocal({ isGoing: on, goingCount: e.goingCount + (on ? 1 : -1) });
      if (on) celebrate({ kind: 'going', title: '¡Te esperamos!', text: `Nos vemos en ${e.title}, el ${e.day} de ${e.month.toLowerCase()}. En la entrada, enseña el QR de tu carné y el sello ${e.stamp.label} será tuyo.`, stamp: { ...e.stamp, pending: true } });
      setBusy(true);
      try { await api('event.going', { id: e.id, on }); } catch (err) { setLocal({}); toast(err.message); } finally { setBusy(false); }
    };
    return (
      <article className="card feed-card">
        <a className="cover" href={`#/evento/${e.id}`}><Img src={photos[e.cover]} alt={`Foto de ${e.title}`} />
          <span className="date"><b>{e.day}</b><span>{e.month}</span></span>
        </a>
        <div className="body">
          <p className="t-mono t-soft" style={{ color: 'var(--brand-text)' }}>Próximo evento · Sello {e.stamp.label} al fichar</p>
          <a href={`#/evento/${e.id}`}><h3 className="title">{e.title}</h3></a>
          <div className="feed-row">
            <Stack people={e.isGoing ? [me, ...e.goingPeople].slice(0, 3) : e.goingPeople} />
            <span className="grow t-soft num"><Rolling value={e.goingCount} /> van{e.isGoing ? ', tú también' : ''}</span>
            {e.isGoing && <button className="btn btn--soft press" style={{ minHeight: 40, borderRadius: 999, fontSize: 15 }} onClick={openQr}>Mi QR</button>}
            <button className={`btn btn-morph ${e.isGoing ? 'btn--soft' : 'btn--lime'} press`} style={{ minHeight: 40, borderRadius: 999 }} onClick={toggle} aria-pressed={e.isGoing}>
              <span key={String(e.isGoing)} className="btn-label">{e.isGoing ? <><Icon name="check" size={18} className="check-draw" /> Vas</> : 'Voy'}</span>
            </button>
          </div>
        </div>
      </article>
    );
  }
  if (it.kind === 'offer') {
    const o = it.offer;
    return (
      <a className="card feed-row press" href={`#/oferta/${o.id}`} style={{ padding: 14 }}>
        <OfferLogo company={o.company} />
        <span className="grow">
          <span className="t-mono" style={{ color: 'var(--brand-text)', display: 'block' }}>Oferta nueva</span>
          <b style={{ fontSize: 17 }}>{o.title}</b>
          <span className="t-soft" style={{ display: 'block', fontSize: 14 }}>{o.company.name}{o.company.isStart ? '' : ' (ejemplo)'} · {o.interestedCount} de Start apuntados</span>
        </span>
        <Icon name="chevron-right" className="t-soft" />
      </a>
    );
  }
  if (it.kind === 'stamp') {
    return (
      <a className="card stamp-card press" href="#/perfil">
        <Sello stamp={it.stamp} size={64} rotate={-8} />
        <span><b style={{ fontSize: 17 }}>{it.count} personas consiguieron el sello {it.stamp.name}</b>{it.mine && <span className="t-marker" style={{ display: 'block', fontSize: 15, marginTop: 4 }}>Tú incluido. Ya llevas {it.myCount}.</span>}</span>
      </a>
    );
  }
  return null;
}

/* ---------- Gente ---------- */
const FILTERS = [['todos', 'Todos'], ['socios', 'Socios'], ['starters', 'Starters']];
export function Gente() {
  const { api, wide } = useApp();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('todos');
  const qText = useDeferredValue(text);
  const q = useApi(api, 'people', { q: qText, filter }, [qText, filter]);
  const [selected, setSelected] = useState('lucia');
  return (
    <>
      <ComunidadHead current="gente" />
      <div className="toolbar">
        <label className="search"><Icon name="search" /><span className="sr-only">Buscar</span><input type="search" placeholder="Nombre o carrera" value={text} onChange={(e) => setText(e.target.value)} enterKeyHint="search" />{text && <button className="search-clear press" onClick={() => setText('')} aria-label="Borrar búsqueda"><Icon name="x" size={16} /></button>}</label>
        <div className="pills" role="group" aria-label="Filtrar">
          {FILTERS.map(([k, l]) => <button key={k} className="pill press" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
          
        </div>
      </div>
      <div className="two-col two-col--detail">
        <div className="col-main">
          <Load q={q} skeleton={<Skeleton h={92} n={5} />}>
            {(d) => d.people.length === 0 ? (
              <Empty icon="search" title={text ? `Nadie coincide con «${text}»` : 'Aún no hay nadie aquí'}>Prueba con otro nombre o quita los filtros.</Empty>
            ) : (
              <>
                <p className="t-soft num" aria-live="polite">{d.total} {d.total === 1 ? 'persona' : 'personas'}</p>
                <ul className="people-list">
                  {d.people.map((x) => (
                    <li key={x.id}>
                      <a className="card person-row press" href={`#/persona/${x.id}`} aria-current={wide && selected === x.id ? 'true' : undefined}
                        onClick={(e) => { if (wide) { e.preventDefault(); setSelected(x.id); } }}>
                        <Avatar person={x} size={56} />
                        <span className="who"><span className="name" style={{ display: 'block' }}>{x.name}</span><span className="meta" style={{ display: 'block' }}>{x.career} · {x.course}</span><span className="role" style={{ display: 'block' }}>{roleLine(x)}</span></span>
                        <TypeTag code={x.type} family={x.family} />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Load>
        </div>
        {wide && <aside className="col-side col-side--panel"><Ficha id={selected} compact /></aside>}
      </div>
    </>
  );
}

/* ---------- Ficha de una persona ---------- */
export function Persona({ params }) {
  return <Ficha id={params.id} />;
}

function Ficha({ id, compact = false }) {
  const { api, toast } = useApp();
  const q = useApi(api, 'person', { id }, [id]);
  return (
    <Load q={q} skeleton={<><div className="skel" style={{ height: 230, borderRadius: 14 }} /><Skeleton h={48} n={2} /></>}>
      {({ person: x, team, sameType }) => (
        <div className="ficha">
          <Carne person={x} />
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="btn btn--primary btn--block press" href={x.linkedin} target="_blank" rel="noreferrer">Ver LinkedIn</a>
            <button className="btn btn--soft btn--icon press" aria-label={`Compartir el perfil de ${x.name}`} onClick={() => share(x, toast)}><Icon name="share" /></button>
          </div>
          <section aria-label="Sus sellos">
            <div className="section-h"><h2 className="t-h">Sus sellos · {x.stampList.length}</h2></div>
            {x.stampList.length ? <Sellos list={x.stampList} size={compact ? 70 : 84} /> : <p className="t-soft" style={{ marginTop: 8 }}>Todavía no tiene sellos. ¡Invítale al próximo evento!</p>}
          </section>
          {!compact && team.length > 0 && (
            <section aria-label="Su equipo">
              <div className="section-h" style={{ marginBottom: 10 }}><h2 className="t-h">Su equipo en Start · {x.dept}</h2></div>
              <ul className="team-row">{team.slice(0, 4).map((y) => <li key={y.id}><a className="press" href={`#/persona/${y.id}`}><Avatar person={y} size={60} /><span>{y.name.split(' ')[0]}</span></a></li>)}</ul>
            </section>
          )}
          {!compact && sameType.length > 0 && (
            <section aria-label={`Más gente ${x.type}`}>
              <div className="section-h" style={{ marginBottom: 10 }}><h2 className="t-h">Más gente {x.type}</h2><a className="link" href={`#/mapa/${x.type}`}>Ver en el mapa</a></div>
              <a className="card feed-row press" href={`#/mapa/${x.type}`} style={{ padding: 12, background: 'var(--paper-2)', border: 0 }}>
                <Stack people={sameType} /><span className="grow t-soft">{sameType.map((y) => y.name.split(' ')[0]).slice(0, 2).join(', ')}{sameType.length > 2 ? ` y ${sameType.length - 2} más` : ''} comparten su tipo</span>
              </a>
            </section>
          )}
        </div>
      )}
    </Load>
  );
}

async function share(x, toast) {
  const url = `${location.origin}${location.pathname}#/persona/${x.id}`;
  try {
    if (navigator.share) await navigator.share({ title: x.name, url });
    else { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
  } catch {}
}

/* ---------- Avisos ---------- */
const GROUPS = [['hoy', 'Nuevos'], ['semana', 'Esta semana'], ['antes', 'Antes']];
export function Avisos() {
  const { api, refreshMe } = useApp();
  const q = useApi(api, 'notifications', {}, []);
  const readAll = async () => { await api('notifications.read'); q.setData((d) => ({ items: d.items.map((n) => ({ ...n, unread: false })) })); refreshMe(); };
  const open = (n) => { if (n.unread) { api('notifications.open', { id: n.id }).then(refreshMe); } };
  return (
    <>
      <PageTitle action={q.data?.items.some((n) => n.unread) && <button className="link-btn press" onClick={readAll}>Marcar como leído</button>}>Avisos</PageTitle>
      <Load q={q} skeleton={<Skeleton h={68} n={5} />}>
        {(d) => d.items.length === 0 ? <Empty icon="bell" title="Todo al día">Cuando pase algo (un sello, una oferta, alguien que se apunta a la tuya), aparecerá aquí.</Empty> : (
          <div className="avisos">
            {GROUPS.map(([k, label]) => {
              const items = d.items.filter((n) => n.at === k);
              if (!items.length) return null;
              return (
                <section key={k} aria-label={label}>
                  <h2 className="t-h avisos-h">{label}</h2>
                  <ul>
                    {items.map((n) => (
                      <li key={n.id}>
                        <a className={`aviso press ${n.unread ? 'is-unread' : ''}`} href={n.href} onClick={() => open(n)}>
                          <AvisoVisual n={n} />
                          <span className="grow"><span className="txt" dangerouslySetInnerHTML={{ __html: n.text }} /><span className="when">{n.when}</span></span>
                          {n.unread && <span className="dot" aria-label="Sin leer" />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Load>
    </>
  );
}

function AvisoVisual({ n }) {
  if (n.kind === 'stamp') return <Sello stamp={n.stamp} size={48} rotate={-8} />;
  if (n.kind === 'offer') return <OfferLogo company={n.company} size={48} />;
  if (n.kind === 'interested') return <span className="aviso-stack"><Avatar person={n.people[0]} size={36} /><Avatar person={n.people[1]} size={36} /></span>;
  if (n.kind === 'channel') return <span className="aviso-ico"><Icon name="megaphone" size={22} /></span>;
  if (n.kind === 'event') return <span className="aviso-date"><b>{n.event.day}</b><span>{n.event.month}</span></span>;
  return <Avatar person={n.person} size={48} />;
}

export { go };
