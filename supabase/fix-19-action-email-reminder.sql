-- ===========================================================================
-- fix-19 — Rappel email au démarrage d'une action (opt-in, responsable).
-- Idempotent. À exécuter après le schéma de base (actions).
--
--   - actions.notify_email : l'action doit-elle déclencher un email au
--     responsable le jour de sa date de début ? (case à cocher côté app)
--   - notification_log      : journal d'envoi — garantit qu'un email
--     (action × type) n'est envoyé QU'UNE fois. Écrit par le cron
--     (service-role, hors RLS). Aucune policy → invisible aux rôles publics.
-- ===========================================================================

alter table public.actions
  add column if not exists notify_email boolean not null default false;

create table if not exists public.notification_log (
  id         uuid primary key default gen_random_uuid(),
  action_id  uuid not null references public.actions (id) on delete cascade,
  kind       text not null,               -- 'start' (extensible plus tard)
  sent_at    timestamptz not null default now(),
  unique (action_id, kind)
);

alter table public.notification_log enable row level security;
-- Aucune policy : seul le cron (service-role) y accède.

notify pgrst, 'reload schema';
