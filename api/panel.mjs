import { PanelError, panelClient, authenticate, runAction } from './_lib/panel.mjs';

export async function readPanelBody(req) {
  if (req.body !== undefined) {
    const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);
    if(Buffer.byteLength(raw)>3000000) throw new PanelError(413,'Petición demasiado grande.');
    try { return JSON.parse(raw); } catch { throw new PanelError(400,'JSON inválido.'); }
  }
  const chunks=[]; let size=0;
  for await (const chunk of req) {
    size+=chunk.length;
    if(size>3000000) throw new PanelError(413,'Petición demasiado grande.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()||'{}'); } catch { throw new PanelError(400,'JSON inválido.'); }
}
export function createPanelHandler({client=panelClient,auth=authenticate,run=runAction,env=process.env}={}) {
  return async function handler(req,res) {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    try {
      if(!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); throw new PanelError(405,'Método no permitido.'); }
      const action=new URL(req.url,'http://localhost').searchParams.get('action')||'me';
      const reads=['me','users','departments'];
      if((req.method==='GET')!==reads.includes(action)) throw new PanelError(405,'Método no permitido.');
      if(req.method==='POST' && !/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) throw new PanelError(415,'Envía JSON.');
      const db=client(env);
      const context=await auth(req,db);
      const input=req.method==='GET'?{}:await readPanelBody(req);
      if(!input || typeof input!=='object' || Array.isArray(input)) throw new PanelError(400,'Petición inválida.');
      const result=await run(action,input,context,db,env);
      res.statusCode=200; res.end(JSON.stringify(result));
    } catch(error) {
      res.statusCode=error instanceof PanelError?error.status:400;
      // Unexpected backend errors never reveal SQL, tokens, or provider payloads.
      res.end(JSON.stringify({error:error instanceof PanelError?error.message:'Revisa los campos y vuelve a intentarlo.'}));
    }
  };
}
export default createPanelHandler();
