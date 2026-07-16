-- ===========================================================================
-- fix-22 — Réparation : ajoute companies.comp_seats (manquant sur les bases
-- ayant reçu une version de fix-12 ANTÉRIEURE à l'ajout de cette colonne).
--
-- Symptôme réparé : le client sélectionne
--   companies(id,name,join_code,seats,comp_seats,is_comp,status)
-- → sans comp_seats, PostgREST renvoie 400 (42703) → l'organisation ne charge
--   jamais → la page Équipe/Organisation reste bloquée sur l'onboarding.
--
-- Idempotent. NE ré-exécute PAS le backfill de fix-12 (qui recrée des
-- entreprises automatiques). Ajoute uniquement la colonne + recharge le cache.
-- ===========================================================================

alter table public.companies
  add column if not exists comp_seats int not null default 0;

notify pgrst, 'reload schema';
