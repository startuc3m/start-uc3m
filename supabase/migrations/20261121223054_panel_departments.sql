-- Unknown legacy departments deliberately abort: review them before applying.
create table public.panel_departments (id text primary key, name text not null);
insert into public.panel_departments(id,name) select name,name from unnest(array['Junta','IT','Marketing','Eventos','Recursos Humanos','Legal','Finanzas','Relaciones Externas']) as name;
alter table public.panel_departments enable row level security;
revoke all on public.panel_departments from public, anon, authenticated;
grant select on public.panel_departments to service_role;
alter table public.panel_members drop constraint panel_members_check;
alter table public.panel_members drop constraint panel_members_check1;
alter table public.panel_members alter column department drop not null;
alter table public.panel_members alter column department drop default;
update public.panel_members set department=null where kind='socio' and department='';
alter table public.panel_members add constraint panel_members_classification_check check (
  (kind='socio' and department is null and position='miembro' and not manage_users)
  or (kind='starter' and department is not null)
);
alter table public.panel_members add constraint panel_members_manager_check check (
  not manage_users or position='junta' or (department is not null and department='IT')
);
alter table public.panel_members add constraint panel_members_department_fkey foreign key(department) references public.panel_departments(id);
