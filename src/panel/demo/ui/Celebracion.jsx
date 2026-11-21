import { useEffect, useRef } from 'react';
import { Sello, Stack, useDialogFocus } from './pieces.jsx';

// Celebraciones (C1 sello nuevo, C2 ¡apuntado!, bienvenida). Son momentos raros,
// así que pueden tener más fiesta que el resto de la interfaz.
export default function Celebracion({ party, onClose }) {
  const btn = useRef(null);
  const box = useRef(null);
  useDialogFocus(box);
  useEffect(() => {
    btn.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    let cancelled = false;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      import('canvas-confetti').then(({ default: confetti }) => {
        if (cancelled) return;
        const colors = ['#d6ff4f', '#8ee1e6', '#b6b8e7', '#f5e443', '#ffffff'];
        confetti({ particleCount: 90, spread: 75, startVelocity: 42, origin: { y: 0.42 }, colors, disableForReducedMotion: true, zIndex: 200 });
      });
      navigator.vibrate?.(party.kind === 'stamp' ? [18, 40, 28] : 14);
    }
    return () => { cancelled = true; removeEventListener('keydown', onKey); };
  }, [party, onClose]);

  return (
    <div className="party" role="dialog" aria-modal="true" aria-labelledby="party-t" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="party-card" ref={box}>
        {party.stamp && (party.stamp.pending
          ? <span className="party-pending"><Sello stamp={party.stamp} size={130} rotate={-6} /><span className="t-mono">Al fichar</span></span>
          : <Sello stamp={party.stamp} size={150} rotate={-10} className="party-stamp" />)}
        {party.people && <div className="party-people"><Stack people={party.people} /><span className="num">{party.count} de Start</span></div>}
        <h2 id="party-t" className="t-marker">{party.title}</h2>
        <p>{party.text}</p>
        {party.levelUp && <p className="party-level">Subes a nivel {party.level.n} · {party.level.name}</p>}
        <button ref={btn} className="btn btn--lime btn--block press" onClick={() => { onClose(); party.onDone?.(); }}>{party.cta ?? 'Genial'}</button>
      </div>
    </div>
  );
}
