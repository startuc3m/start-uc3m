// @vitest-environment node
import { describe,it,expect,vi } from 'vitest';
import { createPanelHandler } from '../../api/panel.mjs';
import { authenticate, PanelError, runAction, encryptPayload, decryptPayload, processInvitation, validateFile } from '../../api/_lib/panel.mjs';

async function request(overrides={},dependencies={}) {
  const req={url:'/api/panel?action=profile',method:'POST',headers:{'content-type':'application/json'},body:{},...overrides};
  const res={setHeader:vi.fn(),end:vi.fn()};
  await createPanelHandler({client:()=>({}),auth:async()=>({member:{id:'self'}}),run:async()=>({ok:true}),...dependencies})(req,res);
  return {status:res.statusCode,body:JSON.parse(res.end.mock.calls[0][0])};
}
describe('API privada',()=>{
  it('autentica antes de mutar y no revela errores internos',async()=>{
    const run=vi.fn();
    expect((await request({}, {auth:async()=>{throw new PanelError(401,'Inicia sesión');},run})).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
    const result=await request({}, {run:async()=>{throw new Error('SECRET_TOKEN');}});
    expect(JSON.stringify(result)).not.toContain('SECRET_TOKEN');
  });
  it('rechaza métodos, tipos y tamaños inválidos',async()=>{
    expect((await request({method:'GET'})).status).toBe(405);
    expect((await request({headers:{'content-type':'text/plain'}})).status).toBe(415);
    expect((await request({body:[]})).status).toBe(400);
    expect((await request({body:'x'.repeat(3000001)})).status).toBe(413);
  });
  it('solo vincula un correo verificado por Auth',async()=>{
    const rpc=vi.fn().mockResolvedValue({data:{id:'member'}});
    const db={rpc,auth:{getUser:vi.fn().mockResolvedValue({data:{user:{id:'user',email:'verified@example.org',email_confirmed_at:'today'}}})}};
    await authenticate({headers:{authorization:'Bearer token'},body:{email:'attacker@example.org'}},db);
    expect(rpc).toHaveBeenCalledWith('panel_accept',{p_user:'user',p_email:'verified@example.org'});
    db.auth.getUser.mockResolvedValue({data:{user:{email:'unverified@example.org'}}});
    await expect(authenticate({headers:{authorization:'Bearer token'}},db)).rejects.toMatchObject({status:401});
  });
  it('impide administrar sin permisos y completar sin foto',async()=>{
    await expect(runAction('invite',{}, {member:{active:true,position:'miembro'}},{})).rejects.toMatchObject({status:403});
    const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:null})};
    await expect(runAction('profile',{name:'Ana',career:'ADE',course:'2'}, {member:{id:'self'}},{from:()=>query})).rejects.toThrow(/foto/);
  });
  it('rechaza HTML y archivos grandes',()=>{
    expect(()=>validateFile({kind:'photo',base64:Buffer.from('<script>x</script>').toString('base64')})).toThrow();
    expect(()=>validateFile({kind:'cv',base64:Buffer.alloc(2097153).toString('base64')})).toThrow();
  });
});
describe('invitaciones sin correos reales',()=>{
  const env={PANEL_SEND_EMAILS:'true',PANEL_RESEND_API_KEY:'synthetic',PANEL_EMAIL_FROM:'test@example.org',PANEL_SITE_URL:'https://example.org',PANEL_MAIL_ENCRYPTION_KEY:'ab'.repeat(32)};
  const actor={id:'manager',active:true,position:'junta'};
  function database(){
    const updates=[]; const member={id:'member',email:'person@example.org',active:true};
    const db={rpc:vi.fn().mockResolvedValue({data:[{id:'job',member_id:'member'}]}),auth:{admin:{generateLink:vi.fn().mockResolvedValue({data:{properties:{hashed_token:'private-token',verification_type:'invite'}}})}},from:()=>{
      const q={select:()=>q,eq:()=>q,single:async()=>({data:member}),in:async()=>({data:[actor,member]}),update:value=>{updates.push(value);return q;},then:resolve=>resolve({data:null})};return q;
    }};return {db,updates};
  }
  it('cifra enlaces autenticadamente',()=>{
    const encrypted=encryptPayload({token:'secret'},env);
    expect(encrypted).not.toContain('secret');expect(decryptPayload(encrypted,env)).toEqual({token:'secret'});
    expect(()=>decryptPayload(encrypted,{...env,PANEL_MAIL_ENCRYPTION_KEY:'cd'.repeat(32)})).toThrow();
  });
  it('no reclama trabajos si el envío está desactivado',async()=>{
    const {db}=database(),send=vi.fn();
    await expect(processInvitation(db,actor,{...env,PANEL_SEND_EMAILS:'false'},send)).rejects.toMatchObject({status:503});
    expect(db.rpc).not.toHaveBeenCalled();expect(send).not.toHaveBeenCalled();
  });
  it('envía una sola vez con clave estable y no devuelve tokens',async()=>{
    const {db,updates}=database(),send=vi.fn().mockResolvedValue({data:{id:'provider'}});
    const result=await processInvitation(db,actor,env,send);
    expect(result).toEqual({processed:true,state:'sent'});
    expect(send).toHaveBeenCalledTimes(1);expect(send.mock.calls[0][1]).toBe('panel-invitation/job');
    expect(send.mock.calls[0][0].text).toContain('#token_hash=private-token&type=invite');
    expect(updates.at(-1)).toMatchObject({state:'sent',encrypted_payload:null});
  });
  it('marca una respuesta perdida como incierta, sin reenvío automático',async()=>{
    const {db,updates}=database(),send=vi.fn().mockRejectedValue(new Error('timeout'));
    expect(await processInvitation(db,actor,env,send)).toEqual({processed:true,state:'uncertain'});
    expect(send).toHaveBeenCalledTimes(1);expect(updates.at(-1)).toMatchObject({error_code:'CHECK_PROVIDER'});
  });
});

