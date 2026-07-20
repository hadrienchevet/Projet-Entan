-- ===========================================================================
-- fix-28 — Dépendances entre actions (liens fin → début sur le Gantt).
-- Idempotent. À exécuter après le schéma de base (actions).
--
--   - actions.depends_on_ids : ids des actions PRÉDÉCESSEURS — l'action ne
--     devrait pas commencer avant que celles-ci soient finies. Même modèle
--     que consulted_ids/informed_ids (tableau d'UUID, pas de FK : un id
--     orphelin après suppression d'une action est simplement ignoré à
--     l'affichage). Créé/supprimé au glisser-déposer sur le Gantt.
-- ===========================================================================

alter table public.actions
  add column if not exists depends_on_ids uuid[] not null default '{}';

notify pgrst, 'reload schema';
