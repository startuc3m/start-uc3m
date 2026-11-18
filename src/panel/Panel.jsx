import { useEffect, useRef, useState } from 'react';
import { canManage, PERSONALITY_GROUPS, TEST_URL } from './model';
import { makePanelClient } from './client';
import './panel.css';

const initialClassification={kind:'socio',department:'',position:'miembro',manage_users:false};
const jobLabels={queued:'En cola',sending:'Enviando',sent:'Enviada',failed:'Error antes del envío',uncertain:'Envío por comprobar',cancelled:'Cancelada'};

export function PersonalityPicker({value,onChange}) {
  return <fieldset className="personality"><legend>Personalidad</legend>
    <p>Selecciona tu etiqueta. Si aún no la sabes, haz el test y vuelve a elegirla.</p>
    <div className="personality-grid">{PERSONALITY_GROUPS.map((group,index)=><div className={`family family-${index}`} key={group.name}>
      <span>{group.name}</span>{group.codes.map(code=><label key={code}><input type="radio" name="personality" value={code} checked={value===code} onChange={()=>onChange(code)}/><span>{code}</span></label>)}
    </div>)}</div>
    <label className="inline"><input type="radio" name="personality" checked={!value} onChange={()=>onChange(null)}/>No lo sé</label>
    <a href={TEST_URL} target="_blank" rel="noopener noreferrer">Hacer el test oficial ↗</a>
    <p className="hint">El test se abre fuera de Start. Al volver, selecciona tu código de cuatro letras; el resultado no se importa automáticamente.</p>
  </fieldset>;
}

function Classification({value,onChange,id='new'}) {
  const set=(key,v)=>{const next={...value,[key]:v};if(next.department!=='IT'&&next.position!=='junta')next.manage_users=false;onChange(next);};
  return <div className="form-grid">
    <label>Tipo de miembro<select value={value.kind} onChange={e=>onChange(e.target.value==='socio'?{...initialClassification}:{...value,kind:'starter'})}><option value="socio">Socio</option><option value="starter">Starter</option></select></label>
    {value.kind==='starter'&&<>
      <label>Departamento<input maxLength={80} required value={value.department} onChange={e=>set('department',e.target.value)} placeholder="Ej. IT"/></label>
      <label>Cargo<select value={value.position} onChange={e=>set('position',e.target.value)}><option value="miembro">Miembro</option><option value="responsable">Responsable</option><option value="junta">Junta</option></select></label>
      {(value.department==='IT'||value.position==='junta')&&<label className="inline" htmlFor={`manage-${id}`}><input id={`manage-${id}`} type="checkbox" checked={value.position==='junta'||value.manage_users} disabled={value.position==='junta'} onChange={e=>set('manage_users',e.target.checked)}/>Puede gestionar usuarios y permisos</label>}
    </>}
  </div>;
}

