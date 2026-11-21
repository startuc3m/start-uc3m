// Integration test against disposable localhost Postgres only. Always rolls back.
import pg from 'pg';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const url=new URL(process.env.DATABASE_URL || 'postgres://postgres:test@localhost:5432/socios_test');
if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw new Error('Requires disposable localhost *_test database');
const db=new pg.Client({connectionString:url.href});await db.connect();
const q=(sql,args=[])=>db.query(sql,args);
async function rejects(sql,args,pattern){
  await q('savepoint expected_error');
  try {await assert.rejects(q(sql,args),pattern);}finally{await q('rollback to savepoint expected_error');}
}
try {
  await q('begin');
  await q(`do $$ begin
    if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
    if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
  end $$;
  create schema auth; create table auth.users(id uuid primary key);
  create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  await q(await readFile(new URL('../supabase/migrations/20261117175111_panel_access.sql',import.meta.url),'utf8'));
  for(const file of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')&&!f.endsWith('_panel_access.sql')).sort()) await q(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  const actor=randomUUID(), user=randomUUID(), other=randomUUID(), batch=randomUUID();
  await q("insert into panel_members(id,email,kind,department,position) values($1,'junta@example.org','starter','Junta','junta')",[actor]);
  assert.equal((await q('select count(*)::int n from panel_departments')).rows[0].n,8);
  await rejects("insert into panel_members(email,kind,department) values('invalid@example.org','starter','Inventado')",[],/foreign key/);
  await rejects("insert into panel_members(email,kind,department) values('invalid@example.org','starter',null)",[],/check constraint/);
  await rejects("insert into panel_members(email,kind,department) values('invalid@example.org','socio','IT')",[],/check constraint/);
  const rows=[{name:'Ana',email:'ana@example.org',kind:'socio',department:null,position:'miembro',manage_users:false}];
  const create='select panel_create_batch($1,$2,$3,$4::jsonb,$5)';
  await q(create,[actor,batch,'fingerprint',JSON.stringify(rows),true]);
  await q(create,[actor,batch,'fingerprint',JSON.stringify(rows),true]);
  assert.equal((await q('select count(*)::int n from panel_mail_jobs')).rows[0].n,1);
  await rejects(create,[actor,batch,'different',JSON.stringify(rows),true],/PANEL_CONFLICT/);
  const member=(await q("select * from panel_members where email='ana@example.org'")).rows[0];
  await rejects(create,[member.id,randomUUID(),'x',JSON.stringify(rows),true],/PANEL_FORBIDDEN/);
  const it=randomUUID(), it2=randomUUID();
  await q("insert into panel_members(id,email,kind,department,manage_users) values($1,'it@example.org','starter','IT',true),($2,'it2@example.org','starter','IT',true)",[it,it2]);
  const change='select panel_change_member($1,$2,$3,$4,$5,$6,$7)';
  for(const [a,t] of [[it,it2],[it2,it]]) await rejects(change,[a,t,'starter','IT','junta',true,true],/PANEL_FORBIDDEN/);
  for(const position of ['miembro','junta']) await rejects(change,[it,actor,'starter','Junta',position,false,true],/PANEL_FORBIDDEN/);
  await rejects(change,[it,actor,'starter','Junta','junta',false,false],/PANEL_FORBIDDEN/);
  await rejects(create,[it,randomUUID(),'junta',JSON.stringify([{...rows[0],email:'new-junta@example.org',kind:'starter',department:'Junta',position:'junta'}]),false],/PANEL_FORBIDDEN/);
  await rejects(create,[it,randomUUID(),'existing-junta',JSON.stringify([{...rows[0],email:'junta@example.org'}]),false],/PANEL_FORBIDDEN/);
  await q(change,[actor,it2,'starter','IT','junta',true,true]);
  await q(change,[actor,it2,'starter','IT','miembro',true,true]);
  await q('insert into auth.users(id) values($1),($2)',[user,other]);
  await q('select panel_accept($1,$2)',[user,member.email]);
  await rejects('select panel_accept($1,$2)',[other,member.email],/PANEL_FORBIDDEN/);
  await rejects('select panel_accept($1,$2)',[other,'unknown@example.org'],/PANEL_FORBIDDEN/);
  await rejects('select panel_change_member($1,$1,$2,$3,$4,false,false)',[actor,'socio',null,'miembro'],/PANEL_SELF_CHANGE/);
  await q('select panel_change_member($1,$2,$3,$4,$5,false,false)',[actor,member.id,'socio','','miembro']);
  assert.equal((await q('select state from panel_mail_jobs')).rows[0].state,'cancelled');
  await rejects('select panel_accept($1,$2)',[user,member.email],/PANEL_FORBIDDEN/);
  // Reimport must never reactivate or promote an existing member.
  await q(create,[actor,randomUUID(),'second',JSON.stringify([{...rows[0],kind:'starter',department:'IT',manage_users:true}]),true]);
  const unchanged=(await q('select * from panel_members where id=$1',[member.id])).rows[0];
  assert.equal(unchanged.active,false);assert.equal(unchanged.kind,'socio');
  await q('select panel_change_member($1,$2,$3,$4,$5,true,true)',[actor,member.id,'starter','IT','miembro']);
  await q('update panel_mail_jobs set created_at=now()-interval \'2 minutes\'');
  await q('select panel_queue_invitation($1,$2,$3)',[actor,member.id,randomUUID()]);
  const claimed=(await q('select * from panel_claim_invitation($1)',[actor])).rows;
  assert.equal(claimed.length,1);assert.equal(claimed[0].state,'sending');
  assert.equal((await q('select * from panel_claim_invitation($1)',[actor])).rows.length,0);
  await q("update panel_mail_jobs set started_at=now()-interval '6 minutes' where state='sending'");
  await q('select * from panel_claim_invitation($1)',[actor]);
  assert.equal((await q("select count(*)::int n from panel_mail_jobs where state='uncertain'")).rows[0].n,1);
  for(const role of ['anon','authenticated']) {
    assert.equal((await q("select has_table_privilege($1,'public.panel_members','select') ok",[role])).rows[0].ok,false);
    assert.equal((await q("select has_function_privilege($1,'public.panel_accept(uuid,text)','execute') ok",[role])).rows[0].ok,false);
  }
  assert.equal((await q("select count(*)::int n from pg_class where relname like 'panel_%' and relkind='r' and not relrowsecurity")).rows[0].n,0);
  console.log('Panel SQL: importación idempotente, permisos, vinculación, cola y RLS correctos.');
} finally {await q('rollback');await db.end();}
