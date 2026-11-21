import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Avatar, Empty, Load, Skeleton, useApp } from '../ui/pieces.jsx';
import { useApi } from '../router.js';
import { ComunidadHead } from './comunidad.jsx';

// Comunidad › Canales y Mensajes. Sustituye a la comunidad de WhatsApp: los mismos
// grupos, pero dentro de la app y con la gente enlazada a su perfil.
export function Canales({ path }) {
  const { api } = useApp();
  const tab = path.endsWith('/mensajes') ? 'mensajes' : 'canales';
  const q = useApi(api, 'channels', {}, []);
  const badges = q.data ? { canales: q.data.channels.reduce((n, c) => n + c.unread, 0), mensajes: q.data.dms.reduce((n, d) => n + d.unread, 0) } : {};
  return (
    <>
      <ComunidadHead current={tab} badges={badges} />
      <Load q={q} skeleton={<Skeleton h={68} n={6} />}>
        {(d) => tab === 'canales' ? (
          d.channels.length === 0 ? <Empty icon="message-circle" title="Aún no hay canales">Cuando la Junta abra los canales del curso, aparecerán aquí.</Empty> : (
            <ul className="chan-list">
              {d.channels.map((c) => (
                <li key={c.id}>
                  <a className={`chan press ${c.unread ? 'is-unread' : ''}`} href={`#/canal/${c.id}`}>
                    <span className={`chan-ico ${c.id === 'anuncios' ? 'is-brand' : ''}`}><Icon name={c.icon} size={22} /></span>
                    <span className="grow">
                      <span className="chan-top"><b>{c.name}</b><span className="when">{c.last?.at}</span></span>
                      <span className="chan-last">{c.last ? <><b>{c.last.mine ? 'Tú' : c.last.person?.name.split(' ')[0]}:</b> {c.last.text}</> : c.desc}</span>
                    </span>
                    {c.unread > 0 && <span className="unread num" aria-label={`${c.unread} sin leer`}>{c.unread}</span>}
                  </a>
                </li>
              ))}
            </ul>
          )
        ) : (
          d.dms.length === 0 ? <Empty icon="message-circle" title="Sin mensajes">Escribe a alguien desde su perfil en Gente.</Empty> : (
            <ul className="chan-list">
              {d.dms.map((m) => (
                <li key={m.id}>
                  <a className={`chan press ${m.unread ? 'is-unread' : ''}`} href={`#/canal/dm:${m.id}`}>
                    <Avatar person={m.person} size={52} />
                    <span className="grow">
                      <span className="chan-top"><b>{m.person.name}</b><span className="when">{m.last.at}</span></span>
                      <span className="chan-last">{m.last.mine && <b>Tú: </b>}{m.last.text}</span>
                    </span>
                    {m.unread > 0 && <span className="unread unread--dot" aria-label="Sin leer" />}
                  </a>
                </li>
              ))}
            </ul>
          )
        )}
      </Load>
    </>
  );
}

const QUICK = ['🔥', '❤️', '🙌', '😂'];

export function Canal({ params }) {
  const { api, me, refreshMe, toast } = useApp();
  const q = useApi(api, 'channel', { id: params.id }, [params.id]);
  const [text, setText] = useState('');
  const [sent, setSent] = useState([]);
  const [mine, setMine] = useState({}); // reacciones tuyas tocadas en esta visita
  const end = useRef(null);
  useEffect(() => { if (q.data) refreshMe(); }, [q.data != null]); // eslint-disable-line react-hooks/exhaustive-deps
  // Al entrar, el chat empieza abajo (lo último), como cualquier app de mensajes.
  useLayoutEffect(() => { if (q.data) end.current?.scrollIntoView({ block: 'end' }); }, [q.data != null, sent.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const tmp = { id: `tmp${Date.now()}`, text: t, at: 'ahora', mine: true, person: me, reactions: {}, myReactions: {}, sending: true };
    setSent((s) => [...s, tmp]); setText('');
    try { const r = await api('channel.send', { id: params.id, text: t }); setSent((s) => s.map((m) => (m.id === tmp.id ? r.message : m))); }
    catch (err) { setSent((s) => s.filter((m) => m.id !== tmp.id)); setText(t); toast(err.message); }
  };
  const react = (m, emoji) => {
    const on = !(mine[`${m.id}${emoji}`] ?? m.myReactions?.[emoji]);
    setMine((x) => ({ ...x, [`${m.id}${emoji}`]: on }));
    navigator.vibrate?.(8);
    api('message.react', { id: m.id, emoji, on }).catch(() => {});
  };
  return (
    <Load q={q} skeleton={<Skeleton h={56} n={5} />}>
      {({ channel: c, messages }) => (
        <div className="chat">
          <header className="chat-head">
            {c.dm ? <Avatar person={c.person} size={56} /> : <span className={`chan-ico chan-ico--lg ${c.id === 'anuncios' ? 'is-brand' : ''}`}><Icon name={c.icon} size={26} /></span>}
            <div className="grow">
              <h1 className="chat-title">{c.name}</h1>
              <p className="t-soft">{c.dm ? <a href={`#/persona/${c.person.id}`} style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Ver perfil</a> : <>{c.members} personas · {c.desc}</>}</p>
            </div>
          </header>
          <ol className="msgs" aria-label="Mensajes">
            {[...messages, ...sent].map((m, i, all) => {
              const first = i === 0 || all[i - 1].person?.id !== m.person?.id;
              const counts = Object.entries(m.reactions ?? {});
              QUICK.forEach((e) => { if (!counts.some(([k]) => k === e) && (mine[`${m.id}${e}`] ?? m.myReactions?.[e])) counts.push([e, 0]); });
              return (
                <li key={m.id} className={`msg ${m.mine ? 'is-mine' : ''} ${first ? 'is-first' : ''} ${m.sending ? 'is-sending' : ''}`}>
                  {!m.mine && (first ? <a href={`#/persona/${m.person.id}`} className="msg-av" aria-label={m.person.name}><Avatar person={m.person} size={32} /></a> : <span className="msg-av" />)}
                  <div className="msg-body">
                    {first && !m.mine && <a className="msg-from" href={`#/persona/${m.person.id}`}>{m.person.name}</a>}
                    <div className="bubble-msg" onDoubleClick={() => react(m, '❤️')}>{m.text}<span className="msg-at">{m.at}</span></div>
                    {counts.length > 0 && (
                      <div className="reacts">
                        {counts.map(([e, n]) => {
                          const on = mine[`${m.id}${e}`] ?? m.myReactions?.[e] ?? false;
                          return <button key={e} className={`react press ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => react(m, e)}>{e} <span className="num">{n + (on ? 1 : 0)}</span></button>;
                        })}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <div ref={end} />
          {c.readOnly ? (
            <p className="chat-ro t-soft"><Icon name="megaphone" size={16} /> Solo la Junta escribe aquí. Reacciona con doble toque.</p>
          ) : (
            <form className="composer" onSubmit={send}>
              <label className="sr-only" htmlFor="msg">Mensaje</label>
              <input id="msg" className="composer-input" placeholder={c.dm ? `Escribe a ${c.name.split(' ')[0]}` : `Escribe en ${c.name}`} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" enterKeyHint="send" />
              <button className={`composer-send press ${text.trim() ? 'is-ready' : ''}`} aria-label="Enviar" disabled={!text.trim()}><Icon name="send" size={20} /></button>
            </form>
          )}
        </div>
      )}
    </Load>
  );
}
