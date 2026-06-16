-- =============================================================================
-- PROJET ENTAN — Migration fix-08 : outils modulables + suivi des coûts
-- À exécuter dans le SQL Editor du dashboard Supabase. Ré-exécutable sans erreur.
-- Prérequis : fix-02 (is_project_member) déjà appliqué.
-- =============================================================================

-- Palette d'outils activés par projet (null = jeu par défaut).
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tools jsonb;

-- -----------------------------------------------------------------------------
-- Suivi des coûts : un poste de dépense = budget prévu vs coût réel.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  planned    NUMERIC NOT NULL DEFAULT 0,   -- budget prévu
  actual     NUMERIC NOT NULL DEFAULT 0,   -- coût réel
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cost_items_all" ON cost_items;
CREATE POLICY "cost_items_all" ON cost_items
  FOR ALL
  USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

-- Ajout à la publication Realtime, seulement si pas déjà présent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cost_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cost_items;
  END IF;
END $$;
