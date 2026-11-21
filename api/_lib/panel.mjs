import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createHash, randomUUID, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { canManage, validatePermissions, parseInvitations, validateClassification, validateProfile } from '../../src/panel/model.js';

export class PanelError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function checked(result) {
  if (result.error) {
    const text = result.error.message || '';
    if (text.includes('PANEL_FORBIDDEN')) throw new PanelError(403, 'No tienes permiso.');
    if (text.includes('PANEL_RATE_LIMIT')) throw new PanelError(429, 'Espera un minuto antes de reenviar.');
    if (text.includes('PANEL_SELF_CHANGE')) throw new PanelError(409, 'Otro administrador debe cambiar tus propios permisos.');
    if (text.includes('PANEL_CONFLICT') || result.error.code === '23505') throw new PanelError(409, 'La operación ya existe o ha cambiado. Revisa la lista.');
    throw new PanelError(503, 'No se pudo completar la operación. Inténtalo de nuevo.');
  }
  return result.data;
}
export function requireManager(member) {
  if (!canManage(member)) throw new PanelError(403, 'Solo Junta e IT autorizado pueden gestionar usuarios.');
}
export function requireUuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new PanelError(400, 'Identificador inválido.');
  return value;
}
export function panelClient(env = process.env) {
  if (env.PANEL_ENABLED !== 'true' || !env.PANEL_SUPABASE_URL || !env.PANEL_SUPABASE_SECRET_KEY) throw new PanelError(503, 'El panel todavía no está disponible.');
  return createClient(env.PANEL_SUPABASE_URL, env.PANEL_SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function authenticate(req, db) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token || token.length > 12000) throw new PanelError(401, 'Inicia sesión para continuar.');
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user?.email_confirmed_at || !data.user?.email) throw new PanelError(401, 'Verifica tu correo e inicia sesión.');
  const user = data.user;
  // Only a provider-verified email can bind an authorization; client input is never trusted.
  const member = checked(await db.rpc('panel_accept', { p_user: user.id, p_email: user.email }));
  return { user, member };
}

export function validateFile(input) {
  if (!['photo', 'cv'].includes(input.kind) || typeof input.base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)) throw new PanelError(400, 'Archivo inválido.');
  const bytes = Buffer.from(input.base64, 'base64');
  if (!bytes.length || bytes.length > 2097152) throw new PanelError(400, 'El archivo debe pesar como máximo 2 MB.');
  let mime, extension;
  if (input.kind === 'cv' && bytes.subarray(0,5).toString() === '%PDF-') { mime = 'application/pdf'; extension = 'pdf'; }
  if (input.kind === 'photo') {
    if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { mime = 'image/png'; extension = 'png'; }
    if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) { mime = 'image/jpeg'; extension = 'jpg'; }
    if (bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') { mime = 'image/webp'; extension = 'webp'; }
  }
  if (!mime) throw new PanelError(400, 'La foto debe ser JPEG, PNG o WebP; el CV debe ser PDF.');
  return { bytes, mime, extension };
}
function encryptionKey(env) {
  if (!/^[a-f0-9]{64}$/i.test(env.PANEL_MAIL_ENCRYPTION_KEY || '')) throw new PanelError(503, 'El envío de invitaciones no está configurado.');
  return Buffer.from(env.PANEL_MAIL_ENCRYPTION_KEY, 'hex');
}
export function encryptPayload(payload, env) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', encryptionKey(env), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}
export function decryptPayload(value, env) {
  const b=Buffer.from(value,'base64'), decipher=createDecipheriv('aes-256-gcm',encryptionKey(env),b.subarray(0,12));
  decipher.setAuthTag(b.subarray(12,28));
  return JSON.parse(Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString());
}
export function mailConfiguration(env) {
  if (env.PANEL_SEND_EMAILS !== 'true' || !env.PANEL_RESEND_API_KEY || !env.PANEL_EMAIL_FROM) throw new PanelError(503, 'Los envíos están desactivados. Puedes guardar usuarios sin enviar.');
  encryptionKey(env);
  let url; try { url = new URL(env.PANEL_SITE_URL); } catch { throw new PanelError(503, 'Falta configurar la dirección del panel.'); }
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname)))) throw new PanelError(503, 'Dirección del panel inválida.');
  return new URL('/panel/', url.origin);
}

