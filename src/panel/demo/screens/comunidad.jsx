import { useDeferredValue, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Carne, Empty, FakeQr, Load, OfferLogo, Sello, Sellos, Sheet, Skeleton, Stack, TypeTag, roleLine, useApp } from '../ui/pieces.jsx';
import { go, useApi } from '../router.js';

const COM_TABS = [['gente', '/comunidad', 'Gente'], ['ranking', '/comunidad/ranking', 'Ranking'], ['mapa', '/comunidad/mapa', 'Mapa']];
// Cabecera común de Comunidad: título grande y las pestañas.
export function ComunidadHead({ current, badges = {} }) {
  return (
    <>
      <PageTitle sub="La gente de Start.">Comunidad</PageTitle>
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
                {d.leaders?.length > 0 && (
                  <section className="home-sec" aria-label="Junta y responsables">
                    <h2 className="t-h home-h">Junta y responsables</h2>
                    <ul className="rail leaders">
                      {d.leaders.map((x) => <li key={x.id}><a className="card leader press" href={`#/persona/${x.id}`}><Avatar person={x} size={52} /><b>{x.name.split(' ')[0]}</b><span className={`leader-pos ${x.position === 'junta' ? 'is-junta' : ''}`}>{x.position === 'junta' ? 'Junta' : x.department}</span></a></li>)}
                    </ul>
                  </section>
                )}
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
