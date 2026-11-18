import { createClient } from '@supabase/supabase-js';

export function makePanelClient(config) {
  const auth=createClient(config.url,config.key,{auth:{flowType:'pkce',storageKey:'start-panel-auth',detectSessionInUrl:true}});
  async function api(action,input) {
    const {data:{session}}=await auth.auth.getSession();
    if(!session) throw new Error('Inicia sesión para continuar.');
    const response=await fetch(`/api/panel?action=${encodeURIComponent(action)}`,{
      method:input===undefined?'GET':'POST',
      headers:{Authorization:`Bearer ${session.access_token}`,...(input===undefined?{}:{'Content-Type':'application/json'})},
      ...(input===undefined?{}:{body:JSON.stringify(input)}),
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||'No se pudo completar la operación.');
    return data;
  }
  return {auth:auth.auth,api};
}