/** Processes one persisted job. No token is logged or returned to the administrator. */
export async function processInvitation(db, actor, env, send = null) {
  requireManager(actor);
  const callback = mailConfiguration(env);
  const jobs = checked(await db.rpc('panel_claim_invitation', { p_actor: actor.id }));
  const job = jobs[0];
  if (!job) return { processed: false };
  let sending = false;
  try {
    const member = checked(await db.from('panel_members').select('*').eq('id',job.member_id).single());
    if (!member.active) {
      checked(await db.from('panel_mail_jobs').update({state:'cancelled',encrypted_payload:null}).eq('id',job.id));
      return { processed: true, state: 'cancelled' };
    }
    let payload;
    if (job.encrypted_payload) payload=decryptPayload(job.encrypted_payload,env);
    else {
      let generated = await db.auth.admin.generateLink({type:'invite',email:member.email});
      if (generated.error && ['email_exists','user_already_exists'].includes(generated.error.code)) generated=await db.auth.admin.generateLink({type:'magiclink',email:member.email});
      const data=checked(generated);
      const token=data.properties?.hashed_token;
      const type=data.properties?.verification_type;
      if (!token || !['invite','magiclink'].includes(type)) throw new Error('LINK_GENERATION_FAILED');
      // Fragment avoids sending token in HTTP requests/referrers. Explicit click confirms it.
      callback.hash=new URLSearchParams({token_hash:token,type}).toString();
      payload={from:env.PANEL_EMAIL_FROM,to:member.email,subject:'Completa tu perfil de Start UC3M',text:`Hola${member.name_hint ? ' '+member.name_hint : ''},\n\nIT y Junta te invitan al panel de Start UC3M. Abre este enlace para verificar tu acceso y completar tu perfil:\n\n${callback.href}\n\nUtiliza el correo ${member.email}. Si el enlace ha caducado, pide a IT o Junta que te reenvíen la invitación. Neon Pass sigue siendo independiente.\n\nEquipo de Start UC3M`,...(env.PANEL_REPLY_TO?{replyTo:env.PANEL_REPLY_TO}:{})};
      checked(await db.from('panel_mail_jobs').update({encrypted_payload:encryptPayload(payload,env)}).eq('id',job.id));
    }
    // Recheck both participants immediately before the external side effect.
    const current=checked(await db.from('panel_members').select('*').in('id',[actor.id,member.id]));
    if (!canManage(current.find(m=>m.id===actor.id)) || !current.find(m=>m.id===member.id)?.active) throw new Error('ACCESS_CHANGED');
    sending=true;
    const dispatch=send ?? ((body,key)=>new Resend(env.PANEL_RESEND_API_KEY).emails.send(body,{idempotencyKey:key}));
    const result=await dispatch(payload,`panel-invitation/${job.id}`);
    if (result.error) throw new Error('PROVIDER_ERROR');
    checked(await db.from('panel_mail_jobs').update({state:'sent',provider_id:result.data?.id,encrypted_payload:null,error_code:null}).eq('id',job.id));
    return {processed:true,state:'sent'};
  } catch {
    const state=sending?'uncertain':'failed';
    checked(await db.from('panel_mail_jobs').update({state,error_code:sending?'CHECK_PROVIDER':'PRE_SEND_FAILED',...(sending?{}:{encrypted_payload:null})}).eq('id',job.id));
    return {processed:true,state};
  }
}

