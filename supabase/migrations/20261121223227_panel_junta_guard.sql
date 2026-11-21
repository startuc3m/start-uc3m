create or replace function public.panel_create_batch(p_actor uuid, p_batch uuid, p_fingerprint text, p_rows jsonb, p_send boolean)
returns uuid language plpgsql set search_path='' as $$
declare actor public.panel_members; old public.panel_batches; row jsonb; target uuid;
begin
  -- Serialize administration so revocations and competing imports cannot race.
  perform pg_advisory_xact_lock(871701);
  select * into actor from public.panel_members where id=p_actor;
  if actor.id is null or not actor.active or not (actor.manage_users or actor.position='junta') then raise exception 'PANEL_FORBIDDEN'; end if;
  if actor.position<>'junta' and exists (
    select 1 from jsonb_array_elements(p_rows) r
    where r->>'position'='junta' or exists(select 1 from public.panel_members m where m.email=r->>'email' and m.position='junta')
  ) then raise exception 'PANEL_FORBIDDEN'; end if;
  select * into old from public.panel_batches where id=p_batch;
  if old.id is not null then
    if old.actor_id<>p_actor or old.fingerprint<>p_fingerprint then raise exception 'PANEL_CONFLICT'; end if;
    return p_batch;
  end if;
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 100 then raise exception 'PANEL_INVALID'; end if;
  insert into public.panel_batches(id,actor_id,fingerprint) values(p_batch,p_actor,p_fingerprint);
  for row in select value from jsonb_array_elements(p_rows) loop
    target := null;
    insert into public.panel_members(email,name_hint,kind,department,position,manage_users)
    values(row->>'email',row->>'name',row->>'kind',row->>'department',row->>'position',(row->>'manage_users')::boolean)
    on conflict (email) do nothing returning id into target;
    -- Existing users must be explicitly resent/changed, never silently reactivated/promoted.
    if target is not null then
      insert into public.panel_audit(actor_id,action,target_id) values(p_actor,'member.created',target);
      if p_send then insert into public.panel_mail_jobs(batch_id,member_id) values(p_batch,target); end if;
    end if;
  end loop;
  return p_batch;
end $$;

create or replace function public.panel_change_member(p_actor uuid, p_target uuid, p_kind text, p_department text, p_position text, p_manage boolean, p_active boolean)
returns void language plpgsql set search_path='' as $$
declare actor public.panel_members;
begin
  perform pg_advisory_xact_lock(871701);
  select * into actor from public.panel_members where id=p_actor;
  if actor.id is null or not actor.active or not(actor.manage_users or actor.position='junta') then raise exception 'PANEL_FORBIDDEN'; end if;
  if actor.position<>'junta' and (p_position='junta' or exists(select 1 from public.panel_members where id=p_target and position='junta')) then raise exception 'PANEL_FORBIDDEN'; end if;
  if p_actor=p_target then raise exception 'PANEL_SELF_CHANGE'; end if;
  update public.panel_members set kind=p_kind,department=p_department,position=p_position,manage_users=p_manage,active=p_active where id=p_target;
  if not found then raise exception 'PANEL_NOT_FOUND'; end if;
  if not p_active then update public.panel_mail_jobs set state='cancelled',encrypted_payload=null where member_id=p_target and state='queued'; end if;
  insert into public.panel_audit(actor_id,action,target_id) values(p_actor,'member.updated',p_target);
end $$;

