-- Panel-only tables. No memberships/Stripe/Neon changes.
-- Browser roles deliberately have no table access: the authenticated BFF is the only API.
create table public.panel_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and length(email) <= 254),
  user_id uuid unique references auth.users(id),
  name_hint text not null default '' check (length(name_hint) <= 120),
  kind text not null check (kind in ('socio','starter')),
  department text not null default '' check (length(department) <= 80),
  position text not null default 'miembro' check (position in ('miembro','responsable','junta')),
  manage_users boolean not null default false,
  active boolean not null default true,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind='socio' and department='' and position='miembro' and not manage_users)
      or (kind='starter' and department<>'')),
  check (not manage_users or department='IT' or position='junta')
);
create table public.panel_profiles (
  member_id uuid primary key references public.panel_members(id),
  name text not null check (length(btrim(name)) between 1 and 120),
  career text not null check (length(btrim(career)) between 1 and 160),
  course text not null check (length(btrim(course)) between 1 and 50),
  linkedin text not null default '' check (length(linkedin)<=300),
  personality text check (personality in ('INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP')),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.panel_files (
  member_id uuid references public.panel_members(id),
  kind text check (kind in ('photo','cv')),
  path text not null unique,
  primary key (member_id, kind)
);
create table public.panel_batches (
  id uuid primary key,
  actor_id uuid not null references public.panel_members(id),
  fingerprint text not null,
  created_at timestamptz not null default now()
);
create table public.panel_mail_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.panel_batches(id),
  member_id uuid not null references public.panel_members(id),
  state text not null default 'queued' check (state in ('queued','sending','sent','failed','uncertain','cancelled')),
  encrypted_payload text,
  provider_id text,
  attempts integer not null default 0,
  error_code text,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  unique (batch_id,member_id)
);
create unique index panel_one_pending_invitation on public.panel_mail_jobs(member_id) where state in ('queued','sending','uncertain');
create index panel_jobs_queue on public.panel_mail_jobs(created_at) where state='queued';
create index panel_batch_actor on public.panel_batches(actor_id);
create index panel_jobs_member on public.panel_mail_jobs(member_id);
create index panel_jobs_batch on public.panel_mail_jobs(batch_id);
create table public.panel_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references public.panel_members(id),
  action text not null,
  target_id uuid,
  created_at timestamptz not null default now()
);
create index panel_audit_actor on public.panel_audit(actor_id);

alter table public.panel_members enable row level security;
alter table public.panel_profiles enable row level security;
alter table public.panel_files enable row level security;
alter table public.panel_batches enable row level security;
alter table public.panel_mail_jobs enable row level security;
alter table public.panel_audit enable row level security;
revoke all on public.panel_members, public.panel_profiles, public.panel_files, public.panel_batches, public.panel_mail_jobs, public.panel_audit from anon, authenticated;
grant all on public.panel_members, public.panel_profiles, public.panel_files, public.panel_batches, public.panel_mail_jobs, public.panel_audit to service_role;
grant usage, select on sequence public.panel_audit_id_seq to service_role;

-- Only service_role may call these SECURITY INVOKER functions; caller verifies Auth first.
create function public.panel_accept(p_user uuid, p_email text) returns public.panel_members
language plpgsql set search_path='' as $$
declare m public.panel_members;
begin
  select * into m from public.panel_members where email=lower(btrim(p_email)) for update;
  if m.id is null or not m.active or (m.user_id is not null and m.user_id<>p_user) then raise exception 'PANEL_FORBIDDEN'; end if;
  update public.panel_members set user_id=p_user, accepted_at=coalesce(accepted_at,now()) where id=m.id returning * into m;
  return m;
end $$;

