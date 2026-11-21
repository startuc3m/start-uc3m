import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { FakeQr, useApp } from './pieces.jsx';
import { go } from '../router.js';

// QR a pantalla grande para fichar en la entrada de un evento. El QR "crece" desde el
// carné (transición de elemento compartido, ver openQr en PanelDemo). Mientras está
// abierto, la pantalla no se apaga (Wake Lock) para que el anfitrión pueda escanearlo.
export default function QrModal({ onClose }) {
  const { me, api, refreshMe, celebrate, toast } = useApp();
  const [phase, setPhase] = useState('idle'); // idle → scanning → ok
  const close = useRef(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    let lock = null;
    navigator.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {});
    return () => { removeEventListener('keydown', onKey); lock?.release().catch(() => {}); };
  }, [onClose]);

  // Solo en la demo: simula que alguien del equipo escanea tu QR en la puerta.
  const simulate = async () => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    const [r] = await Promise.all([api('checkin', { stamp: 'invest' }), new Promise((ok) => setTimeout(ok, 900))]);
    setPhase('ok');
    navigator.vibrate?.(20);
    await new Promise((ok) => setTimeout(ok, 650));
    await refreshMe();
    onClose();
    if (r.isNew) celebrate({ kind: 'stamp', title: '¡Sello nuevo!', text: `Has fichado en ${r.stamp.name}. Ya llevas ${r.level.count} sellos.`, stamp: r.stamp, level: r.level, levelUp: r.levelUp, cta: 'Ver mis sellos', onDone: () => go('/perfil') });
    else toast('Ya habías fichado en este evento');
  };

  return (
    <div className="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-t" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qr-card">
        <button ref={close} className="qr-close press" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={22} /></button>
        <p id="qr-t" className="t-mono">Enséñalo en la entrada</p>
        <div className={`qr-huge is-${phase}`} style={{ viewTransitionName: 'my-qr' }}>
          <FakeQr seed={me.number} />
          <span className="qr-beam" aria-hidden="true" />
          {phase === 'ok' && <span className="qr-ok" aria-hidden="true"><Icon name="check" size={56} stroke={3} /></span>}
        </div>
        <p className="qr-num num">Nº {String(me.number).padStart(4, '0')}</p>
        <p className="qr-name">{me.name}</p>
        <p className="qr-hint"><Icon name="sun-dim" size={16} /> Sube el brillo para que se lea a la primera</p>
        <p className="sr-only" aria-live="polite">{phase === 'ok' ? 'Fichado' : ''}</p>
        <button className="pill press qr-sim" onClick={simulate} disabled={phase !== 'idle'}>
          <span className="t-mono">Demo</span> {phase === 'idle' ? 'Simular que te escanean' : phase === 'scanning' ? 'Escaneando…' : '¡Fichado!'}
        </button>
      </div>
    </div>
  );
}
