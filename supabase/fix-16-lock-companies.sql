-- ===========================================================================
-- fix-16 — Verrouille les écritures sur `companies` (anti self-grant de siège).
-- Idempotent. À exécuter après fix-15.
--
-- PROBLÈME CORRIGÉ
--   La policy companies_update (fix-12) autorisait TOUT admin d'entreprise à
--   modifier n'importe quelle colonne de SA ligne `companies`, dont les colonnes
--   de sécurité / facturation : is_comp, seats, comp_seats, status, stripe_*.
--   Or user_has_seat() (fix-13) accorde un siège à tous les membres d'une
--   entreprise `is_comp = true`.
--   → Un utilisateur avec UNE clé crée une entreprise (il en devient owner/admin)
--     puis, par appel API direct, `update companies set is_comp = true` → sièges
--     illimités pour toute son équipe. Contournement complet de la facturation.
--
-- CORRECTIF
--   `companies` devient en LECTURE SEULE pour anon/authenticated. Les écritures
--   ne passent plus que par :
--     - le webhook Stripe (rôle service_role, hors RLS)        → seats/status/stripe_*
--     - les RPC SECURITY DEFINER (create_company…)             → création contrôlée
--   Aucun flux client n'écrit `companies` en direct (vérifié) → rien ne casse.
--   Les RPC SECURITY DEFINER s'exécutent avec les droits du propriétaire de la
--   fonction, donc le revoke ci-dessous ne les affecte pas.
-- ===========================================================================

-- Plus aucune écriture directe possible pour les rôles publics.
revoke insert, update, delete on public.companies from anon, authenticated;

-- La policy d'UPDATE permissive était le vecteur : on la retire.
-- (INSERT/DELETE étaient déjà refusés faute de policy ; le revoke ci-dessus
--  est une ceinture-bretelles explicite.)
drop policy if exists companies_update on public.companies;

notify pgrst, 'reload schema';
