import { useDeferredValue, useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, Load, Skeleton, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { PageTitle } from './comunidad.jsx';

// Gestión de la APP (no de la web). Editar la web (Start Skills, eventos, blog) es cosa
// del gestor de contenidos de la web y va aparte. Aquí solo lo que pasa dentro de la app:
// oportunidades, puntos y personas con su cargo. Reglas de docs/panel-roles.md (PR #87).

// Quién puede hacer qué dentro de la app. Columnas: socio, starter, responsable, IT autorizado, junta.
const MATRIX = [
  ['Usar la app y tener perfil y CV', ['✓', '✓', '✓', '✓', '✓']],
  ['Publicar oportunidades y ver a sus interesados', ['', '', '✓', '', '✓']],
  ['Decidir cuántos puntos vale cada evento', ['', '', '', '', '✓']],
  ['Ver apuntados y confirmar la asistencia a eventos', ['', 'Eventos o RRHH', 'Eventos o RRHH', '', '✓']],
  ['Invitar a socios nuevos con tu QR (Comunidad) y sumar puntos', ['✓', '✓', '✓', '✓', '✓']],
];
const COLS = ['Socio', 'Starter', 'Responsable', 'IT autorizado', 'Junta'];
export const colOf = (me) => (me.kind !== 'starter' ? 0 : me.position === 'junta' ? 4 : me.manage_users && me.department === 'IT' ? 3 : me.position === 'responsable' ? 2 : 1);

export function Gestion() {
  const { me } = useApp();
  const col = colOf(me);
  // En el móvil la tabla no cabe: se desplaza sola para que tu columna quede a la vista.
  const wrap = useRef(null);
  useEffect(() => {
    const w = wrap.current, th = w?.querySelector('thead .is-me');
    if (w && th && w.scrollWidth > w.clientWidth) w.scrollLeft = Math.max(0, th.offsetLeft + th.offsetWidth / 2 - w.clientWidth / 2 - 80);
  }, [col]);
  const actions = [
    me.canPublish && ['plus', 'Publicar una oportunidad', 'Prácticas, proyectos, becas… Te llegan los interesados con su CV.', '#/ofertas/publicar'],
    me.canPublish && ['briefcase', 'Tus oportunidades publicadas', 'Ver interesados, filtrar y contactar.', '#/ofertas/mias'],
    (['Eventos', 'RRHH'].includes(me.department) || me.position === 'junta') && ['users', 'Asistencia a eventos', 'Abre un evento, mira los apuntados y marca quién vino. A las 24 h les llegan los puntos y el sello.', '#/eventos/pasados'],
  ].filter(Boolean);
  const { api } = useApp();
  const sum = useApi(api, 'gestion.summary', {}, []);
  const st = sum.data;
  const stats = st ? [
    st.offers && ['briefcase', st.offers.published, st.offers.published === 1 ? 'oportunidad publicada' : 'oportunidades publicadas', `${st.offers.interested} interesados · ${st.offers.fresh} nuevos`, '#/ofertas/mias'],
    st.attendance && ['users', st.attendance.open, st.attendance.open === 1 ? 'evento con asistencia abierta' : 'eventos con asistencia abierta', 'Se cierra 24 h después del evento', '#/eventos/pasados'],
  ].filter(Boolean) : [];
  return (
    <>
      <PageTitle eyebrow="Mi perfil" sub="Lo que puedes hacer dentro de la app con tu cargo.">Gestión</PageTitle>
      {stats.length > 0 && (
        <ul className="gest-stats">
          {stats.map(([icon, n, label, sub, href]) => <li key={label}><a className="card gest-stat press" href={href}><span className="gest-ico"><Icon name={icon} size={20} /></span><b className="num">{n}</b><span className="gest-stat-l">{label}</span><span className="t-soft">{sub}</span></a></li>)}
        </ul>
      )}
      <div className="card gest-me">
        <Avatar person={me} size={52} lime />
        <span className="grow"><span className="t-mono t-soft">Tu cargo</span><b>{me.positionLabel}</b></span>
      </div>
      <section className="home-sec" aria-label="Lo que puedes hacer">
        <h2 className="t-h home-h">Lo que puedes hacer</h2>
        {actions.length === 0 ? (
          <p className="card form t-soft">Con tu cargo no hay nada que gestionar: usas la app como todo el mundo. Si necesitas algún permiso, pídeselo a IT o a la Junta.</p>
        ) : (
          <ul className="gest-actions">
            {actions.map(([icon, t, sub, href]) => (
              <li key={t}><a className="card gest-action press" href={href}><span className="gest-ico"><Icon name={icon} size={20} /></span><span className="grow"><b>{t}</b><span className="t-soft">{sub}</span></span><Icon name="chevron-right" className="t-soft" /></a></li>
            ))}
          </ul>
        )}
      </section>
      <section className="home-sec" aria-labelledby="matrix-t">
        <h2 id="matrix-t" className="t-h home-h">Quién puede hacer qué</h2>
        <div className="matrix-wrap card" ref={wrap}>
          <table className="matrix">
            <thead><tr><th scope="col"><span className="sr-only">Acción</span></th>{COLS.map((c, i) => <th key={c} scope="col" className={i === col ? 'is-me' : ''}>{c}{i === col && <span className="matrix-you">Tú</span>}</th>)}</tr></thead>
            <tbody>
              {MATRIX.map(([label, cells]) => (
                <tr key={label}><th scope="row">{label}</th>{cells.map((v, i) => <td key={i} className={i === col ? 'is-me' : ''}>{v === '✓' ? <Icon name="check" size={16} stroke={3} title="Sí" /> : v ? <span className="matrix-note">{v}</span> : <span className="matrix-no" aria-label="No">·</span>}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="set-foot">Los cargos y permisos los gestionan IT y la Junta fuera de la app. Editar la web (Start Skills, eventos, blog) va aparte, en el gestor de contenidos de la web.</p>
      </section>
    </>
  );
}
