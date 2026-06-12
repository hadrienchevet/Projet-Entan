-- =============================================================================
-- PROJET ENTAN — Migration fix-05 : cotation AMDEC résiduelle (après actions)
-- Permet la matrice de risque comparative avant / après actions correctives.
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- Prérequis : fix-02-v1-model.sql déjà appliqué.
-- =============================================================================

-- Cotation après mise en œuvre des actions correctives (NULL = pas encore
-- réévalué). Même échelle 1–4 que la cotation initiale.
ALTER TABLE amdec_items
  ADD COLUMN IF NOT EXISTS severity_after   INTEGER CHECK (severity_after   BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS occurrence_after INTEGER CHECK (occurrence_after BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS detection_after  INTEGER CHECK (detection_after  BETWEEN 1 AND 4);