function Login({client,invite,onAccepted,busy,perform}) {
  const [email,setEmail]=useState(''),[password,setPassword]=useState('');
  return <section className="panel-card login-card"><span className="eyebrow">TU COMUNIDAD, EN UN SOLO SITIO</span><h2>Entra en Start_</h2>
    <p>Usa el correo al que IT o Junta te han invitado.</p>
    {invite&&<div className="notice"><strong>Tienes una invitación</strong><p>Confirma el enlace para completar tu perfil. Después podrás establecer tu contraseña o entrar con Google usando este correo.</p><button disabled={busy} onClick={()=>perform(async()=>{const {error}=await client.auth.verifyOtp(invite);if(error)throw new Error('El enlace no es válido o ha caducado. Pide a IT o Junta que te lo reenvíen.');onAccepted();})}>Aceptar invitación</button></div>}
    <button className="secondary" disabled={busy} onClick={()=>perform(async()=>{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/panel/'}});if(error)throw error;})}>Continuar con Google</button>
    <form onSubmit={e=>{e.preventDefault();perform(async()=>{const {error}=await client.auth.signInWithPassword({email,password});if(error)throw new Error('No se pudo iniciar sesión. Revisa el correo y la contraseña.');});}}>
      <label>Correo electrónico<input autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Contraseña<input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button disabled={busy}>Entrar</button>
    </form>
    <button className="text-button" disabled={busy||!email} onClick={()=>perform(async()=>{const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/panel/'});if(error)throw error;return 'Si existe una cuenta con ese correo, recibirás instrucciones para recuperar la contraseña.';})}>He olvidado mi contraseña</button>
    <p className="hint">¿Todavía no eres socio? <a href="/socios/">Consulta cómo unirte</a>. El acceso al panel lo habilitan IT o Junta.</p>
  </section>;
}

function Profile({data,client,refresh,perform,busy}) {
  const [form,setForm]=useState(()=>({name:data.profile?.name||data.member.name_hint||'',career:data.profile?.career||'',course:data.profile?.course||'',linkedin:data.profile?.linkedin||'',personality:data.profile?.personality||null}));
  const [password,setPassword]=useState('');
  const field=(name,value)=>setForm(f=>({...f,[name]:value}));
  async function upload(file,kind) {
    if(!file)return;
    if(file.size>2097152)throw new Error('El archivo debe pesar como máximo 2 MB.');
    const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('No se pudo leer el archivo.'));reader.readAsDataURL(file);});
    await client.api('upload',{kind,base64});await refresh();return kind==='photo'?'Foto guardada.':'CV guardado.';
  }
  return <div className="profile-layout"><section className="panel-card">
    <div className="section-heading"><div><span className="eyebrow">MI PERFIL</span><h2>Así te conoce Start_</h2></div><span className="badge">{data.member.kind==='socio'?'Socio':`Starter · ${data.member.department}`}</span></div>
    <p>Nombre, carrera, curso y foto son obligatorios. LinkedIn y CV son opcionales.</p>
    <div className="photo-row">{data.files.photo?<img src={data.files.photo} alt="Tu foto de perfil"/>:<div className="photo-placeholder" aria-label="Sin foto">ST</div>}<label>Foto de perfil *<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files[0];perform(()=>upload(file,'photo'));e.target.value='';}}/><small>JPEG, PNG o WebP · máximo 2 MB</small></label></div>
    <form onSubmit={e=>{e.preventDefault();perform(async()=>{await client.api('profile',form);await refresh();return 'Perfil guardado.';});}}>
      <div className="form-grid">{[['name','Nombre',120],['career','Carrera',160],['course','Curso',50]].map(([key,label,max])=><label key={key}>{label} *<input required maxLength={max} value={form[key]} onChange={e=>field(key,e.target.value)}/></label>)}
      <label>LinkedIn<input type="url" maxLength={300} placeholder="https://www.linkedin.com/in/…" value={form.linkedin} onChange={e=>field('linkedin',e.target.value)}/></label></div>
      <PersonalityPicker value={form.personality} onChange={value=>field('personality',value)}/>
      <p className="hint">Tu perfil completado estará visible para otros miembros cuando se habilite Networking. El CV no forma parte del directorio.</p>
      <button disabled={busy}>Guardar perfil</button>
    </form>
  </section><aside>
    <section className="panel-card"><h3>Tu CV</h3><p>Solo tú y el autor de una oferta a la que te apuntes podréis consultarlo.</p>{data.files.cv&&<a href={data.files.cv} target="_blank" rel="noopener noreferrer">Ver mi CV ↗</a>}<label>Subir o sustituir CV<input type="file" accept="application/pdf" disabled={busy} onChange={e=>{const file=e.target.files[0];perform(()=>upload(file,'cv'));e.target.value='';}}/><small>PDF · máximo 2 MB</small></label></section>
    <section className="panel-card"><h3>Contraseña</h3><p>Establécela después de aceptar tu invitación o cámbiala aquí.</p><form onSubmit={e=>{e.preventDefault();perform(async()=>{const {error}=await client.auth.updateUser({password});if(error)throw new Error('No se pudo cambiar la contraseña. Vuelve a autenticarte e inténtalo de nuevo.');setPassword('');return 'Contraseña actualizada.';});}}><label>Nueva contraseña<input type="password" minLength={12} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="secondary" disabled={busy}>Guardar contraseña</button></form></section>
  </aside></div>;
}

function UserEditor({member,actorId,client,perform,refresh,busy}) {
  const [editing,setEditing]=useState(false),[form,setForm]=useState(member);
  return <article className="member-row"><div><strong>{member.name_hint||member.email}</strong><div>{member.email}</div><small>{member.kind} · {member.department||'Comunidad'} · {member.position}</small><p><span className="badge">{member.active?'Acceso activo':'Acceso desactivado'}</span> <span className="badge">{member.completed?'Perfil completado':member.accepted_at?'Perfil pendiente':'Sin aceptar'}</span> <span>{jobLabels[member.invitation?.state]||'Sin invitar'}</span></p></div>
    {member.invitation?.state==='uncertain'&&<p className="hint">IT debe comprobar este envío con el proveedor antes de repetirlo.</p>}
    <div className="actions"><button className="secondary" disabled={busy||!member.active||['queued','sending','uncertain'].includes(member.invitation?.state)} onClick={()=>perform(async()=>{await client.api('resend',{id:member.id,job_id:crypto.randomUUID()});await refresh();return 'Invitación en cola. Pulsa «Procesar cola» para enviarla.';})}>Invitar / reenviar</button>
    <button className="text-button" disabled={member.id===actorId||busy} onClick={()=>{setForm(member);setEditing(!editing);}}>Editar acceso y permisos</button></div>
    {editing&&<form className="member-editor" onSubmit={e=>{e.preventDefault();perform(async()=>{await client.api('member',{...form,id:member.id});await refresh();setEditing(false);return 'Permisos actualizados.';});}}>
      <Classification value={form} onChange={setForm} id={member.id}/><label className="inline"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/>Acceso activo</label>
      <p className="hint">Junta e IT autorizado pueden invitar a otras personas y conceder permisos. Revisa el destinatario antes de guardar.</p><button disabled={busy}>Guardar cambios</button>
    </form>}
  </article>;
}

export function Invitations({client,actorId,perform,busy}) {
  const [text,setText]=useState(''),[classification,setClassification]=useState(initialClassification),[preview,setPreview]=useState(null),[listing,setListing]=useState({members:[],pending:0});
  const batch=useRef(null), stopped=useRef(false);
  const refresh=async()=>setListing(await client.api('users'));
  useEffect(()=>{perform(refresh);return()=>{stopped.current=true;};},[]);
  function changeText(value){setText(value);setPreview(null);batch.current=null;}
  function classify(value){setClassification(value);setPreview(null);batch.current=null;}
  async function review(){const result=await client.api('preview',{text,...classification});setPreview(result.rows);batch.current=null;}
  async function save(send){
    if(!batch.current||batch.current.send!==send)batch.current={id:crypto.randomUUID(),send};
    await client.api('invite',{text,...classification,send,batch_id:batch.current.id});
    await refresh();setPreview(null);setText('');batch.current=null;
    return send?'Usuarios guardados e invitaciones en cola. Pulsa «Procesar cola» para enviarlas.':'Usuarios guardados sin enviar correos.';
  }
  async function process(){stopped.current=false;let count=0;for(let i=0;i<100&&!stopped.current;i++){const result=await client.api('process',{});if(!result.processed)break;count++;await refresh();if(result.state!=='sent')break;}return `Procesados ${count} envíos. Puedes retomar la cola en cualquier momento.`;}
  const valid=preview?.length>0&&!preview.some(r=>r.error)&&preview.some(r=>!r.existing);
  return <div className="admin-layout"><section className="panel-card"><span className="eyebrow">IT + JUNTA</span><h2>Invitar en bloque_</h2><p>Pega la lista y revisa los destinatarios antes de guardar. Cada persona recibirá su propio correo.</p>
    <label>Personas a invitar<textarea rows={7} value={text} onChange={e=>changeText(e.target.value)} placeholder={'Ana García, ana@example.org\npablo@example.org\nLucía Martín <lucia@example.org>'}/></label>
    <p className="hint">Hasta 100 personas. También puedes separar solo correos con comas o punto y coma. Usa un lote por tipo de miembro/departamento.</p>
    <Classification value={classification} onChange={classify}/><button disabled={busy||!text.trim()} onClick={()=>perform(review)}>Revisar lista</button>
    {preview&&<><div className="table-scroll"><table><caption>Vista previa de destinatarios</caption><thead><tr><th>Nombre</th><th>Correo</th><th>Resultado</th></tr></thead><tbody>{preview.map((r,i)=><tr key={i}><td>{r.name||'—'}</td><td>{r.email}</td><td>{r.error|| (r.existing?'Ya existe; no se modifica':'Nuevo')}</td></tr>)}</tbody></table></div><p>Corrige los errores en el texto y vuelve a revisar. Los correos existentes no reciben otra invitación en este lote.</p><div className="actions"><button className="secondary" disabled={busy||!valid} onClick={()=>perform(()=>save(false))}>Guardar sin enviar</button><button disabled={busy||!valid} onClick={()=>perform(()=>save(true))}>Confirmar y preparar invitaciones</button></div></>}
  </section><section className="panel-card"><div className="section-heading"><div><span className="eyebrow">SEGUIMIENTO</span><h2>Usuarios e invitaciones</h2></div><button className="text-button" disabled={busy} onClick={()=>perform(refresh)}>Actualizar</button></div>
    <div className="notice"><strong>{listing.pending} invitaciones en cola</strong><p>La cola queda guardada aunque cierres la pestaña. «Enviada» significa aceptada por el proveedor de correo.</p><button disabled={busy||!listing.pending} onClick={()=>perform(process)}>Procesar cola</button>{busy&&<button className="secondary" onClick={()=>{stopped.current=true;}}>Parar tras este envío</button>}</div>
    {listing.members.length===0?<p>No hay usuarios que mostrar.</p>:listing.members.map(m=><UserEditor key={m.id} member={m} actorId={actorId} client={client} perform={perform} refresh={refresh} busy={busy}/>)}
  </section></div>;
}

export default function Panel({config,providedClient}) {
  const [client]=useState(()=>providedClient||(config?.enabled&&config.url&&config.key?makePanelClient(config):null));
  const [session,setSession]=useState(null),[data,setData]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[tab,setTab]=useState('profile'),[invite,setInvite]=useState(null);
  const generation=useRef(0), busyRef=useRef(false);
  async function refresh(){const next=await client.api('me');setData(next);}
  async function perform(fn){if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');setMessage('');try{const message=await fn();if(typeof message==='string')setMessage(message);}catch(e){setError(e.message||'No se pudo completar la operación.');}finally{busyRef.current=false;setBusy(false);}}
  useEffect(()=>{
    if(!client){setLoading(false);return;}
    const params=new URLSearchParams(window.location.hash.slice(1));
    if(params.get('token_hash')&&['invite','magiclink'].includes(params.get('type'))){setInvite({token_hash:params.get('token_hash'),type:params.get('type')});history.replaceState(null,'',window.location.pathname);}
    let alive=true;
    const update=async next=>{const n=++generation.current;setSession(next);setData(null);setLoading(true);if(next){try{const current=await client.api('me');if(alive&&n===generation.current)setData(current);}catch(e){if(alive&&n===generation.current)setError(e.message);}}if(alive&&n===generation.current)setLoading(false);};
    client.auth.getSession().then(({data})=>{if(alive)update(data.session);});
    const {data:subscription}=client.auth.onAuthStateChange((event,next)=>{setTimeout(()=>{if(alive){if(event==='TOKEN_REFRESHED')setSession(next);else update(next);}},0);});
    return()=>{alive=false;generation.current++;subscription.subscription.unsubscribe();};
  },[client]);
  return <div className="start-panel"><header className="panel-header"><a href="/" aria-label="Start UC3M, inicio">START<span>UC3M</span></a><span>ÁREA DE SOCIOS</span>{session&&<button className="text-button" disabled={busy} onClick={()=>perform(async()=>{await client.auth.signOut();setData(null);setSession(null);setMessage('');})}>Salir</button>}</header>
    <main><div className="panel-intro"><span className="eyebrow">COMUNIDAD START</span><h1>Tu próximo paso<br/><em>empieza aquí_</em></h1><p>Tu perfil. Tu comunidad. Nuevas oportunidades.</p></div>
    {error&&<div role="alert" className="status error">{error}</div>}{message&&<div role="status" className="status success">{message}</div>}
    {!client?<section className="panel-card"><h2>Estamos preparando tu espacio</h2><p>Cuando esté listo, recibirás una invitación de IT o Junta para completar tu perfil.</p></section>:loading?<p role="status">Comprobando tu acceso…</p>:(!session||invite)?<Login client={client} invite={invite} onAccepted={()=>setInvite(null)} busy={busy} perform={perform}/>:!data?<section className="panel-card"><h2>Necesitas una invitación</h2><p>Usa el correo autorizado por IT o Junta. Si tu correo ha cambiado, contacta con el equipo para revisarlo.</p><button onClick={()=>perform(refresh)} disabled={busy}>Volver a comprobar</button></section>:<>
      <nav className="panel-tabs" aria-label="Secciones del panel"><button aria-current={tab==='profile'?'page':undefined} onClick={()=>setTab('profile')}>Mi perfil</button>{canManage(data.member)&&<button aria-current={tab==='users'?'page':undefined} onClick={()=>setTab('users')}>Usuarios e invitaciones</button>}</nav>
      {tab==='users'&&canManage(data.member)?<Invitations client={client} actorId={data.member.id} perform={perform} busy={busy}/>:<Profile key={data.member.id} data={data} client={client} refresh={refresh} perform={perform} busy={busy}/>}
    </>}
    </main><footer>Start UC3M · El panel y Neon Pass funcionan de forma independiente.</footer></div>;
}
