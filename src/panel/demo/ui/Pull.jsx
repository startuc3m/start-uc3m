import { useEffect, useRef, useState } from 'react';
import symbol from '../assets/start-symbol.svg?raw';

// Tirar para recargar (solo táctil y solo con la página arriba del todo).
// El dedo manda: la distancia sigue al dedo con resistencia y, al soltar pasado el
// umbral, se queda recargando hasta que termina.
const THRESHOLD = 72;

export function usePull(onRefresh) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);
  useEffect(() => {
    const down = (e) => { if (scrollY <= 0 && e.touches.length === 1 && !refreshing) start.current = e.touches[0].clientY; };
    const move = (e) => {
      if (start.current == null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0) { pullRef.current = 0; setPull(0); return; }
      const d = Math.min(130, dy * 0.5); // resistencia: el indicador va a la mitad que el dedo
      pullRef.current = d;
      setPull(d);
    };
    const up = async () => {
      if (start.current == null) return;
      start.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true); setPull(THRESHOLD * 0.8);
        navigator.vibrate?.(10);
        await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 700))]);
        setRefreshing(false);
      }
      pullRef.current = 0; setPull(0);
    };
    addEventListener('touchstart', down, { passive: true });
    addEventListener('touchmove', move, { passive: true });
    addEventListener('touchend', up);
    addEventListener('touchcancel', up);
    return () => { removeEventListener('touchstart', down); removeEventListener('touchmove', move); removeEventListener('touchend', up); removeEventListener('touchcancel', up); };
  }, [onRefresh, refreshing]);
  return { pull, refreshing };
}

export function PullIndicator({ pull, refreshing }) {
  const p = Math.min(1, pull / THRESHOLD);
  return (
    <div className={`pull ${refreshing ? 'is-refreshing' : ''} ${pull ? 'is-pulling' : ''}`} style={{ height: pull }} aria-hidden={!refreshing}>
      <span className="pull-mark" style={{ opacity: p, transform: `rotate(${p * 270}deg) scale(${0.6 + p * 0.4})` }} dangerouslySetInnerHTML={{ __html: symbol }} />
      {refreshing && <span className="sr-only" role="status">Actualizando</span>}
    </div>
  );
}
