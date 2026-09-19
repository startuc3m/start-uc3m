-- =====================================================================
-- Start UC3M - registro y pago de socios
-- Esquema completo. Idempotente: se puede reejecutar sin romper nada.
-- =====================================================================

create extension if not exists pgcrypto;

-- Numeracion de socio. Se consume en el webhook, al confirmarse el pago,
-- para que un pago abandonado no deje un hueco en la serie.
create sequence if not exists member_number_seq start 1;

-- ---------------------------------------------------------------------
-- Ajustes (fila unica)
-- ---------------------------------------------------------------------
create table if not exists membership_settings (
  id                  boolean primary key default true check (id),
  tier1_limit         int     not null default 10,   -- plazas 1..10
  tier2_limit         int     not null default 30,   -- plazas 11..30
  tier1_price_cents   int     not null default 799,
  tier2_price_cents   int     not null default 899,
  tier3_price_cents   int     not null default 999,
  premium_price_cents int     not null default 2000,
  premium_open        boolean not null default true,
  reservation_minutes int     not null default 45
);

insert into membership_settings (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Socios
-- ---------------------------------------------------------------------
create table if not exists memberships (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null,               -- siempre en minusculas
  full_name             text not null,
  plan                  text not null check (plan in ('standard', 'premium')),
  tier                  int  check (tier in (1, 2, 3)),
  price_cents           int  not null check (price_cents > 0),
  status                text not null check (status in ('reserved', 'paid', 'expired')),
  member_number         int  unique,                 -- null hasta que se paga
  stripe_session_id     text unique,
  stripe_payment_intent text,
  reserved_until        timestamptz,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz,

  -- premium no tiene tramo; estandar siempre lo tiene
  constraint memberships_tier_matches_plan check (
    (plan = 'premium'  and tier is null) or
    (plan = 'standard' and tier is not null)
  )
);

-- Un email = un socio.
create unique index if not exists memberships_paid_email_uniq
  on memberships (email) where status = 'paid';

-- Como maximo una reserva viva por email.
create unique index if not exists memberships_reserved_email_uniq
  on memberships (email) where status = 'reserved';

create index if not exists memberships_standard_occupancy_idx
  on memberships (plan, status, reserved_until);

-- ---------------------------------------------------------------------
-- Invitaciones premium
-- ---------------------------------------------------------------------
create table if not exists premium_invites (
  email         text primary key,                    -- siempre en minusculas
  note          text,
  invited_at    timestamptz not null default now(),
  used_at       timestamptz,
  membership_id uuid references memberships(id)
);

-- ---------------------------------------------------------------------
-- Ocupacion de plazas estandar
--
-- Decision de negocio: el premium NO consume plazas de los tramos
-- estandar, asi que aqui solo se cuenta plan = 'standard'.
-- Una plaza cuenta si esta pagada, o reservada y sin caducar.
-- ---------------------------------------------------------------------
create or replace function membership_occupied() returns int
language sql stable as $fn$
  select count(*)::int
    from memberships
   where plan = 'standard'
     and (status = 'paid' or (status = 'reserved' and reserved_until > now()));
$fn$;

-- ---------------------------------------------------------------------
-- Caduca las reservas vencidas. Red de seguridad frente a webhooks
-- checkout.session.expired que no lleguen.
-- ---------------------------------------------------------------------
create or replace function expire_stale_reservations() returns int
language plpgsql as $fn$
declare
  n int;
begin
  update memberships
     set status = 'expired'
   where status = 'reserved'
     and reserved_until <= now();
  get diagnostics n = row_count;
  return n;
end;
$fn$;

-- ---------------------------------------------------------------------
-- Estado de las 4 modalidades, para pintar el formulario.
-- state: available | sold_out | coming_soon | invite_only | closed
-- ---------------------------------------------------------------------
create or replace view membership_availability as
select t.plan, t.tier, t.price_cents, t.state, t.remaining, o.n as occupied
  from membership_settings s,
       lateral (select membership_occupied() as n) o,
       lateral (values
         ('standard', 1, s.tier1_price_cents,
          case when o.n < s.tier1_limit then 'available' else 'sold_out' end,
          greatest(s.tier1_limit - o.n, 0)),

         ('standard', 2, s.tier2_price_cents,
          case when o.n < s.tier1_limit then 'coming_soon'
               when o.n < s.tier2_limit then 'available'
               else 'sold_out' end,
          greatest(s.tier2_limit - o.n, 0)),

         ('standard', 3, s.tier3_price_cents,
          case when o.n < s.tier2_limit then 'coming_soon' else 'available' end,
          null::int),

         ('premium', null::int, s.premium_price_cents,
          case when s.premium_open then 'invite_only' else 'closed' end,
          null::int)
       ) as t(plan, tier, price_cents, state, remaining)
 where s.id;

-- ---------------------------------------------------------------------
-- Reserva de plaza. El precio lo decide SIEMPRE esta funcion; lo que
-- muestre el formulario es meramente informativo.
--
-- Excepciones: ALREADY_MEMBER, PREMIUM_CLOSED, PREMIUM_NOT_INVITED,
--              INVALID_PLAN, INVALID_EMAIL, INVALID_NAME
-- ---------------------------------------------------------------------
create or replace function reserve_membership(p_email text, p_name text, p_plan text)
returns memberships
language plpgsql as $fn$
declare
  s       membership_settings;
  v_email text := lower(trim(p_email));
  v_name  text := trim(p_name);
  v_occ   int;
  v_tier  int;
  v_price int;
  v_row   memberships;
begin
  if p_plan is null or p_plan not in ('standard', 'premium') then
    raise exception 'INVALID_PLAN';
  end if;
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL';
  end if;
  if v_name is null or length(v_name) < 2 then
    raise exception 'INVALID_NAME';
  end if;

  -- Serializa la asignacion de plaza: dos reservas simultaneas para la
  -- ultima plaza de un tramo no pueden obtener ambas el precio bajo.
  perform pg_advisory_xact_lock(hashtext('membership_reserve'));

  perform expire_stale_reservations();

  select * into s from membership_settings where id;

  if exists (select 1 from memberships where email = v_email and status = 'paid') then
    raise exception 'ALREADY_MEMBER';
  end if;

  -- Pago en curso: se reutiliza en vez de crear otra reserva.
  select * into v_row
    from memberships
   where email = v_email and status = 'reserved' and reserved_until > now();
  if found then
    return v_row;
  end if;

  if p_plan = 'premium' then
    if not s.premium_open then
      raise exception 'PREMIUM_CLOSED';
    end if;
    if not exists (
      select 1 from premium_invites where email = v_email and used_at is null
    ) then
      raise exception 'PREMIUM_NOT_INVITED';
    end if;
    v_tier  := null;
    v_price := s.premium_price_cents;
  else
    v_occ := membership_occupied();
    if v_occ < s.tier1_limit then
      v_tier := 1; v_price := s.tier1_price_cents;
    elsif v_occ < s.tier2_limit then
      v_tier := 2; v_price := s.tier2_price_cents;
    else
      v_tier := 3; v_price := s.tier3_price_cents;
    end if;
  end if;

  insert into memberships (email, full_name, plan, tier, price_cents, status, reserved_until)
  values (v_email, v_name, p_plan, v_tier, v_price, 'reserved',
          now() + make_interval(mins => s.reservation_minutes))
  returning * into v_row;

  return v_row;
end;
$fn$;

-- ---------------------------------------------------------------------
-- Confirmacion de pago. Idempotente: un reintento de Stripe no reasigna
-- numero de socio ni devuelve fila, asi que no se reenvia el correo.
-- Se da de alta aunque la reserva hubiera caducado: nunca se cobra sin
-- dar de alta.
-- ---------------------------------------------------------------------
create or replace function confirm_membership_payment(
  p_membership_id  uuid,
  p_payment_intent text
) returns memberships
language plpgsql as $fn$
declare
  v_row memberships;
begin
  update memberships
     set status                = 'paid',
         paid_at               = now(),
         reserved_until        = null,
         stripe_payment_intent = p_payment_intent,
         member_number         = coalesce(member_number, nextval('member_number_seq'))
   where id = p_membership_id
     and status <> 'paid'
  returning * into v_row;

  if not found then
    return null;  -- ya estaba pagada: reintento de Stripe
  end if;

  if v_row.plan = 'premium' then
    update premium_invites
       set used_at = now(), membership_id = v_row.id
     where email = v_row.email and used_at is null;
  end if;

  return v_row;
end;
$fn$;

-- ---------------------------------------------------------------------
-- Libera la plaza de una reserva concreta (checkout.session.expired).
-- ---------------------------------------------------------------------
create or replace function expire_membership(p_membership_id uuid) returns boolean
language plpgsql as $fn$
begin
  update memberships
     set status = 'expired'
   where id = p_membership_id
     and status = 'reserved';
  return found;
end;
$fn$;
