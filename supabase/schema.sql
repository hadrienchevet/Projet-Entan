-- ===========================================================================
-- PILOTIX — Schéma Supabase (modèle V1 : équipe, RACI porté par les actions)
-- À exécuter dans le SQL Editor du dashboard Supabase (installation neuve).
-- Base existante : utiliser les fichiers fix-*.sql dans l'ordre.
--
-- Principes :
--   - Multi-tenant par projet, isolé par Row Level Security (RLS).
--   - project_members = QUI A ACCÈS (comptes connectés) — sécurité.
--   - members = L'ÉQUIPE MÉTIER (nom + fonction, compte facultatif) — comme
--     dans la V1 : on ajoute « Marc, Resp. maintenance » sans qu'il ait de
--     compte ; s'il rejoint via une invitation, son compte s'y rattache.
--   - Le RACI vit SUR l'action (responsible obligatoire, accountable,
--     consulted[], informed[]) — modèle V1, pas de table de rôles séparée.
--   - Criticité AMDEC = colonne générée G × O × D (échelle 1–4).
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profils : miroir public de auth.users, alimenté à l'inscription.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Projets, accès (comptes) et équipe (membres métier)
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- L'équipe du projet (source unique des responsables — modèle V1).
create table public.members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  -- Compte rattaché (null = membre « papier », ajouté à la main).
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  -- Fonction / poste (ex. « Chef de projet ») — `role` côté V1.
  job_role text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Invitations : un token unique par lien, consommé via accept_invitation().
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AMDEC : cotation G / O / D sur 1–4, criticité calculée (1–64).
-- Seuils applicatifs : >= 24 critique, >= 12 à surveiller.
-- ---------------------------------------------------------------------------
create table public.amdec_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  element text not null,
  failure_mode text not null,
  cause text not null,
  effect text,
  severity int not null check (severity between 1 and 4),
  occurrence int not null check (occurrence between 1 and 4),
  detection int not null check (detection between 1 and 4),
  criticality int generated always as (severity * occurrence * detection) stored,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Actions : le RACI est porté par l'action (modèle V1).
-- responsible_id NOT NULL + pas de cascade : impossible de supprimer un
-- membre encore Responsible (règle V1, garantie par la base).
-- ---------------------------------------------------------------------------
create table public.actions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  amdec_item_id uuid references public.amdec_items (id) on delete set null,
  title text not null,
  description text not null default '',
  responsible_id uuid not null references public.members (id),
  accountable_id uuid references public.members (id) on delete set null,
  consulted_ids uuid[] not null default '{}',
  informed_ids uuid[] not null default '{}',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  start_date date,
  due_date date,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- Fonctions de permission (SECURITY DEFINER : pas de récursion RLS)
-- ===========================================================================

create or replace function public.is_project_member(p_project uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from project_members
    where project_id = p_project and user_id = auth.uid()
  );
$$;

create or replace function public.is_project_owner(p_project uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from projects
    where id = p_project and owner_id = auth.uid()
  );
$$;

create or replace function public.shares_project_with(p_user uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1
    from project_members a
    join project_members b on a.project_id = b.project_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

-- Le créateur d'un projet : accès (project_members) + membre de l'équipe.
create or replace function public.handle_new_project()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into public.members (project_id, user_id, name)
  select new.id, new.owner_id, coalesce(p.display_name, p.email)
  from public.profiles p where p.id = new.owner_id;

  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- Acceptation d'invitation : accès + rattachement à l'équipe.
create or replace function public.accept_invitation(p_token uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_project uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select project_id into v_project
  from invitations
  where token = p_token and expires_at > now();

  if v_project is null then
    raise exception 'invitation_invalid';
  end if;

  insert into project_members (project_id, user_id, role)
  values (v_project, auth.uid(), 'member')
  on conflict (project_id, user_id) do nothing;

  insert into members (project_id, user_id, name)
  select v_project, auth.uid(), coalesce(p.display_name, p.email)
  from profiles p where p.id = auth.uid()
  on conflict (project_id, user_id) do nothing;

  return v_project;
end;
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.members enable row level security;
alter table public.invitations enable row level security;
alter table public.amdec_items enable row level security;
alter table public.actions enable row level security;

create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.shares_project_with(id));
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid());

-- L'owner est accepté directement : au INSERT ... RETURNING, le trigger
-- d'ajout du membre n'a pas encore tourné.
create policy "projects_select" on public.projects for select
  using (owner_id = auth.uid() or public.is_project_member(id));
create policy "projects_insert" on public.projects for insert
  with check (owner_id = auth.uid());
create policy "projects_update" on public.projects for update
  using (public.is_project_member(id));
create policy "projects_delete" on public.projects for delete
  using (owner_id = auth.uid());

create policy "pm_select" on public.project_members for select
  using (public.is_project_member(project_id));
create policy "pm_delete" on public.project_members for delete
  using (user_id = auth.uid() or public.is_project_owner(project_id));

create policy "members_all" on public.members for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "invitations_select" on public.invitations for select
  using (public.is_project_member(project_id));
create policy "invitations_insert" on public.invitations for insert
  with check (public.is_project_member(project_id) and created_by = auth.uid());
create policy "invitations_delete" on public.invitations for delete
  using (public.is_project_member(project_id));

create policy "amdec_all" on public.amdec_items for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "actions_all" on public.actions for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- ===========================================================================
-- Realtime
-- ===========================================================================

alter publication supabase_realtime add table public.actions;
alter publication supabase_realtime add table public.amdec_items;
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.project_members;