export async function runAction(action, input, context, db, env=process.env) {
  const {member}=context;
  const departments = async () => checked(await db.from('panel_departments').select('id,name').order('name'));
  if (action==='departments') return {departments:await departments()};
  if (action==='me') {
    const profile=checked(await db.from('panel_profiles').select('*').eq('member_id',member.id).maybeSingle());
    const files=checked(await db.from('panel_files').select('kind,path').eq('member_id',member.id));
    const urls={};
    for (const file of files) urls[file.kind]=checked(await db.storage.from('panel-private').createSignedUrl(file.path,60)).signedUrl;
    const permissions=checked(await db.from('panel_permissions').select('scope').eq('member_id',member.id)).map(p=>p.scope);
    return {member,profile,files:urls,permissions};
  }
  if (action==='profile') {
    const profile=validateProfile(input);
    const photo=checked(await db.from('panel_files').select('path').eq('member_id',member.id).eq('kind','photo').maybeSingle());
    if (!photo) throw new PanelError(400,'Sube tu foto para completar el perfil.');
    checked(await db.from('panel_profiles').upsert({...profile,member_id:member.id,updated_at:new Date().toISOString()}));
    return {ok:true};
  }
  if (action==='upload') {
    const {bytes,mime,extension}=validateFile(input);
    const path=`${member.id}/${input.kind}/${randomUUID()}.${extension}`;
    const old=checked(await db.from('panel_files').select('path').eq('member_id',member.id).eq('kind',input.kind).maybeSingle());
    checked(await db.storage.from('panel-private').upload(path,bytes,{contentType:mime,upsert:false}));
    try { checked(await db.from('panel_files').upsert({member_id:member.id,kind:input.kind,path})); }
    catch(error) { await db.storage.from('panel-private').remove([path]); throw error; }
    if(old) await db.storage.from('panel-private').remove([old.path]);
    return {ok:true};
  }
  requireManager(member);
  if(action==='users') {
    const members=checked(await db.from('panel_members').select('*').order('created_at',{ascending:false}).limit(500));
    const profiles=checked(await db.from('panel_profiles').select('member_id,completed_at').limit(500));
    const jobs=checked(await db.from('panel_mail_jobs').select('id,member_id,state,created_at,error_code').order('created_at',{ascending:false}).limit(1000));
    const permissions=members.length?checked(await db.from('panel_permissions').select('member_id,scope').in('member_id',members.map(m=>m.id))):[];
    return {members:members.map(m=>({...m,permissions:permissions.filter(p=>p.member_id===m.id).map(p=>p.scope),completed:profiles.some(p=>p.member_id===m.id),invitation:jobs.find(j=>j.member_id===m.id)||null})),pending:jobs.filter(j=>j.state==='queued').length};
  }
  if(action==='preview' || action==='invite') {
    if(member.position!=='junta' && input.position==='junta') throw new PanelError(403,'Solo Junta puede modificar cargos de Junta.');
    const classification=validateClassification(input, await departments());
    const rows=parseInvitations(input.text);
    const emails=rows.filter(r=>!r.error).map(r=>r.email);
    const existing=emails.length?checked(await db.from('panel_members').select('email,position').in('email',emails)):[];
    if(member.position!=='junta' && existing.some(m=>m.position==='junta')) throw new PanelError(403,'Solo Junta puede modificar miembros de Junta.');
    const preview=rows.map(row=>({...row,existing:existing.some(m=>m.email===row.email)}));
    if(action==='preview') return {rows:preview};
    if(preview.some(r=>r.error)) throw new PanelError(400,'Corrige los errores de la lista antes de enviar.');
    if(input.send!==true && input.send!==false) throw new PanelError(400,'Indica si quieres enviar las invitaciones.');
    if(input.send) mailConfiguration(env);
    const entries=preview.filter(r=>!r.existing).map(({name,email})=>({name,email,...classification}));
    // Include original rows in fingerprint so a duplicate retry matches even after insertion.
    const fingerprint=createHash('sha256').update(JSON.stringify({rows:rows.map(({name,email})=>({name,email})),classification,send:input.send})).digest('hex');
    const batch=requireUuid(input.batch_id);
    const id=checked(await db.rpc('panel_create_batch',{p_actor:member.id,p_batch:batch,p_fingerprint:fingerprint,p_rows:rows.map(({name,email})=>({name,email,...classification})),p_send:input.send}));
    return {batch_id:id,reviewed:entries.length};
  }
  if(action==='member') {
    const target=checked(await db.from('panel_members').select('position').eq('id',requireUuid(input.id)).maybeSingle());
    if(!target) throw new PanelError(404,'Miembro no encontrado.');
    if(member.position!=='junta' && target.position==='junta') throw new PanelError(403,'Solo Junta puede modificar miembros de Junta.');
    const classification=validateClassification(input, await departments());
    if(typeof input.active!=='boolean') throw new PanelError(400,'Estado inválido.');
    checked(await db.rpc('panel_change_member',{p_actor:member.id,p_target:requireUuid(input.id),p_kind:classification.kind,p_department:classification.department,p_position:classification.position,p_manage:classification.manage_users,p_active:input.active}));
    return {ok:true};
  }
  if(action==='permissions') {
    checked(await db.rpc('panel_set_permissions',{p_actor:member.id,p_target:requireUuid(input.id),p_scopes:validatePermissions(input.permissions)}));
    return {ok:true};
  }
  if(action==='resend') {
    mailConfiguration(env);
    checked(await db.rpc('panel_queue_invitation',{p_actor:member.id,p_target:requireUuid(input.id),p_job:requireUuid(input.job_id)}));
    return {ok:true};
  }
  if(action==='process') return processInvitation(db,member,env);
  throw new PanelError(404,'Acción desconocida.');
}
