-- ===========================================================================
-- fix-18 — Journal d'activité (notifications in-app).
-- Idempotent. À exécuter après fix-02 (is_project_member).
--
--   activity_events : événements majeurs du projet (création/assignation/clôture
--   d'action, nouveau risque AMDEC, document modifié…). Alimenté par le store
--   (écriture tolérante). Sert le fil d'activité in-app. Les ALERTES (retards,
--   échéances, risques sans plan) restent CALCULÉES côté client — pas stockées.
-- ===========================================================================

create table if not exists public.activity_events (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  actor_name text not null default '',
  type       text not null,          -- action_created | action_assigned | action_done | amdec_created | doc_updated
  summary    text not null,          -- ex. « a modifié la charte A3 »
  entity     text,                   -- cible facultative (regroupement)
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;

drop policy if exists activity_events_all on public.activity_events;
create policy activity_events_all on public.activity_events for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create index if not exists idx_activity_project_created
  on public.activity_events (project_id, created_at desc);

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_events') then
    alter publication supabase_realtime add table public.activity_events;
  end if;
end $$;

notify pgrst, 'reload schema';
