import { Avatar, Load, Sheet, Skeleton, roleLine, useApp } from '../ui/pieces.jsx';
import { go, useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';
import { TYPE_NAMES } from '../data.js';

export function Mapa({ params }) {
  const { api } = useApp();
  const q = useApi(api, 'map', {}, []);
  const open = params.tipo ?? null;
  return (
    <>
      <PageTitle eyebrow="Mapa">Start por personalidades</PageTitle>
      <Load q={q} skeleton={<><div className="skel" style={{ height: 96 }} /><Skeleton h={170} n={4} /></>}>
        {(d) => {
          const mine = d.families.flatMap((f) => f.types).find((t) => t.code === d.myType);
          return (
            <>
              <a className="mytype press" href={`#/mapa/${d.myType}`}>
                <b>{d.myType}</b>
                <span><span style={{ fontWeight: 700, display: 'block', fontSize: 17 }}>Tu tipo · {TYPE_NAMES[d.myType]}</span><span style={{ color: 'var(--lavender)' }}>{mine.count - 1} personas más lo comparten</span></span>
              </a>
              <div className="families">
                {d.families.map((f) => (
                  <section key={f.id} className={`family bg-${f.color}`} aria-labelledby={`fam-${f.id}`}>
                    <div className="section-h"><h2 id={`fam-${f.id}`}>{f.name}</h2><span className="t-mono num">{f.total} personas</span></div>
                    <div className="types">
                      {f.types.map((t) => (
                        <a key={t.code} className="type press" href={`#/mapa/${t.code}`} aria-current={t.code === d.myType ? 'true' : undefined} aria-label={`${t.code}, ${t.name}: ${t.count} personas`}>
                          {t.code}<b className="num">{t.count}</b>
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          );
        }}
      </Load>
      <TypeSheet code={open} onClose={() => go('/mapa', { replace: true })} />
    </>
  );
}

function TypeSheet({ code, onClose }) {
  const { api } = useApp();
  const q = useApi(api, 'people', { type: code }, [code]);
  return (
    <Sheet open={Boolean(code)} onClose={onClose} title={code ? `${code} · ${TYPE_NAMES[code]}` : ''}>
      <Load q={q} skeleton={<Skeleton h={64} n={3} />}>
        {(d) => d.people.length === 0 ? <p className="t-soft">Aún no hay nadie con este tipo. ¿Serás la primera persona?</p> : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.people.map((x) => (
              <li key={x.id}><a className="card person-row press" href={`#/persona/${x.id}`} style={{ padding: 10 }}><Avatar person={x} size={44} /><span className="who"><span className="name" style={{ display: 'block', fontSize: 16 }}>{x.name}</span><span className="meta" style={{ display: 'block', fontSize: 14 }}>{x.career} · {roleLine(x)}</span></span></a></li>
            ))}
          </ul>
        )}
      </Load>
    </Sheet>
  );
}