create function public.panel_create_batch(p_actor uuid, p_batch uuid, p_fingerprint text, p_rows jsonb, p_send boolean)
returns uuid language plpgsql set search_path='' as $$
declare actor public.panel_members; old public.panel_batches; row jsonb; target uuid;
begin
  -- Serialize administration so revocations and competing imports cannot race.
  perform pg_advisory_xact_lock(871701);
  select * into actor from public.panel_members where id=p_actor;
  if actor.id is null or not actor.active or not (actor.manage_users or actor.position='junta') then raise exception 'PANEL_FORBIDDEN'; end if;
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

create function public.panel_change_member(p_actor uuid, p_target uuid, p_kind text, p_department text, p_position text, p_manage boolean, p_active boolean)
returns void language plpgsql set search_path='' as $$
declare actor public.panel_members;
begin
  perform pg_advisory_xact_lock(871701);
  select * into actor from public.panel_members where id=p_actor;
  if actor.id is null or not actor.active or not(actor.manage_users or actor.position='junta') then raise exception 'PANEL_FORBIDDEN'; end if;
  if p_actor=p_target then raise exception 'PANEL_SELF_CHANGE'; end if;
  update public.panel_members set kind=p_kind,department=p_department,position=p_position,manage_users=p_manage,active=p_active where id=p_target;
  if not found then raise exception 'PANEL_NOT_FOUND'; end if;
  if not p_active then update public.panel_mail_jobs set state='cancelled',encrypted_payload=null where member_id=p_target and state='queued'; end if;
  insert into public.panel_audit(actor_id,action,target_id) values(p_actor,'member.updated',p_target);
end $$;

create function public.panel_queue_invitation(p_actor uuid, p_target uuid, p_job uuid)
returns void language plpgsql set search_path='' as $$
begin
  perform pg_advisory_xact_lock(871701);
  if not exists(select 1 from public.panel_members where id=p_actor and active and (manage_users or position='junta')) then raise exception 'PANEL_FORBIDDEN'; end if;
  if not exists(select 1 from public.panel_members where id=p_target and active) then raise exception 'PANEL_NOT_FOUND'; end if;
  if exists(select 1 from public.panel_mail_jobs where member_id=p_target and created_at>now()-interval '1 minute') then raise exception 'PANEL_RATE_LIMIT'; end if;
  insert into public.panel_mail_jobs(id,member_id) values(p_job,p_target) on conflict do nothing;
  insert into public.panel_audit(actor_id,action,target_id) values(p_actor,'invitation.queued',p_target);
end $$;

create function public.panel_claim_invitation(p_actor uuid) returns setof public.panel_mail_jobs
language plpgsql set search_path='' as $$
begin
  perform pg_advisory_xact_lock(871701);
  if not exists(select 1 from public.panel_members where id=p_actor and active and (manage_users or position='junta')) then raise exception 'PANEL_FORBIDDEN'; end if;
  -- A crashed send is uncertain, not automatically duplicated with a new token.
  update public.panel_mail_jobs set state='uncertain',error_code='SEND_INTERRUPTED' where state='sending' and started_at<now()-interval '5 minutes';
  return query update public.panel_mail_jobs set state='sending',attempts=attempts+1,started_at=now()
  where id=(select j.id from public.panel_mail_jobs j join public.panel_members m on m.id=j.member_id
    where j.state='queued' and m.active order by j.created_at for update of j skip locked limit 1) returning *;
end $$;

revoke all on function public.panel_accept(uuid,text), public.panel_create_batch(uuid,uuid,text,jsonb,boolean), public.panel_change_member(uuid,uuid,text,text,text,boolean,boolean), public.panel_queue_invitation(uuid,uuid,uuid), public.panel_claim_invitation(uuid) from public, anon, authenticated;
grant execute on function public.panel_accept(uuid,text), public.panel_create_batch(uuid,uuid,text,jsonb,boolean), public.panel_change_member(uuid,uuid,text,text,text,boolean,boolean), public.panel_queue_invitation(uuid,uuid,uuid), public.panel_claim_invitation(uuid) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('panel-private','panel-private',false,2097152,array['image/jpeg','image/png','image/webp','application/pdf']);
-- No browser Storage policies: uploads validated by BFF; downloads signed for 60 seconds.
