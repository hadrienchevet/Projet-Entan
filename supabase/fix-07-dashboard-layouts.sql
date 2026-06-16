-- =============================================================================
-- PROJET ENTAN — Migration fix-07 : tableau de bord modulable
-- Disposition personnelle (par membre) des widgets, synchronisée et temps réel.
-- À exécuter dans le SQL Editor du dashboard Supabase. Ré-exécutable sans erreur.
-- Prérequis : fix-02 (is_project_member) déjà appliqué.
-- =============================================================================

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  project_id UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Liste ordonnée de widgets : [{ "id": "...", "settings": { ... } }]
  widgets    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Chaque membre ne voit et n'écrit QUE sa propre disposition.
DROP POLICY IF EXISTS "dashboard_layouts_all" ON dashboard_layouts;
CREATE POLICY "dashboard_layouts_all" ON dashboard_layouts
  FOR ALL
  USING (is_project_member(project_id) AND user_id = auth.uid())
  WITH CHECK (is_project_member(project_id) AND user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dashboard_layouts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_layouts;
  END IF;
END $$;
