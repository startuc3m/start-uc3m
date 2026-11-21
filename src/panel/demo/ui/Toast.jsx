import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

// Aviso breve. La región viva existe siempre (los lectores de pantalla solo anuncian
// cambios dentro de una región que ya estaba). Entra y sale por abajo con transiciones,
// no con keyframes: si llegan dos seguidos, el segundo retoma desde donde va el primero.
export default function Toast({ msg, onAction }) {
  const [shown, setShown] = useState(null);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (msg) { setShown(msg); setLeaving(false); return; }
    if (!shown) return;
    setLeaving(true);
    const t = setTimeout(() => { setShown(null); setLeaving(false); }, 220);
    return () => clearTimeout(t);
  }, [msg]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {shown && (
        <div key={shown.id} className={`toast ${leaving ? 'is-leaving' : ''}`}>
          <Icon name="check" size={18} /><span>{shown.text}</span>
          {shown.action && <button className="toast-action press" onClick={() => { shown.action.run(); onAction?.(); }}>{shown.action.label}</button>}
        </div>
      )}
    </div>
  );
}
