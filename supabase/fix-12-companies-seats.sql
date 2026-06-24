-- ===========================================================================
-- fix-12 — Multi-tenant entreprise + facturation par siège
-- Idempotent. À exécuter après fix-11.
--
--   - companies         : tenant + abonnement par siège (Stripe quantity).
--                         is_comp = accès offert (via clé ou backfill).
--   - company_members   : LES SIÈGES (un membre actif = un siège facturable).
--   - company_invitations : invitation par email → siège.
--   - access_keys       : clés d'accès offert (single-use), comparées par hash.
--   - projects.company_id : rattache un projet à une entreprise.
--
--   L'ACCÈS aux données reste PAR PROJET (is_project_member) — inchangé.
--   companies ne sert qu'au tenant + facturation + sièges.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.companies (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  seats                  int not null default 0,          -- quantité payée (Stripe)
  is_comp                boolean not null default false,   -- accès offert (clé / grandfather)
  status                 text,
  stripe_customer_id     text unique,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status     text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.company_invitations (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email      text not null,
  role       text not null default 'member' check (role in ('admin', 'member')),
  token      uuid not null unique default gen_random_uuid(),
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

-- Clés d'accès : on ne stocke JAMAIS la clé en clair, seulement son hash sha256.
create table if not exists public.access_keys (
  id          uuid primary key default gen_random_uuid(),
  code_hash   text not null unique,
  redeemed_by uuid references public.companies (id) on delete set null,
  redeemed_at timestamptz,
  label       text,
  created_at  timestamptz not null default now()
);

alter table public.projects
  add column if not exists company_id uuid references public.companies (id) on delete cascade;

create index if not exists idx_projects_company_id  on public.projects (company_id);
create index if not exists idx_company_members_user on public.company_members (user_id);
create index if not exists idx_company_invitations_email on public.company_invitations (lower(email));

-- ---------------------------------------------------------------------------
-- 2. Fonctions (SECURITY DEFINER → hors RLS, pas de récursion)
-- ---------------------------------------------------------------------------

-- Entreprise active du compte courant (V1 : une seule).
create or replace function public.current_company_id()
returns uuid language sql security definer stable set search_path = public as $$
  select company_id from public.company_members
   where user_id = auth.uid() and status = 'active'
   order by created_at asc
   limit 1;
$$;

create or replace function public.is_company_member(p_company uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.company_members
     where company_id = p_company and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_company_admin(p_company uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.company_members
     where company_id = p_company and user_id = auth.uid()
       and status = 'active' and role in ('owner', 'admin')
  );
$$;

-- Sièges autorisés : illimité si accès offert, sinon max(gratuits, payés). FREE_SEATS = 2.
create or replace function public.seat_allowance(p_company uuid)
returns int language sql security definer stable set search_path = public as $$
  select case when c.is_comp then 2147483647 else greatest(2, c.seats) end
  from public.companies c where c.id = p_company;
$$;

-- ---------------------------------------------------------------------------
-- 3. Triggers d'intégrité
-- ---------------------------------------------------------------------------

-- Limite de sièges : pas plus de membres actifs que l'allocation.
create or replace function public.enforce_seat_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_active int;
begin
  if new.status = 'active' then
    select count(*) into v_active
      from public.company_members
     where company_id = new.company_id and status = 'active' and user_id <> new.user_id;
    if (v_active + 1) > public.seat_allowance(new.company_id) then
      raise exception 'seat_limit_reached';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists before_company_member_seat on public.company_members;
create trigger before_company_member_seat
  before insert or update on public.company_members
  for each row execute function public.enforce_seat_limit();

-- Un membre de projet doit appartenir à la company du projet.
create or replace function public.enforce_project_member_company()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  select company_id into v_company from public.projects where id = new.project_id;
  if v_company is not null and not exists (
    select 1 from public.company_members
     where company_id = v_company and user_id = new.user_id and status = 'active'
  ) then
    raise exception 'user_not_in_company';
  end if;
  return new;
end;
$$;

drop trigger if exists before_project_member_company on public.project_members;
create trigger before_project_member_company
  before insert on public.project_members
  for each row execute function public.enforce_project_member_company();

-- ---------------------------------------------------------------------------
-- 4. RPC (création company, acceptation invitation, clé d'accès)
-- ---------------------------------------------------------------------------

create or replace function public.create_company(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.companies (name, status)
    values (coalesce(nullif(p_name, ''), 'Mon entreprise'), 'active')
    returning id into v_company;
  insert into public.company_members (company_id, user_id, role, status)
    values (v_company, auth.uid(), 'owner', 'active');
  return v_company;
end;
$$;

create or replace function public.accept_company_invitation(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_role text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select company_id, role into v_company, v_role
    from public.company_invitations
   where token = p_token and status = 'pending' and expires_at > now();
  if v_company is null then raise exception 'invitation_invalid'; end if;
  insert into public.company_members (company_id, user_id, role, status)
    values (v_company, auth.uid(), v_role, 'active')
    on conflict (company_id, user_id) do update set status = 'active';
  update public.company_invitations set status = 'accepted' where token = p_token;
  return v_company;
end;
$$;

-- Utiliser une clé d'accès : comp l'entreprise courante (accès gratuit illimité).
create or replace function public.redeem_access_key(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_key uuid;
begin
  v_company := public.current_company_id();
  if v_company is null then raise exception 'no_company'; end if;
  if not public.is_company_admin(v_company) then raise exception 'not_admin'; end if;
  select id into v_key from public.access_keys
   where code_hash = encode(digest(p_code, 'sha256'), 'hex') and redeemed_by is null
   for update;
  if v_key is null then raise exception 'invalid_or_used_key'; end if;
  update public.access_keys set redeemed_by = v_company, redeemed_at = now() where id = v_key;
  update public.companies set is_comp = true, status = 'comp' where id = v_company;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.companies          enable row level security;
alter table public.company_members    enable row level security;
alter table public.company_invitations enable row level security;
alter table public.access_keys        enable row level security;
-- access_keys : AUCUNE policy → seul le RPC (security definer) y accède. Les clés ne fuitent jamais.

drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select using (public.is_company_member(id));
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update
  using (public.is_company_admin(id)) with check (public.is_company_admin(id));

drop policy if exists company_members_select on public.company_members;
create policy company_members_select on public.company_members for select
  using (public.is_company_member(company_id));
drop policy if exists company_members_admin on public.company_members;
create policy company_members_admin on public.company_members for all
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

drop policy if exists company_invitations_select on public.company_invitations;
create policy company_invitations_select on public.company_invitations for select
  using (public.is_company_member(company_id)
         or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists company_invitations_admin on public.company_invitations;
create policy company_invitations_admin on public.company_invitations for all
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

-- projects : on ajoute la contrainte de company à l'INSERT (la SELECT par projet reste via fix-10).
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert
  with check (owner_id = auth.uid() and company_id = public.current_company_id());

-- project_members : un membre du projet peut ajouter un collègue (le trigger
-- enforce_project_member_company garantit qu'il est bien dans l'entreprise).
drop policy if exists pm_insert on public.project_members;
create policy pm_insert on public.project_members for insert
  with check (public.is_project_member(project_id) or public.is_project_owner(project_id));

-- ---------------------------------------------------------------------------
-- 6. Clés d'accès (5) — hashes sha256 (clés en clair remises hors dépôt)
-- ---------------------------------------------------------------------------

insert into public.access_keys (code_hash, label) values
  ('b4e7e4de8c8a07acd34605c55e30b9c2ac9ddcdd8a746d76aa65e9f60d454f08', 'cle-1'),
  ('eb831db6d65dce5d5659c08c88e9ca9305c59eda85883489eb9ba4be5a2d6dd1', 'cle-2'),
  ('2c3354ea2f4e80e95c78f0d2eebb1aab8d6d9ba84a0479ae8316967748cf6d6a', 'cle-3'),
  ('c8d2c3efe3905758129d90294179538a321d708fc8d7900829d1f476d6ad8430', 'cle-4'),
  ('842b18ce37ee8a0bb3ef340ac18faa22efaeab1cded5186de4bd504ebdfc7cc1', 'cle-5')
on conflict (code_hash) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Backfill : une company (grandfather = is_comp) par owner existant
-- ---------------------------------------------------------------------------

do $$
declare r record; v_company uuid;
begin
  for r in
    select distinct owner_id from public.projects where company_id is null and owner_id is not null
  loop
    insert into public.companies (name, is_comp, status)
    select coalesce(p.display_name, p.email, 'Mon entreprise'), true, 'comp'
      from public.profiles p where p.id = r.owner_id
    returning id into v_company;

    insert into public.company_members (company_id, user_id, role, status)
      values (v_company, r.owner_id, 'owner', 'active')
      on conflict do nothing;

    update public.projects set company_id = v_company
     where owner_id = r.owner_id and company_id is null;

    insert into public.company_members (company_id, user_id, role, status)
    select distinct v_company, pm.user_id, 'member', 'active'
      from public.project_members pm
      join public.projects pr on pr.id = pm.project_id
     where pr.company_id = v_company and pm.user_id <> r.owner_id
      on conflict do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Dépréciation du gating par-compte (fix-11) : projets désormais illimités
-- ---------------------------------------------------------------------------

drop trigger if exists before_project_insert_limit on public.projects;
drop function if exists public.enforce_project_limit();
-- (la table `subscriptions` peut être supprimée plus tard ; laissée pour l'instant.)

notify pgrst, 'reload schema';
