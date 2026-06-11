-- =============================================================================
-- PILOTIX — Migration fix-03 : mode Résolution de Problèmes (RDP)
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- Prérequis : fix-02-v1-model.sql déjà appliqué.
-- =============================================================================

-- Ajouter le type de projet ('gestion' par défaut pour tous les projets existants).
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'gestion'
  CHECK (project_type IN ('gestion', 'rdp'));

-- -----------------------------------------------------------------------------
-- 5 Pourquoi
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS five_why_analyses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  problem_statement TEXT  NOT NULL DEFAULT '',
  pdca_phase  TEXT        NOT NULL DEFAULT 'plan'
    CHECK (pdca_phase IN ('plan', 'do', 'check', 'act', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Niveaux de l'arbre Pourquoi (1 à 5 par analyse, level_num unique par analyse).
CREATE TABLE IF NOT EXISTS five_why_levels (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id  UUID        NOT NULL REFERENCES five_why_analyses(id) ON DELETE CASCADE,
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  level_num    INTEGER     NOT NULL CHECK (level_num BETWEEN 1 AND 5),
  why_question TEXT        NOT NULL DEFAULT '',
  because_answer TEXT      NOT NULL DEFAULT '',
  is_root_cause BOOLEAN    NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (analysis_id, level_num)
);

-- -----------------------------------------------------------------------------
-- Ishikawa (diagramme causes-effets 6M)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ishikawa_analyses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  effect      TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ishikawa_causes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id  UUID        NOT NULL REFERENCES ishikawa_analyses(id) ON DELETE CASCADE,
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category     TEXT        NOT NULL CHECK (
    category IN ('Matière','Méthode','Machine','Main-d''œuvre','Milieu','Mesure')
  ),
  cause_text   TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- CAPA — actions correctives et préventives
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS capa_actions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL DEFAULT 'corrective'
    CHECK (type IN ('corrective', 'preventive')),
  title          TEXT        NOT NULL,
  description    TEXT        NOT NULL DEFAULT '',
  responsible_id UUID        REFERENCES members(id) ON DELETE SET NULL,
  status         TEXT        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed', 'verified')),
  due_date       DATE,
  source         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- La fonction is_project_member() vient du schéma principal.
-- -----------------------------------------------------------------------------
ALTER TABLE five_why_analyses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE five_why_levels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ishikawa_analyses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ishikawa_causes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE capa_actions       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fwa_all"  ON five_why_analyses
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "fwl_all"  ON five_why_levels
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "isha_all" ON ishikawa_analyses
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "ishc_all" ON ishikawa_causes
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "capa_all" ON capa_actions
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE five_why_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE five_why_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE ishikawa_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE ishikawa_causes;
ALTER PUBLICATION supabase_realtime ADD TABLE capa_actions;