it('sirve departamentos por GET y rechaza departamentos inventados',async()=>{
 const q={select:()=>q,order:async()=>({data:[{id:'IT',name:'IT'}]})};
 const db={from:()=>q,rpc:vi.fn()};
 expect((await request({url:'/api/panel?action=departments',method:'GET'},{client:()=>db,run:runAction})).body).toEqual({departments:[{id:'IT',name:'IT'}]});
 expect((await request({url:'/api/panel?action=departments'})).status).toBe(405);
 await expect(runAction('preview',{kind:'starter',department:'Inventado'},{member:{active:true,position:'junta'}},db)).rejects.toThrow(/departamento/);
 expect(db.rpc).not.toHaveBeenCalled();
});

it('bloquea a IT la creación, ascenso y modificación de Junta',async()=>{
 const member={id:'00000000-0000-4000-8000-000000000001',active:true,department:'IT',manage_users:true,position:'miembro'};
 const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{position:'junta'}})};
 const db={from:()=>q,rpc:vi.fn()};
 for(const action of ['invite','preview']) await expect(runAction(action,{position:'junta'},{member},db)).rejects.toMatchObject({status:403});
 for(const position of ['miembro','junta']) await expect(runAction('member',{id:member.id,position},{member},db)).rejects.toMatchObject({status:403});
 expect(db.rpc).not.toHaveBeenCalled();
});
it('traduce la denegación SQL de Junta a HTTP 403',async()=>{
 const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{position:'miembro'}}),order:async()=>({data:[]})};
 const db={from:()=>q,rpc:async()=>({error:{message:'PANEL_FORBIDDEN'}})};
 const result=await request({url:'/api/panel?action=member',body:{id:'00000000-0000-4000-8000-000000000002',kind:'socio',active:true}},{client:()=>db,auth:async()=>({member:{position:'junta',active:true}}),run:runAction});
 expect(result.status).toBe(403);
});

it('expone permisos en me y restringe su concesión',async()=>{
 const actor={id:'00000000-0000-4000-8000-000000000001',active:true,position:'junta'};
 const db={rpc:vi.fn().mockResolvedValue({data:null}),from:table=>{
  const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:null}),then:resolve=>resolve({data:table==='panel_permissions'?[{scope:'startskills'}]:[]})};return q;
 }};
 expect((await runAction('me',{}, {member:actor},db)).permissions).toEqual(['startskills']);
 await runAction('permissions',{id:actor.id,permissions:['blog','startskills','blog']},{member:actor},db);
 expect(db.rpc).toHaveBeenLastCalledWith('panel_set_permissions',{p_actor:actor.id,p_target:actor.id,p_scopes:['blog','startskills']});
 await expect(runAction('permissions',{id:actor.id,permissions:['admin']},{member:actor},db)).rejects.toThrow(/Permisos/);
 for(const member of [{active:true,position:'responsable'},{active:true,department:'Marketing',manage_users:true},{...actor,active:false}]) await expect(runAction('permissions',{}, {member},db)).rejects.toMatchObject({status:403});
});
