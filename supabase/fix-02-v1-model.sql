-- ===========================================================================
-- MIGRATION fix-02 : passage au modèle V1 (équipe + RACI porté par l'action)
-- À exécuter dans le SQL Editor sur une base créée avec l'ancien schema.sql
-- (déjà corrigée par fix-01). Les nouvelles installations utilisent
-- directement schema.sql, qui contient déjà tout ceci.
--
-- Ce qui change :
--   - nouvelle table `members` (équipe métier : nom + fonction, compte
--     facultatif), remplie depuis les comptes déjà membres ;
--   - actions : responsible_id obligatoire (→ members) + accountable /
--     consulted[] / informed[] + start_date ; assignee_id disparaît ;
--   - la table raci_roles disparaît (le RACI vit sur l'action, comme en V1).
-- ===========================================================================

-- 1. Équipe métier ----------------------------------------------------------
create table public.members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  job_role text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

alter table public.members enable row level security;
create policy "members_all" on public.members for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- Chaque compte déjà membre d'un projet devient un membre de l'équipe.
insert into public.members (project_id, user_id, name, created_at)
select pm.project_id, pm.user_id, coalesce(p.display_name, p.email), pm.joined_at
from public.project_members pm
join public.profiles p on p.id = pm.user_id;

-- 2. Actions : colonnes RACI du modèle V1 -----------------------------------
alter table public.actions add column responsible_id uuid references public.members (id);
alter table public.actions add column accountable_id uuid references public.members (id) on delete set null;
alter table public.actions add column consulted_ids uuid[] not null default '{}';
alter table public.actions add column informed_ids uuid[] not null default '{}';
alter table public.actions add column start_date date;

-- Responsible des actions existantes : l'assigné s'il existe, sinon l'owner.
update public.actions a
set responsible_id = coalesce(
  (select m.id from public.members m
   where m.project_id = a.project_id and m.user_id = a.assignee_id),
  (select m.id from public.members m
   join public.projects p on p.id = m.project_id
   where m.project_id = a.project_id and m.user_id = p.owner_id)
);

alter table public.actions alter column responsible_id set not null;
alter table public.actions alter column description set default '';
update public.actions set description = '' where description is null;
alter table public.actions alter column description set not null;
alter table public.actions drop column assignee_id;

-- 3. Le RACI ne vit plus dans une table séparée -----------------------------
drop table if exists public.raci_roles;

-- 4. Triggers / RPC : l'équipe suit les comptes -----------------------------
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

-- 5. Les écritures passent par le client (RLS) : tout membre peut renommer
--    le projet, comme en V1.
drop policy if exists "projects_update" on public.projects;
create policy "projects_update" on public.projects for update
  using (public.is_project_member(id));

-- 6. Realtime ---------------------------------------------------------------
alter publication supabase_realtime add table public.members;
