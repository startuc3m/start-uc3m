create table public.panel_permissions (
 member_id uuid references public.panel_members(id) on delete cascade,
 scope text check (scope in ('startskills','eventos','blog')),
 primary key(member_id,scope)
);
alter table public.panel_permissions enable row level security;
revoke all on public.panel_permissions from public,anon,authenticated;
grant all on public.panel_permissions to service_role;
alter table public.panel_audit add column details jsonb not null default '{}'::jsonb;
create function public.panel_set_permissions(p_actor uuid,p_target uuid,p_scopes text[])
returns void language plpgsql set search_path='' as $$
declare actor public.panel_members; target public.panel_members; previous text[];
begin
 perform pg_advisory_xact_lock(871701);
 select * into actor from public.panel_members where id=p_actor;
 if actor.id is null or not actor.active or not(actor.position='junta' or (actor.department='IT' and actor.manage_users)) then raise exception 'PANEL_FORBIDDEN'; end if;
 select * into target from public.panel_members where id=p_target;
 if target.id is null then raise exception 'PANEL_NOT_FOUND'; end if;
 if actor.position<>'junta' and target.position='junta' then raise exception 'PANEL_FORBIDDEN'; end if;
 if p_actor=p_target then raise exception 'PANEL_SELF_CHANGE'; end if;
 if p_scopes is null or exists(select 1 from unnest(p_scopes) s where s is null or s not in ('startskills','eventos','blog')) then raise exception 'PANEL_INVALID'; end if;
 select coalesce(array_agg(scope order by scope),'{}') into previous from public.panel_permissions where member_id=p_target;
 delete from public.panel_permissions where member_id=p_target;
 insert into public.panel_permissions(member_id,scope) select p_target,s from (select distinct unnest(p_scopes) s) scopes;
 insert into public.panel_audit(actor_id,action,target_id,details) values(p_actor,'permissions.updated',p_target,jsonb_build_object('before',previous,'after',(select coalesce(array_agg(scope order by scope),'{}') from public.panel_permissions where member_id=p_target)));
end $$;
revoke all on function public.panel_set_permissions(uuid,uuid,text[]) from public,anon,authenticated;
grant execute on function public.panel_set_permissions(uuid,uuid,text[]) to service_role;
