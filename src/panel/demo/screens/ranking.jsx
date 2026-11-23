import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, FakeQr, Load, Rolling, Sello, Skeleton, roleLine, useApp } from '../ui/pieces.jsx';
import { go, useApi } from '../router.js';
import { ComunidadHead, PageTitle } from './comunidad.jsx';

// Puntos y Starter del mes. Se suman los puntos de cada evento al escanear su QR (si vale algo) y los QR de puntos:
// solo la Junta los crea y cada persona puede escanear cada uno una vez. Ranking: solo Starters.
export function Ranking() {
  const { api, me } = useApp();
  const q = useApi(api, 'ranking', {}, []);
  return (
    <>
      <ComunidadHead current="ranking" />
      <p className="t-soft" style={{ fontSize: 14 }}>Puntos: los que valga cada evento al escanear su QR (si vale algo), más los QR de puntos de la Junta. Cada QR se escanea una vez.</p>
      <Load q={q} skeleton={<><div className="skel" style={{ height: 170 }} /><Skeleton h={60} n={6} /></>}>
        {(d) => (
          <div className="two-col">
            <div className="col-main">
              <StarterMes s={d.starterOfMonth} />
              {d.canCreateQr && <a className="card give-hint press" href="#/puntos/crear"><Icon name="qr-code" size={18} /> Crear un QR de puntos para un evento o una tarea</a>}
              <section className="home-sec" aria-label={`Ranking de ${d.month}`}>
                <div className="section-h"><h2 className="t-h home-h">Ranking de {d.month}</h2>{d.myRank && <span className="t-soft num">Vas {d.myRank}.º</span>}</div>
                {d.ranking.length === 0 ? <Empty icon="sparkles" title="Aún no hay puntos este mes">Se suman al escanear el QR de cada evento.</Empty> : (
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

// Crear QR de puntos (solo Junta): puntos + motivo → un QR. Quien lo escanea suma
// los puntos una vez; debajo, los QR creados y cuánta gente los ha escaneado.
export function PuntosCrear() {
  const { api, me, toast } = useApp();
  const list = useApi(api, 'pointsqr.list', {}, []);
  const [n, setN] = useState(10);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState(null);
  if (me.position !== 'junta') return <><PageTitle eyebrow="Puntos">QR de puntos</PageTitle><Empty icon="lock" title="Solo la Junta crea QR de puntos">Tú sumas puntos escaneando los QR que crea la Junta.</Empty></>;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api('pointsqr.create', { points: n, reason });
      setMade(r.qr); setReason(''); list.reload();
      navigator.vibrate?.(12);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const seed = (code) => [...code].reduce((a, c) => a + c.charCodeAt(0), 3);
  const copy = async (q) => { const url = `https://www.startuc3m.es/panel/#${q.path}`; try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch { toast(url); } };
  return (
    <>
      <PageTitle eyebrow="Gestión" sub="Pon los puntos y el motivo. Cada persona puede escanear el QR una sola vez.">QR de puntos</PageTitle>
      <div className="two-col">
        <div className="col-main">
          <form className="card form" onSubmit={submit} noValidate>
            <div className="field">
              <label>Puntos</label>
              <div className="pills" role="radiogroup" aria-label="Puntos">{[5, 10, 20, 30, 50].map((v) => <button key={v} type="button" role="radio" aria-checked={n === v} aria-pressed={n === v} className="pill press" onClick={() => setN(v)}>+{v}</button>)}</div>
            </div>
            <div className="field">
              <label htmlFor="qr-r">Para qué es</label>
              <input id="qr-r" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Montaje del Start to Invest" aria-invalid={Boolean(err)} aria-describedby={err ? 'qr-e' : undefined} />
              {err && <p id="qr-e" className="err">{err}</p>}
            </div>
            <button className="btn btn--primary btn--block press" disabled={busy}><Icon name="qr-code" size={18} /> {busy ? 'Creando…' : `Crear QR de ${n} puntos`}</button>
          </form>
          {made && (
            <div className="card form" role="status" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 220, maxWidth: '70%', padding: 14, background: '#fff', color: '#13133d', borderRadius: 16 }}><FakeQr seed={seed(made.code)} label={`QR de ${made.points} puntos`} /></div>
              <b style={{ fontSize: 20 }}>+{made.points} puntos · {made.reason}</b>
              <p className="t-soft" style={{ fontSize: 14 }}>Código {made.code}. Cada persona puede escanearlo una vez.</p>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button type="button" className="btn btn--soft press" onClick={() => copy(made)}>Copiar enlace</button>
                <a className="btn btn--lime btn--block press" href={`#${made.path}`}>Probar escaneo (demo)</a>
              </div>
            </div>
          )}
        </div>
        <aside className="col-side">
          <div className="card form">
            <b>QR creados</b>
            <Load q={list} skeleton={<Skeleton h={48} n={3} />}>
              {(d) => d.qrs.length === 0 ? <p className="t-soft">Aún no hay ninguno.</p> : (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {d.qrs.map((q) => (
                    <li key={q.code} className="feed-row">
                      <span className="grow"><b style={{ display: 'block' }}>+{q.points} · {q.reason}</b><span className="t-soft num" style={{ fontSize: 13 }}>{q.code} · {q.scanCount} {q.scanCount === 1 ? 'escaneo' : 'escaneos'}</span></span>
                      <a className="link" href={`#${q.path}`}>Probar</a>
                    </li>
                  ))}
                </ul>
              )}
            </Load>
          </div>
        </aside>
      </div>
    </>
  );
}

// Lo que se abre al escanear un QR: el de un evento (sello y, si vale algo, puntos) o uno de
// puntos de la Junta. Suma una sola vez y lo dice; un sello nuevo se celebra.
export function PuntosEscanear({ params }) {
  const { api, refreshMe, celebrate } = useApp();
  const [res, setRes] = useState(null);
  const done = useRef(null);
  useEffect(() => {
    if (done.current === params.code) return; // una sola petición por QR, aunque React monte dos veces
    done.current = params.code;
    api('pointsqr.claim', { code: params.code })
      .then((r) => {
        setRes({ ok: true, ...r }); refreshMe(); navigator.vibrate?.([12, 40, 12]);
        if (r.stamp && r.isNew) celebrate({ kind: 'stamp', title: '¡Sello nuevo!', text: `${r.reason}: ya tienes el sello ${r.stamp.label}.${r.points ? ` +${r.points} puntos.` : ''}`, stamp: r.stamp, level: r.level, levelUp: r.levelUp, cta: 'Ver mis sellos', onDone: () => go('/perfil') });
      })
      .catch((e) => setRes({ ok: false, message: e.message }));
  }, [params.code]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!res) return <p role="status">Leyendo el QR…</p>;
  return (
    <div className="card form" role="status" style={{ alignItems: 'center', textAlign: 'center', padding: 28 }}>
      {res.ok ? (
        <>
          {res.stamp ? <Sello stamp={res.stamp} size={110} rotate={-6} /> : <span className="aldia-check" style={{ transform: 'none', opacity: 1 }}><Icon name="check" size={30} stroke={3} /></span>}
          <h1 className="t-display" style={{ fontSize: 48 }}>{res.points > 0 ? `+${res.points} puntos` : `Sello ${res.stamp?.label}`}_</h1>
          <p className="t-soft">{res.reason}.{res.points > 0 ? <> Ya llevas <b className="num">{res.total}</b> puntos este mes.</> : res.isNew ? ' Ya está en tu perfil.' : ' Ya lo tenías en tu perfil.'}</p>
        </>
      ) : (
        <>
          <Icon name="qr-code" size={34} />
          <h1 className="t-h">No se han sumado puntos</h1>
          <p className="t-soft">{res.message}</p>
        </>
      )}
      {res.ok && res.stamp && !res.points ? <a className="btn btn--primary press" href="#/perfil">Ver mis sellos</a> : <a className="btn btn--primary press" href="#/comunidad/ranking">Ver ranking</a>}
    </div>
  );
}
