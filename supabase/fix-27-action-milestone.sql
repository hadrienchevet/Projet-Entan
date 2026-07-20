-- ===========================================================================
-- fix-27 — Jalons (milestones) sur les actions.
-- Idempotent. À exécuter après le schéma de base (actions).
--
--   - actions.is_milestone : l'action est un jalon — un point de passage clé
--     du projet (case à cocher côté app). Sur le Gantt, un jalon s'affiche en
--     losange à sa date d'échéance au lieu d'une barre de durée.
-- ===========================================================================

alter table public.actions
  add column if not exists is_milestone boolean not null default false;

notify pgrst, 'reload schema';
