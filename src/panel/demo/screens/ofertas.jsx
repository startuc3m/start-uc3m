import { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, Load, OfferLogo, Rolling, Skeleton, Stack, TypeTag, burst, roleLine, useApp } from '../ui/pieces.jsx';
import { back, go, useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';

const TABS = [['todas', '/ofertas', 'Todas'], ['interesan', '/ofertas/interesan', 'Me interesan'], ['mias', '/ofertas/mias', 'Mis ofertas']];

export function Ofertas({ path }) {
  const { api, me, wide } = useApp();
  const tab = path.endsWith('/interesan') ? 'interesan' : path.endsWith('/mias') ? 'mias' : 'todas';
  const q = useApi(api, 'offers', { tab }, [tab]);
  const [selected, setSelected] = useState(null);
  const tabs = TABS.filter(([k]) => k !== 'mias' || me.canPublish);
  return (
    <>
      <PageTitle eyebrow="Ofertas" action={me.canPublish && <a className="btn btn--primary press only-desk" href="#/ofertas/publicar"><Icon name="plus" size={18} /> Publicar oferta</a>}>Prácticas y oportunidades</PageTitle>
      <nav className="segmented" aria-label="Ofertas">
        {tabs.map(([k, href, label]) => <a key={k} href={`#${href}`} aria-current={tab === k ? 'page' : undefined}>{tab === k && <span className="seg-bg" aria-hidden="true" />}<span className="seg-t">{label}{q.data ? <span className="num"> · {q.data.counts[k]}</span> : null}</span></a>)}
      </nav>
      <div className="two-col two-col--detail">
        <div className="col-main">
          <Load q={q} skeleton={<Skeleton h={128} n={4} />}>
            {(d) => d.offers.length === 0 ? (
              tab === 'interesan'
                ? <Empty icon="heart" title="Aún no te interesa ninguna" action={<a className="btn btn--primary press" href="#/ofertas">Ver todas las ofertas</a>}>Marca «Me interesa» y quien publica la oferta verá tu perfil y tu CV.</Empty>
                : <Empty icon="briefcase" title="No hay ofertas ahora mismo">Te avisaremos con la campana cuando se publique una.</Empty>
            ) : (
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
            )}
          </Load>
        </div>
        {wide && q.data?.offers.length > 0 && <aside className="col-side col-side--panel"><OfertaDetalle id={selected ?? q.data.offers[0].id} onChange={q.reload} compact /></aside>}
      </div>
      {me.canPublish && <a className="fab press only-mobile" href="#/ofertas/publicar" aria-label="Publicar oferta"><Icon name="plus" size={24} /></a>}
    </>
  );
}

export function Oferta({ params }) {
  return <OfertaDetalle id={params.id} />;
}

function OfertaDetalle({ id, onChange, compact = false }) {
  const { api, photos, celebrate, toast } = useApp();
  const q = useApi(api, 'offer', { id }, [id]);
  const [busy, setBusy] = useState(false);
  const btn = useRef(null);
  return (
    <Load q={q} skeleton={<><div className="skel" style={{ aspectRatio: '16/8' }} /><Skeleton h={40} n={4} /></>}>
      {({ offer: o }) => {
        const toggle = async () => {
          if (busy) return;
          setBusy(true);
          try {
            const r = await api('offer.interest', { id: o.id, on: !o.isInterested });
            q.setData({ offer: r.offer });
            onChange?.();
            if (r.offer.isInterested) {
              // La celebración grande, una vez por sesión; después, un confeti pequeño desde el botón.
              let first = true;
              try { first = !sessionStorage.getItem('pd-c2'); sessionStorage.setItem('pd-c2', '1'); } catch {}
              if (first) celebrate({ kind: 'interest', title: '¡Apuntado!', text: `${o.contact} verá tu perfil y tu CV. Si encaja, te escribirá.`, people: r.offer.interestedPeople, count: r.offer.interestedCount });
              else { burst(btn.current); navigator.vibrate?.(12); }
            } else toast('Ya no te interesa esta oferta');
          } catch (e) { toast(e.message); } finally { setBusy(false); }
        };
        return (
          <article className="oferta">
            <div className="offer-cover" style={{ backgroundImage: `url(${photos[o.cover]})` }} role="img" aria-label="Foto de la oferta"><OfferLogo company={o.company} size={72} /></div>
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
              <button ref={btn} className={`btn btn--block press btn-morph ${o.isInterested ? 'btn--soft' : 'btn--lime'}`} onClick={toggle} aria-busy={busy} aria-pressed={o.isInterested}>
                <span key={String(o.isInterested)} className="btn-label">{o.isInterested ? <><Icon name="check" size={18} className="check-draw" /> Te interesa</> : 'Me interesa'}</span>
              </button>
              <p className="t-soft" style={{ fontSize: 14 }}>{o.isInterested ? 'Toca otra vez para quitarlo.' : `${o.contact} verá tu perfil y tu CV.`}</p>
            </div>
          </article>
        );
      }}
    </Load>
  );
}

export function Interesados({ params }) {
  const { api } = useApp();
  const q = useApi(api, 'offer.interested', { id: params.id }, [params.id]);
  return (
    <>
      <PageTitle eyebrow="Mis ofertas">Interesados</PageTitle>
      <Load q={q} skeleton={<Skeleton h={88} n={4} />}>
        {(d) => d.people.length === 0 ? <Empty icon="users" title="Aún no se ha apuntado nadie">Compártela en el grupo de socios para que la vean.</Empty> : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.people.map((x) => (
              <li key={x.id} className="card person-row">
                <Avatar person={x} size={52} />
                <span className="who"><a className="name" href={`#/persona/${x.id}`} style={{ display: 'block' }}>{x.name}</a><span className="meta" style={{ display: 'block' }}>{x.career} · {x.course} · {roleLine(x)}</span></span>
                <TypeTag code={x.type} family={x.family} />
                <a className="btn btn--soft btn--icon press" href="#" onClick={(e) => e.preventDefault()} aria-label={`CV de ${x.name}`}><Icon name="file-text" /></a>
              </li>
            ))}
          </ul>
        )}
      </Load>
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
