import { useRef } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Load, Sheet, Skeleton, Stack, roleLine, useApp } from '../ui/pieces.jsx';
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
      <Load q={q} skeleton={<><div className="skel" style={{ height: 108 }} /><div className="map-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 220 }} />)}</div></>}>
        {(d) => {
          const all = d.families.flatMap((f) => f.types);
          const mine = all.find((t) => t.code === d.myType);
          const max = Math.max(...all.map((t) => t.count));
          return (
            <>
              <a className="mytype press" href={`#/mapa/${d.myType}`}>
                <b>{d.myType}</b>
                <span className="grow">
                  <span style={{ fontWeight: 700, display: 'block', fontSize: 17 }}>Tu tipo · {TYPE_NAMES[d.myType]}</span>
                  <span className="mytype-people"><Stack people={mine.faces} /><span>{mine.count - 1} personas más lo comparten</span></span>
                </span>
                <Icon name="chevron-right" />
              </a>
              <p className="t-soft map-help">Cada burbuja es un tipo; cuanto más grande, más gente. Toca una para ver quién es.</p>
              <div className="map-grid">
                {d.families.map((f) => (
                  <section key={f.id} className={`zone zone--${f.color}`} aria-labelledby={`fam-${f.id}`}>
                    <div className="zone-h"><h2 id={`fam-${f.id}`}>{f.name}</h2><span className="t-mono num">{f.total}</span></div>
                    <div className="bubbles">
                      {f.types.map((t, i) => {
                        const size = 42 + (t.count / max) * 30; // 42-72 px: dos por fila en el móvil
                        return (
                          <a key={t.code} href={`#/mapa/${t.code}`} className={`bubble press ${t.code === d.myType ? 'is-me' : ''}`} style={{ '--b': `${size}px`, '--i': i }}
                            aria-label={`${t.code}, ${t.name}: ${t.count} ${t.count === 1 ? 'persona' : 'personas'}${t.code === d.myType ? ' (tu tipo)' : ''}`}>
                            <span className="code">{t.code}</span><b className="num">{t.count}</b>
                          </a>
                        );
                      })}
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

function TypeSheet({ code: open, onClose }) {
  const { api } = useApp();
  // Mientras la hoja sale, sigue enseñando el último tipo (no se vacía a mitad de animación).
  const last = useRef(open);
  if (open) last.current = open;
  const code = last.current;
  const q = useApi(api, 'people', { type: code }, [code]);
  return (
    <Sheet open={Boolean(open)} onClose={onClose} title={code ? `${code} · ${TYPE_NAMES[code]}` : ''}>
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
