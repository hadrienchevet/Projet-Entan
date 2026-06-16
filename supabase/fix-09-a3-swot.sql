-- =============================================================================
-- PROJET ENTAN — Migration fix-09 : outils Charte A3 + SWOT
-- À exécuter dans le SQL Editor du dashboard Supabase. Ré-exécutable sans erreur.
-- Prérequis : fix-02 (is_project_member) déjà appliqué.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Charte A3 : une fiche structurée par projet (sections lean).
-- -----------------------------------------------------------------------------
-- NB : "analyse" est un mot réservé PostgreSQL (commande ANALYSE/ANALYZE),
-- d'où les guillemets. Le nom de colonne reste « analyse » côté API.
CREATE TABLE IF NOT EXISTS a3_reports (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  contexte   TEXT NOT NULL DEFAULT '',
  situation  TEXT NOT NULL DEFAULT '',
  objectifs  TEXT NOT NULL DEFAULT '',
  "analyse"  TEXT NOT NULL DEFAULT '',
  plan       TEXT NOT NULL DEFAULT '',
  suivi      TEXT NOT NULL DEFAULT ''
);

-- -----------------------------------------------------------------------------
-- SWOT : éléments classés par quadrant.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS swot_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quadrant   TEXT NOT NULL CHECK (quadrant IN ('forces', 'faiblesses', 'opportunites', 'menaces')),
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE a3_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE swot_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "a3_reports_all" ON a3_reports;
CREATE POLICY "a3_reports_all" ON a3_reports
  FOR ALL USING (is_project_member(project_id)) WITH CHECK (is_project_member(project_id));

DROP POLICY IF EXISTS "swot_items_all" ON swot_items;
CREATE POLICY "swot_items_all" ON swot_items
  FOR ALL USING (is_project_member(project_id)) WITH CHECK (is_project_member(project_id));

-- -----------------------------------------------------------------------------
-- Realtime (ajout idempotent)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='a3_reports') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE a3_reports;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='swot_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE swot_items;
  END IF;
END $$;
