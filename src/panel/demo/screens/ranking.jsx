import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, FakeQr, Load, Rolling, Sello, Skeleton, roleLine, useApp } from '../ui/pieces.jsx';
import { go, useApi } from '../router.js';
import { ComunidadHead, PageTitle } from './comunidad.jsx';

// Puntos y Starter del mes. Se suman los puntos de cada evento al que asistes (se confirma la
// asistencia y llegan 24 h después). Ranking: solo Starters.
export function Ranking() {
  const { api, me } = useApp();
  const q = useApi(api, 'ranking', {}, []);
  return (
    <>
      <ComunidadHead current="ranking" />
      <p className="t-soft" style={{ fontSize: 14 }}>Puntos: los de cada evento al que asistes (se confirma tu asistencia y llegan 24 h después).</p>
      <Load q={q} skeleton={<><div className="skel" style={{ height: 170 }} /><Skeleton h={60} n={6} /></>}>
        {(d) => (
          <div className="two-col">
            <div className="col-main">
              <StarterMes s={d.starterOfMonth} />
              <section className="home-sec" aria-label={`Ranking de ${d.month}`}>
                <div className="section-h"><h2 className="t-h home-h">Ranking de {d.month}</h2>{d.myRank && <span className="t-soft num">Vas {d.myRank}.º</span>}</div>
                {d.ranking.length === 0 ? <Empty icon="sparkles" title="Aún no hay puntos este mes">Llegan 24 h después de cada evento al que asistes.</Empty> : (
                  <ol className="card rank">
                    {d.ranking.map((x, i) => (
                      <li key={x.id} className={`rank-row ${x.id === me.id ? 'is-me' : ''}`}>
                        <span className={`rank-n num ${i < 3 ? `is-top is-${i + 1}` : ''}`}>{i + 1}</span>
                        <a className="rank-who press" href={`#/persona/${x.id}`}><Avatar person={x} size={40} lime={x.id === me.id} /><span className="grow"><b>{x.id === me.id ? 'Tú' : x.name}</b><span className="t-soft">{roleLine(x)}</span></span></a>
                        <b className="rank-pts num"><Rolling value={x.points} /> <small>pts</small></b>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              {me.kind !== 'starter' && <p className="t-soft" style={{ fontSize: 14 }}>Como socio no entras en el ranking: es para el equipo de Start. Tus sellos siguen sumando en tu perfil.</p>}
            </div>
            <aside className="col-side">
              <div className="card form"><b>Cómo se elige</b><p className="t-soft" style={{ fontSize: 14 }}>Gana quien más puntos tenga al cerrar el mes. Sale en la portada de la web con su LinkedIn solo si ha dado su consentimiento.</p><p className="t-soft" style={{ fontSize: 13 }}>Por decidir con la Junta: cuántos puntos vale cada cosa y si el ganador lo valida la Junta.</p></div>
            </aside>
          </div>
        )}
      </Load>
    </>
  );
}

// Starter del mes: tarjeta grande (Inicio y ranking). Foto del equipo de fondo, la persona en
// grande, su sello de ganador y por qué ganó. Con su LinkedIn, que es lo que le da visibilidad.
export function StarterMes({ s, compact = false }) {
  const { photos } = useApp();
  const first = s.person.name.split(' ')[0];
  return (
    <article className={`som-hero ${compact ? 'som-hero--home' : ''}`} aria-label={`Starter de ${s.month}: ${s.person.name}`}>
      <div className="som-bg" style={{ backgroundImage: `url(${photos.pitch})` }} aria-hidden="true" />
      <span className="som-stamp" aria-hidden="true"><b>Nº1</b><span>{s.month.slice(0, 3).toUpperCase()} 26</span></span>
      <p className="t-display som-kicker">Starter de {s.month}_</p>
      <div className="som-who">
        <span className="som-ring"><Avatar person={s.person} size={compact ? 84 : 104} /></span>
        <div className="som-text">
          <h3 className="som-name">{s.person.name}</h3>
          <p className="som-pos">{roleLine(s.person)}</p>
        </div>
      </div>
      <div className="som-foot">
        <span className="som-pts"><b className="num">{s.points}</b> pts</span>
        <a className="som-in press" href={s.person.linkedin} target="_blank" rel="noreferrer" aria-label={`LinkedIn de ${first}`}><Icon name="linkedin" size={18} /></a>
        {compact ? <a className="btn btn--lime press som-cta" href="#/comunidad/ranking">Ver ranking <Icon name="chevron-right" size={16} /></a>
          : <a className="btn btn--lime press som-cta" href={`#/persona/${s.person.id}`}>Ver perfil <Icon name="chevron-right" size={16} /></a>}
      </div>
    </article>
  );
}
