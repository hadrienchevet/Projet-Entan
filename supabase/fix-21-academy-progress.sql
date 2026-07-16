-- ===========================================================================
-- fix-21 — Progression de l'Académie persistée par utilisateur (+ vue manager)
-- Idempotent. À exécuter après fix-20.
--
--   academy_progress : 1 ligne par (utilisateur, jeu de l'Académie).
--     - best   : meilleur score obtenu.
--     - total  : nombre de questions du jeu.
--     - passed : badge décroché au moins une fois.
--
--   Écriture réservée à l'utilisateur lui-même. Lecture : soi-même, OU un
--   admin/owner d'une entreprise dont l'utilisateur est membre actif (pour la
--   vue « profil d'un membre » côté manager). L'accès aux DONNÉES projet reste
--   inchangé (par projet) ; ceci ne concerne que la formation.
-- ===========================================================================

create table if not exists public.academy_progress (
  user_id    uuid    not null references public.profiles (id) on delete cascade,
  set_id     text    not null,
  best       int     not null default 0,
  total      int     not null default 0,
  passed     boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, set_id)
);

alter table public.academy_progress enable row level security;

-- Peut-on voir la progression de p_user ? Soi-même, ou un admin/owner d'une
-- entreprise dont p_user est membre actif. SECURITY DEFINER → pas de récursion
-- RLS sur company_members.
create or replace function public.can_view_academy(p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    p_user = auth.uid()
    or exists (
      select 1
        from public.company_members me
        join public.company_members them on them.company_id = me.company_id
       where me.user_id = auth.uid()
         and me.status = 'active'
         and me.role in ('owner', 'admin')
         and them.user_id = p_user
         and them.status = 'active'
    );
$$;

-- Lecture : soi-même ou manager de l'utilisateur.
drop policy if exists academy_progress_select on public.academy_progress;
create policy academy_progress_select on public.academy_progress
  for select using (public.can_view_academy(user_id));

-- Écriture : uniquement sa propre progression.
drop policy if exists academy_progress_write on public.academy_progress;
create policy academy_progress_write on public.academy_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

notify pgrst, 'reload schema';
