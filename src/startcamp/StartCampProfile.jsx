import React, { lazy, Suspense, useEffect, useState } from 'react';
import AvatarForm from './AvatarForm.jsx';
import { CADUCIDAD_URL_FOTO_S, cerrarSesion, observarSesion, obtenerParticipantes } from './api.js';

const CurvedArcStart = lazy(() => import('../components/curved_arc/curved_arc_start'));

function Participantes({ onSinSesion }) {
  const [personas, setPersonas] = useState(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    let ultimaCarga = 0;
    const renovarMs = (CADUCIDAD_URL_FOTO_S - 300) * 1000;
    setError(false);
    const cargar = (inicial = false) => obtenerParticipantes().then((rows) => {
      if (activo) { setPersonas(rows); ultimaCarga = Date.now(); }
    }).catch((err) => {
      if (!activo) return;
      if (['SIN_SESION', 'SESION_CADUCADA'].includes(err.codigo)) onSinSesion();
      else if (inicial) setError(true);
    });
    cargar(true);
    const alVolver = () => {
      if (!document.hidden && Date.now() - ultimaCarga >= renovarMs) cargar();
    };
    const timer = setInterval(alVolver, renovarMs);
    document.addEventListener('visibilitychange', alVolver);
    return () => { activo = false; clearInterval(timer); document.removeEventListener('visibilitychange', alVolver); };
  }, [intento, onSinSesion]);

  if (error) return <div role="alert">No hemos podido cargar los participantes. <button className="btn btn-primary" onClick={() => setIntento((n) => n + 1)}>Reintentar</button></div>;
  if (personas === null) return <p role="status">Cargando participantes…</p>;
  if (!personas.length) return <p>Aún no hay perfiles de participantes.</p>;
  return <Suspense fallback={<p role="status">Cargando directorio…</p>}><CurvedArcStart participants={personas} /></Suspense>;
}

export default function StartCampProfile() {
  const [sesion, setSesion] = useState(null);
  const [error, setError] = useState(false);
  const [vista, setVista] = useState(() => new URLSearchParams(window.location.search).get('vista') === 'participantes' ? 'participantes' : 'perfil');

  useEffect(() => {
    let activo = true;
    let soltar;
    observarSesion((abierta) => { if (activo) setSesion(abierta); }).then((cleanup) => {
      if (activo) soltar = cleanup;
      else cleanup();
    }).catch(() => { if (activo) setError(true); });
    return () => { activo = false; soltar?.(); };
  }, []);

  function cambiarVista(nueva) {
    setVista(nueva);
    const url = new URL(window.location.href);
    if (nueva === 'participantes') url.searchParams.set('vista', nueva);
    else url.searchParams.delete('vista');
    window.history.replaceState(null, '', url);
    if (nueva === 'participantes' && !sesion) document.getElementById('av-email')?.focus();
  }

  const sinSesion = React.useCallback(() => setSesion(false), []);

  if (error) return <p role="alert">No hemos podido comprobar tu sesión. Recarga la página para reintentar.</p>;
  if (sesion === null) return <p role="status">Comprobando sesión…</p>;

  return <>
    {sesion && <nav aria-label="Start Camp" className="mb-8 flex flex-wrap gap-3">
      <button className="btn btn-outline text-cobalt" aria-pressed={vista === 'perfil'} onClick={() => cambiarVista('perfil')}>Mi perfil</button>
      <button className="btn btn-primary" aria-pressed={vista === 'participantes'} onClick={() => cambiarVista('participantes')}>Ver participantes</button>
    </nav>}
    {!sesion && vista === 'participantes' && <p role="status" className="mb-6 rounded-brand bg-lime p-4 font-semibold text-ink">Inicia sesión para ver al resto</p>}
    {sesion && vista === 'participantes' ? <>
      <button className="mb-6 underline text-cobalt" onClick={async () => {
        try { await cerrarSesion(); sinSesion(); }
        catch { setError(true); }
      }}>Cerrar sesión</button>
      <Participantes onSinSesion={sinSesion} />
    </> : <AvatarForm onSesionCerrada={sinSesion} />}
  </>;
}
