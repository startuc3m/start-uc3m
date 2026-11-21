import { useDeferredValue, useRef, useState } from 'react';
import { OFFER_KINDS } from '../data.js';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, Img, Load, OfferLogo, Rolling, Sheet, Skeleton, Stack, burst, roleLine, useApp } from '../ui/pieces.jsx';
import { back, go, useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';
import { MiniOffer } from './inicio.jsx';

const TABS = [['todas', '/ofertas', 'Todas'], ['interesan', '/ofertas/interesan', 'Me interesan'], ['mias', '/ofertas/mias', 'Publicadas']];

export function Ofertas({ path }) {
  const { api, me, wide } = useApp();
  const tab = path.endsWith('/interesan') ? 'interesan' : path.endsWith('/mias') ? 'mias' : 'todas';
  const [text, setText] = useState('');
  const [kind, setKind] = useState(null);
  const qText = useDeferredValue(text);
  const q = useApi(api, 'offers', { tab, kind, q: qText }, [tab, kind, qText]);
  const [selected, setSelected] = useState(null);
  const tabs = TABS.filter(([k]) => k !== 'mias' || me.canPublish);
  return (
    <>
      <PageTitle sub="Prácticas, proyectos, becas y hackathons, en un sitio." action={me.canPublish && <a className="btn btn--primary press only-desk" href="#/ofertas/publicar"><Icon name="plus" size={18} /> Publicar</a>}>Oportunidades</PageTitle>
      <div className="toolbar">
        <label className="search"><Icon name="search" /><span className="sr-only">Buscar</span><input type="search" placeholder="Buscar prácticas, becas, hackathons…" value={text} onChange={(e) => setText(e.target.value)} enterKeyHint="search" />{text && <button className="search-clear press" onClick={() => setText('')} aria-label="Borrar búsqueda"><Icon name="x" size={16} /></button>}</label>
        <div className="pills" role="group" aria-label="Tipo">
          <button className="pill press" aria-pressed={!kind} onClick={() => setKind(null)}>Todo</button>
          {OFFER_KINDS.map((k) => <button key={k} className="pill press" aria-pressed={kind === k} onClick={() => setKind(kind === k ? null : k)}>{k === 'Beca' ? 'Becas' : k === 'Hackathon' ? 'Hackathons' : k === 'Proyecto' ? 'Proyectos' : k}</button>)}
        </div>
      </div>
      <nav className="segmented" aria-label="Ofertas">
        {tabs.map(([k, href, label]) => <a key={k} href={`#${href}`} aria-current={tab === k ? 'page' : undefined}>{tab === k && <span className="seg-bg" aria-hidden="true" />}<span className="seg-t">{label}{q.data ? <span className="num"> · {q.data.counts[k]}</span> : null}</span></a>)}
      </nav>
      <div className="two-col two-col--detail">
        <div className="col-main">
          <Load q={q} skeleton={<Skeleton h={128} n={4} />}>
            {(d) => d.offers.length === 0 ? (
              tab === 'interesan'
                ? <Empty icon="heart" title="Aún no te interesa ninguna" action={<a className="btn btn--primary press" href="#/ofertas">Ver todas las ofertas</a>}>Marca «Me interesa» y quien publica la oferta verá tu perfil y tu CV.</Empty>
                : (text || kind) ? <Empty icon="search" title="Nada con esos filtros" action={<button className="btn btn--soft press" onClick={() => { setText(''); setKind(null); }}>Quitar filtros</button>}>Prueba con otra palabra o con otro tipo.</Empty>
                : <Empty icon="briefcase" title="No hay oportunidades ahora mismo">Te avisaremos con la campana cuando se publique una.</Empty>
            ) : (
              <>
              {tab === 'todas' && !text && !kind && <Destacadas offers={d.offers} />}
              {tab === 'todas' && !text && !kind && <h2 className="t-h home-h">Todas las oportunidades</h2>}
              <ul className="offer-list">
                {d.offers.map((o) => {
                  const sel = wide && (selected ?? d.offers[0].id) === o.id;
                  return (
                    <li key={o.id}>
                      <a className="card offer-row press" href={`#/oferta/${o.id}`} aria-current={sel ? 'true' : undefined} onClick={(e) => { if (wide) { e.preventDefault(); setSelected(o.id); } }}>
                        <OfferLogo company={o.company} />
                        <span className="grow">
                          <span className="top"><span className={`chip bg-${o.kindColor}`}>{o.kind}</span><span>{o.deadline}</span>{o.isInterested && <span className="fav"><Icon name="check" size={15} /> Te interesa</span>}</span>
                          <span className="t">{o.title}</span>
                          <span className="t-soft">{o.company.name}{o.company.isStart ? ` · ${o.company.note}` : ' (ejemplo)'}</span>
                          {o.interestedCount > 0 && <span className="proof"><Stack people={o.interestedPeople} /><span className="num">{o.interestedCount} de Start se han apuntado</span></span>}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              </>
            )}
          </Load>
        </div>
        {wide && q.data?.offers.length > 0 && <aside className="col-side col-side--panel"><OfertaDetalle key={selected ?? q.data.offers[0].id} id={selected ?? q.data.offers[0].id} onChange={q.reload} compact /></aside>}
      </div>
    </>
  );
}

// Arriba del todo, dos atajos: lo que más encaja contigo y lo que está a punto de cerrar.
function Destacadas({ offers }) {
  const paraTi = offers.filter((o) => !o.isInterested && !o.isMine).sort((a, b) => b.interestedCount - a.interestedCount).slice(0, 4);
  const pronto = offers.filter((o) => o.daysLeft != null && o.daysLeft >= 0 && o.daysLeft <= 14).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);
  return (
    <>
      {paraTi.length > 0 && (
        <section className="home-sec" aria-label="Para ti">
          <div className="section-h"><h2 className="t-h home-h">Para ti</h2></div>
          <p className="t-soft home-sub">Lo que más se mueve entre la gente de Start</p>
          <ul className="rail">{paraTi.map((o) => <li key={o.id}><MiniOffer o={o} /></li>)}</ul>
        </section>
      )}
      {pronto.length > 0 && (
        <section className="home-sec" aria-label="Cierran pronto">
          <div className="section-h"><h2 className="t-h home-h">Cierran pronto</h2></div>
          <ul className="card news">
            {pronto.map((o) => (
              <li key={o.id}><a className="news-row press" href={`#/oferta/${o.id}`}><OfferLogo company={o.company} size={40} /><span className="grow"><span className="news-text" style={{ fontWeight: 700 }}>{o.title}</span><span className="t-soft news-by">{o.company.name}{o.company.isStart ? '' : ' (ejemplo)'} · {o.kind}</span></span><span className="soon-pill num">{o.daysLeft === 0 ? 'Hoy' : `${o.daysLeft} d`}</span></a></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export function Oferta({ params }) {
  return <OfertaDetalle key={params.id} id={params.id} />;
}

function OfertaDetalle({ id, onChange, compact = false }) {
  const { api, photos, celebrate, toast, me } = useApp();
  const q = useApi(api, 'offer', { id }, [id]);
  const [busy, setBusy] = useState(false);
  const btn = useRef(null);
  const toggleRef = useRef(null);
  const queued = useRef(null);
  return (
    <Load q={q} skeleton={<><div className="skel" style={{ aspectRatio: '16/8' }} /><Skeleton h={40} n={4} /></>}>
      {({ offer: o }) => {
        // Respuesta inmediata: se pinta el cambio al tocar y el servidor confirma después.
        // Si falla, se deshace y se avisa.
        const apply = (on) => {
          const others = o.interestedPeople.filter((x) => x.id !== me.id);
          return { ...o, isInterested: on, interestedCount: o.interestedCount + (on ? 1 : -1), interestedPeople: on ? [me, ...others].slice(0, 3) : others };
        };
        const toggle = async (on = !o.isInterested) => {
          // Si llega mientras se guarda (p. ej. «Deshacer» con la red lenta), se encola.
          if (busy) { queued.current = on; return; }
          if (on === o.isInterested) return;
          const before = o;
          const next = apply(on);
          q.setData({ offer: next });
          setBusy(true);
          if (on) {
            // La celebración grande, una vez por sesión; después, un confeti pequeño desde el botón.
            let first = true;
            try { first = !sessionStorage.getItem('pd-c2'); sessionStorage.setItem('pd-c2', '1'); } catch {}
            if (first) celebrate({ kind: 'interest', title: '¡Apuntado!', text: `${o.contact} verá tu perfil${me.cv ? ' y tu CV' : ''}. Si encaja, te escribirá.`, people: next.interestedPeople, count: next.interestedCount });
            else { burst(btn.current); navigator.vibrate?.(12); }
          } else toast('Ya no te interesa esta oferta', { label: 'Deshacer', run: () => toggleRef.current(true) });
          try {
            const r = await api('offer.interest', { id: o.id, on });
            q.setData({ offer: r.offer });
            onChange?.();
          } catch (e) { q.setData({ offer: before }); toast(e.message); } finally {
            setBusy(false);
            if (queued.current !== null) { const next2 = queued.current; queued.current = null; setTimeout(() => toggleRef.current?.(next2)); }
          }
        };
        toggleRef.current = toggle;
        return (
          <article className="oferta">
            <div className="offer-cover"><Img src={photos[o.cover]} alt={`Foto de ${o.company.name}`} /><OfferLogo company={o.company} size={72} /></div>
            <p><b>{o.company.name}</b> <span className="t-soft">{o.company.isStart ? '' : '(ejemplo) '}· {o.company.note}</span></p>
            <p style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className={`chip bg-${o.kindColor}`}>{o.kind}</span><span className="t-soft">{o.deadline}</span></p>
            <h1 className="t-display" style={{ fontSize: compact ? 34 : 40, color: 'var(--ink)' }}>{o.title} en {o.company.name}_</h1>
            <ul className="facts">
              <li className="fact"><Icon name="map-pin" size={18} />{o.place}</li>
              <li className="fact"><Icon name="calendar" size={18} />{o.duration}</li>
              <li className="fact"><Icon name="timer" size={18} />{o.hours}</li>
              <li className="fact"><Icon name="euro" size={18} />{o.pay}</li>
            </ul>
            <p className="t-soft" style={{ fontSize: 17, lineHeight: 1.55 }}>{o.desc}</p>
            {o.interestedCount > 0 && (
              <div className="card feed-row" style={{ padding: 14, background: 'var(--paper-2)', border: 0 }}>
                <Stack people={o.interestedPeople} />
                <span className="grow t-soft"><Rolling value={o.interestedCount} /> de Start {o.interestedCount === 1 ? 'se ha apuntado' : 'se han apuntado'}{o.isInterested ? ', tú incluido' : ''}</span>
              </div>
            )}
            {o.isMine && <a className="btn btn--ghost btn--block press" href={`#/oferta/${o.id}/interesados`}><Icon name="users" size={18} /> Ver interesados · {o.interestedCount}</a>}
            <div className="sticky-cta">
              <button ref={btn} className={`btn btn--block press btn-morph ${o.isInterested ? 'btn--soft' : 'btn--lime'}`} onClick={() => toggle()} aria-pressed={o.isInterested}>
                <span key={String(o.isInterested)} className="btn-label">{o.isInterested ? <><Icon name="check" size={18} className="check-draw" /> Te interesa</> : 'Me interesa'}</span>
              </button>
              <p className="t-soft" style={{ fontSize: 14 }}>{o.isInterested ? 'Toca otra vez para quitarlo.' : me.cv ? `${o.contact} verá tu perfil y tu CV.` : <>{o.contact} verá tu perfil. <a href="#/perfil" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Sube tu CV</a> para que también lo vea.</>}</p>
            </div>
          </article>
        );
      }}
    </Load>
  );
}

const STATUS = { nuevo: ['Nuevo', 'lime'], guardado: ['Guardado', 'cyan'], contactado: ['Contactado', 'lavender'], descartado: ['Descartado', 'line'] };
const STATUS_FILTERS = [['todos', 'Todos'], ['nuevo', 'Nuevos'], ['guardado', 'Guardados'], ['contactado', 'Contactados']];

export function Interesados({ params }) {
  const { api, toast } = useApp();
  const q = useApi(api, 'offer.interested', { id: params.id }, [params.id]);
  const [filter, setFilter] = useState('todos');
  const [career, setCareer] = useState('');
  const [cv, setCv] = useState(null);
  // La hoja del CV sigue enseñando a la persona mientras sale.
  const lastCv = useRef(null);
  if (cv) lastCv.current = cv;
  const shownCv = lastCv.current;
  const setStatus = async (x, status, msg) => {
    await api('applicant.status', { offer: params.id, person: x.id, status });
    q.setData((d) => ({ ...d, people: d.people.map((y) => (y.id === x.id ? { ...y, status } : y)) }));
    if (msg) toast(msg);
  };
  const contact = (x) => { setStatus(x, 'contactado', `Marcado como contactado: ${x.name.split(' ')[0]}`); window.open(x.linkedin, '_blank', 'noopener'); };
  return (
    <>
      <PageTitle eyebrow="Mis ofertas">Interesados</PageTitle>
      <Load q={q} skeleton={<Skeleton h={120} n={4} />}>
        {(d) => {
          const careers = [...new Set(d.people.map((x) => x.career))].sort();
          const count = (k) => (k === 'todos' ? d.people.filter((x) => x.status !== 'descartado').length : d.people.filter((x) => x.status === k).length);
          const list = d.people
            .filter((x) => (filter === 'todos' ? x.status !== 'descartado' : x.status === filter))
            .filter((x) => !career || x.career === career);
          return (
            <>
              <a className="card feed-row press" href={`#/oferta/${d.offer.id}`} style={{ padding: 12 }}>
                <OfferLogo company={d.offer.company} size={40} />
                <span className="grow"><b style={{ display: 'block' }}>{d.offer.title}</b><span className="t-soft" style={{ fontSize: 14 }}>{d.offer.deadline} · {d.people.length} interesados · {d.people.filter((x) => x.cv).length} con CV</span></span>
                <Icon name="chevron-right" className="t-soft" />
              </a>
              <div className="toolbar">
                <div className="pills" role="group" aria-label="Filtrar por estado">
                  {STATUS_FILTERS.map(([k, l]) => <button key={k} className="pill press" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l} <span className="num">{count(k)}</span></button>)}
                </div>
                <label className="select-pill"><Icon name="filter" size={15} /><span className="sr-only">Carrera</span>
                  <select value={career} onChange={(e) => setCareer(e.target.value)}><option value="">Todas las carreras</option>{careers.map((c) => <option key={c}>{c}</option>)}</select>
                </label>
              </div>
              {list.length === 0 ? <Empty icon="users" title={d.people.length ? 'Nadie con estos filtros' : 'Aún no se ha apuntado nadie'}>{d.people.length ? 'Prueba con otro estado o carrera.' : 'Compártela en el grupo de socios para que la vean.'}</Empty> : (
                <ul className="applicants">
                  {list.map((x) => (
                    <li key={x.id} className="card applicant">
                      <div className="feed-row">
                        <Avatar person={x} size={52} />
                        <span className="grow" style={{ minWidth: 0 }}>
                          <a className="name" href={`#/persona/${x.id}`}>{x.name}</a>
                          <span className="t-soft" style={{ display: 'block', fontSize: 14 }}>{x.career} · {x.course} · {roleLine(x)}</span>
                        </span>
                        <span className={`chip bg-${STATUS[x.status][1]}`}>{STATUS[x.status][0]}</span>
                      </div>
                      <div className="applicant-actions">
                        <button className="btn btn--soft press" onClick={() => (x.cv ? setCv(x) : toast('No ha subido CV todavía'))} disabled={!x.cv} aria-label={`CV de ${x.name}`}><Icon name="file-text" size={17} /> {x.cv ? 'Ver CV' : 'Sin CV'}</button>
                        <button className="btn btn--primary press" onClick={() => contact(x)}><Icon name="message-circle" size={17} /> Contactar</button>
                        <button className={`btn btn--soft btn--icon press ${x.status === 'guardado' ? 'is-on' : ''}`} aria-pressed={x.status === 'guardado'} aria-label={x.status === 'guardado' ? 'Quitar de guardados' : 'Guardar'} onClick={() => setStatus(x, x.status === 'guardado' ? 'nuevo' : 'guardado')}><Icon name="heart" size={17} /></button>
                        <button className="btn btn--soft btn--icon press" aria-label={x.status === 'descartado' ? 'Recuperar' : 'Descartar'} onClick={() => setStatus(x, x.status === 'descartado' ? 'nuevo' : 'descartado', x.status === 'descartado' ? null : `${x.name.split(' ')[0]} descartado`)}><Icon name={x.status === 'descartado' ? 'rotate-ccw' : 'x'} size={17} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {filter === 'todos' && count('descartado') > 0 && <button className="t-soft press" style={{ alignSelf: 'center', fontSize: 14 }} onClick={() => setFilter('descartado')}>Ver descartados ({count('descartado')})</button>}
            </>
          );
        }}
      </Load>
      <Sheet open={Boolean(cv)} onClose={() => setCv(null)} title={shownCv?.cv?.name ?? 'CV'}>
        {shownCv && (
          <>
            <div className="cv-page" aria-label={`Vista previa del CV de ${shownCv.name}`}>
              <div className="feed-row"><Avatar person={shownCv} size={44} /><span><b style={{ display: 'block', fontSize: 18 }}>{shownCv.name}</b><span className="t-soft" style={{ fontSize: 13 }}>{shownCv.career} · {shownCv.course} · UC3M</span></span></div>
              {['Experiencia', 'Formación', 'Proyectos', 'Idiomas'].map((h, i) => <div key={h}><p className="t-mono" style={{ color: 'var(--brand-text)', marginBottom: 6 }}>{h}</p>{[92, 78, 64].slice(0, 3 - (i % 2)).map((w) => <i key={w} className="cv-line" style={{ width: `${w}%` }} />)}</div>)}
            </div>
            <p className="t-soft" style={{ fontSize: 13 }}>Vista previa de ejemplo · {shownCv.cv.meta}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--soft press" onClick={() => toast('En la demo no se descargan CV')}>Descargar</button>
              <button className="btn btn--primary btn--block press" onClick={() => { contact(shownCv); setCv(null); }}><Icon name="message-circle" size={17} /> Contactar</button>
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}

export function Publicar() {
  const { api, toast } = useApp();
  const [f, setF] = useState({ title: '', kind: 'Prácticas', place: '', deadline: '', desc: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { offer } = await api('offer.create', f);
      toast('Oferta publicada');
      go(`/oferta/${offer.id}`, { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <>
      <PageTitle eyebrow="Ofertas">Publicar oferta</PageTitle>
      <form className="card form" onSubmit={submit} noValidate>
        <div className="field"><label htmlFor="o-t">Título</label><input id="o-t" className="input" value={f.title} onChange={set('title')} aria-invalid={Boolean(err)} aria-describedby={err ? 'o-err' : undefined} placeholder="Prácticas de growth" />{err && <p id="o-err" className="err">{err}</p>}</div>
        <div className="field"><label htmlFor="o-k">Tipo</label><select id="o-k" className="input" value={f.kind} onChange={set('kind')}><option>Prácticas</option><option>Proyecto</option><option>Voluntariado</option><option>Empleo</option></select></div>
        <div className="form-row">
          <div className="field"><label htmlFor="o-p">Dónde</label><input id="o-p" className="input" value={f.place} onChange={set('place')} placeholder="Híbrida · Madrid" /></div>
          <div className="field"><label htmlFor="o-d">Plazo</label><input id="o-d" className="input" value={f.deadline} onChange={set('deadline')} placeholder="Hasta el 5 dic" /></div>
        </div>
        <div className="field"><label htmlFor="o-desc">Qué buscáis</label><textarea id="o-desc" className="input" value={f.desc} onChange={set('desc')} rows={5} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost press" onClick={() => back('/ofertas')}>Cancelar</button>
          <button className="btn btn--primary press" disabled={busy}>{busy ? 'Publicando…' : 'Publicar oferta'}</button>
        </div>
      </form>
    </>
  );
}
