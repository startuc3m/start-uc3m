import { useState } from 'react';
import Icon from './ui/Icon.jsx';
import { Sheet, useApp } from './ui/pieces.jsx';
import { clearApiCache, go } from './router.js';
import { VIEW_AS } from './data.js';

// Botón «Demo»: solo existe en el prototipo. Sirve para probar estados y
// animaciones sin tener que provocarlos de verdad.
export default function DemoPanel() {
  const { api, demo, themePref, setTheme, refreshMe, toast, reloadScreen } = useApp();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(demo.getSettings);
  const update = async (patch) => {
    const r = await api('demo.settings', patch);
    clearApiCache();
    setS(r.settings);
    reloadScreen(); // la pantalla actual vuelve a pedir sus datos con el ajuste nuevo
    refreshMe();
  };
  const Opt = ({ k, v, label }) => <button className="pill press" aria-pressed={s[k] === v} onClick={() => update({ [k]: v })}>{label}</button>;
  const T = ({ v, label, icon }) => <button className="pill press" aria-pressed={themePref === v} onClick={() => setTheme(v)}>{icon && <Icon name={icon} size={14} />} {label}</button>;
  return (
    <>
      <button className="demo-fab press" onClick={() => setOpen(true)} aria-haspopup="dialog"><Icon name="sliders" size={14} /> DEMO</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Panel de la demo">
        <div className="demo-panel">
          <p className="t-soft" style={{ fontSize: 14 }}>Datos inventados. Lo que hagas se guarda en este navegador.</p>
          <div className="row row--wrap"><span>Ver como</span><span className="opts opts--wrap">{Object.entries(VIEW_AS).map(([k, v]) => <Opt key={k} k="viewAs" v={k} label={v.label} />)}</span></div>
          <div className="row"><span>Tema</span><span className="opts"><T v="system" label="Auto" /><T v="light" label="Claro" icon="sun" /><T v="dark" label="Oscuro" icon="moon" /></span></div>
          <div className="row"><span>Red</span><span className="opts"><Opt k="latency" v="none" label="Instantánea" /><Opt k="latency" v="normal" label="Normal" /><Opt k="latency" v="slow" label="Lenta" /></span></div>
          <div className="row"><span>Sin datos</span><span className="opts"><Opt k="empty" v={false} label="No" /><Opt k="empty" v={true} label="Sí" /></span></div>
          <div className="row"><span>Datos extremos</span><span className="opts"><Opt k="extreme" v={false} label="No" /><Opt k="extreme" v={true} label="Sí" /></span></div>
          <div className="row"><span>Reloj</span><span className="opts"><Opt k="later" v={false} label="Ahora" /><Opt k="later" v={true} label="+24 h" /></span></div>
          <div className="row"><span>Sin conexión</span><span className="opts"><Opt k="error" v={false} label="No" /><Opt k="error" v={true} label="Sí" /></span></div>
          <p className="t-mono t-soft" style={{ marginTop: 8 }}>Lanzar</p>
          <div className="opts" style={{ flexWrap: 'wrap', display: 'flex', gap: 6 }}>
            <button className="pill press" onClick={async () => { await update({ viewAs: 'eventos' }); setOpen(false); go('/evento/taller-ventas'); }}>Confirmar asistencia (Eventos)</button>
            <button className="pill press" onClick={() => { setOpen(false); go('/acceso'); }}>Acceso y alta</button>
            <button className="pill press" onClick={() => { setOpen(false); go('/perfil/editar'); }}>Editar perfil</button>
          </div>
          <button className="btn btn--ghost btn--block press" style={{ marginTop: 12 }} onClick={async () => { await api('demo.reset'); clearApiCache(); setS(demo.getSettings()); await refreshMe(); setOpen(false); go('/inicio', { replace: true }); toast('Demo reiniciada'); }}><Icon name="rotate-ccw" size={18} /> Reiniciar demo</button>
        </div>
      </Sheet>
    </>
  );
}
