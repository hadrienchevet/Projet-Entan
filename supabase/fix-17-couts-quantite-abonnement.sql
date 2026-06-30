-- ===========================================================================
-- fix-17 — Coûts : quantité + abonnement (coût mensuel cumulable).
-- Idempotent. À exécuter après fix-08 (table cost_items).
--
--   - quantity        : quantité (le total d'une ligne = montant × quantité).
--   - is_subscription : coût mensuel récurrent (oui/non).
--   - months          : nb de mois facturés pour un abonnement (bouton « +1 mois »).
--     Total d'une ligne abonnement = montant × quantité × months.
--   Les lignes existantes (quantity=1, is_subscription=false, months=1) gardent
--   exactement le même total → aucun impact.
-- ===========================================================================

alter table cost_items
  add column if not exists quantity        numeric not null default 1,
  add column if not exists is_subscription boolean not null default false,
  add column if not exists months          integer not null default 1;

-- Recharge le cache de l'API REST (sinon écriture sur les nouvelles colonnes rejetée).
notify pgrst, 'reload schema';
