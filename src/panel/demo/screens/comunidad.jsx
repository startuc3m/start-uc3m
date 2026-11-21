import { useDeferredValue, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Empty, Load, OfferLogo, Sello, Sellos, Skeleton, Stack, TypeTag, roleLine, useApp } from '../ui/pieces.jsx';
import { go, useApi } from '../router.js';

function ComunidadTabs({ current }) {
  return (
    <div className="tabs" role="tablist" aria-label="Comunidad">
      <a href="#/comunidad" role="tab" aria-selected={current === 'paraTi'}>Para ti{current === 'paraTi' && <span className="tab-line" />}</a>
      <a href="#/comunidad/gente" role="tab" aria-selected={current === 'gente'}>Gente{current === 'gente' && <span className="tab-line" />}</a>
      <span className="grow" />
      {current === 'paraTi' && <a href="#/comunidad/gente" aria-label="Buscar personas" style={{ boxShadow: 'none' }}><Icon name="search" size={22} /></a>}
    </div>
  );
}

export function PageTitle({ eyebrow, children, action }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="t-mono only-desk" style={{ color: 'var(--brand-text)' }}>{eyebrow}_</p>}
        <h1 className="t-display">{children}_</h1>
      </div>
      {action}
    </div>
  );
}

/* ---------- Para ti ---------- */
export function ParaTi() {
  const { api, photos, me } = useApp();
  const q = useApi(api, 'feed', {}, []);
  return (
    <>
      <PageTitle eyebrow="Comunidad">Lo que pasa en Start</PageTitle>
      <ComunidadTabs current="paraTi" />
      <Load q={q} skeleton={<><div className="skel" style={{ height: 92 }} /><Skeleton h={260} n={2} /></>}>
        {(d) => (
          <div className="two-col">
            <div className="col-main">
              {d.newcomers.length > 0 && (
                <section aria-labelledby="nuevos">
                  <div className="section-h" style={{ marginBottom: 10 }}><h2 id="nuevos" className="t-h">Nuevos en Start</h2><a className="link" href="#/comunidad/gente">Ver todos</a></div>
                  <ul className="stories">
                    {d.newcomers.map((x, i) => (
                      <li key={x.id}><a className={`story press ${i > 2 ? 'story--seen' : ''}`} href={`#/persona/${x.id}`}><span className="ring"><Avatar person={x} size={60} /></span>{x.name.split(' ')[0]}</a></li>
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
  const { celebrate, toast } = useApp();
  const [busy, setBusy] = useState(false);
  if (it.kind === 'event') {
    const e = it.event;
    const toggle = async () => {
      setBusy(true);
      try {
        await api('event.going', { id: e.id, on: !e.isGoing });
        await onChange();
        if (!e.isGoing) celebrate({ kind: 'going', title: '¡Apuntado!', text: `Nos vemos en ${e.title}. Ficha con tu carné y te llevas el sello.`, stamp: e.stamp });
      } catch (err) { toast(err.message); } finally { setBusy(false); }
    };
    return (
      <article className="card feed-card">
        <div className="cover" style={{ backgroundImage: `url(${photos[e.cover]})` }} role="img" aria-label={`Foto de ${e.title}`}>
          <span className="date"><b>{e.day}</b><span>{e.month}</span></span>
        </div>
        <div className="body">
          <p className="t-mono t-soft" style={{ color: 'var(--brand-text)' }}>Próximo evento · Sello nuevo</p>
          <h3 className="title">{e.title}</h3>
          <div className="feed-row">
            <Stack people={e.goingPeople} />
            <span className="grow t-soft num">{e.goingCount} van</span>
            <button className={`btn ${e.isGoing ? 'btn--soft' : 'btn--lime'} press`} style={{ minHeight: 40, borderRadius: 999 }} onClick={toggle} disabled={busy} aria-pressed={e.isGoing}>
              {e.isGoing ? <><Icon name="check" size={18} /> Vas</> : 'Voy'}
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
      <PageTitle eyebrow="Comunidad">La gente de Start</PageTitle>
      <ComunidadTabs current="gente" />
      <div className="toolbar">
        <label className="search"><Icon name="search" /><span className="sr-only">Buscar</span><input type="search" placeholder="Nombre o carrera" value={text} onChange={(e) => setText(e.target.value)} enterKeyHint="search" /></label>
        <div className="pills" role="group" aria-label="Filtrar">
          {FILTERS.map(([k, l]) => <button key={k} className="pill press" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
          <a className="pill press" href="#/mapa">Por personalidad</a>
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
export function Avisos() {
  const { api, refreshMe } = useApp();
  const q = useApi(api, 'notifications', {}, []);
  return (
    <>
      <PageTitle>Avisos</PageTitle>
      <Load q={q}>
        {(d) => (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.items.map((n) => (
              <li key={n.id} className="card feed-row" style={{ padding: 14, borderColor: n.unread ? 'var(--brand-text)' : undefined }}>
                <span className="avatar" style={{ '--s': '40px' }}><Icon name={n.icon} size={18} /></span>
                <span className="grow"><b style={{ display: 'block' }}>{n.text}</b><span className="t-soft" style={{ fontSize: 14 }}>{n.when}</span></span>
                {n.unread && <span className="sr-only">Sin leer</span>}
              </li>
            ))}
            <li><button className="btn btn--soft btn--block press" onClick={async () => { await api('notifications.read'); q.reload(); refreshMe(); }}>Marcar todo como leído</button></li>
          </ul>
        )}
      </Load>
    </>
  );
}

export { go };
