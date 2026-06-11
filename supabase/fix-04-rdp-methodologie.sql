-- =============================================================================
-- PROJET ENTAN — Migration fix-04 : méthodologie RDP en 7 phases (0 → 6)
-- Source : « Méthodologie de résolution de problème » (P. Caliot).
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- Prérequis : fix-03-rdp-tables.sql déjà appliqué.
-- =============================================================================

-- Phase courante de la démarche (0 = Choisir un sujet … 6 = Standardiser).
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS rdp_current_phase INTEGER NOT NULL DEFAULT 0
  CHECK (rdp_current_phase BETWEEN 0 AND 6);

-- -----------------------------------------------------------------------------
-- Phase 0 — Choisir un sujet : brainstorming + tableau à double entrée
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rdp_subjects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  -- Priorisation (tableau à double entrée) : score = fréquence × impact.
  frequency   INTEGER     NOT NULL DEFAULT 1 CHECK (frequency BETWEEN 1 AND 4),
  impact      INTEGER     NOT NULL DEFAULT 1 CHECK (impact BETWEEN 1 AND 4),
  -- Sujet retenu pour la démarche (un seul par projet, géré côté app).
  retained    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Phase 1 — Poser le problème : QQOQCP + situation actuelle/souhaitée + écart
-- (une seule fiche par projet)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rdp_problem (
  project_id          UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  quoi                TEXT NOT NULL DEFAULT '',
  qui                 TEXT NOT NULL DEFAULT '',
  ou                  TEXT NOT NULL DEFAULT '',
  quand               TEXT NOT NULL DEFAULT '',
  comment             TEXT NOT NULL DEFAULT '',
  pourquoi            TEXT NOT NULL DEFAULT '',
  situation_actuelle  TEXT NOT NULL DEFAULT '',
  situation_souhaitee TEXT NOT NULL DEFAULT '',
  ecart               TEXT NOT NULL DEFAULT '',
  objectifs           TEXT NOT NULL DEFAULT ''
);

-- Tableau de bord : indicateurs de performance (phases 1 et 5).
CREATE TABLE IF NOT EXISTS rdp_indicators (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  unit           TEXT        NOT NULL DEFAULT '',
  current_value  TEXT        NOT NULL DEFAULT '',
  target_value   TEXT        NOT NULL DEFAULT '',
  frequency      TEXT        NOT NULL DEFAULT '',
  responsible_id UUID        REFERENCES members(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Phases 3-4 — Rechercher / choisir les solutions : matrice de décision
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rdp_solutions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- Cause traitée par la solution (issue de l'Ishikawa).
  cause_id      UUID        REFERENCES ishikawa_causes(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  -- Matrice de décision : trois critères notés 1–4, score = somme (3–12).
  effectiveness INTEGER     NOT NULL DEFAULT 1 CHECK (effectiveness BETWEEN 1 AND 4),
  ease          INTEGER     NOT NULL DEFAULT 1 CHECK (ease BETWEEN 1 AND 4),
  -- Coût : 4 = très peu coûteux, 1 = très coûteux.
  cost          INTEGER     NOT NULL DEFAULT 1 CHECK (cost BETWEEN 1 AND 4),
  retained      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Phases 5 et 6 — le plan d'action (capa_actions) porte maintenant sa phase :
-- 5 = mise en œuvre, 6 = standardisation.
-- -----------------------------------------------------------------------------
ALTER TABLE capa_actions
  ADD COLUMN IF NOT EXISTS phase INTEGER NOT NULL DEFAULT 5
  CHECK (phase IN (5, 6));

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE rdp_subjects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdp_problem    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdp_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdp_solutions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rdp_subjects_all" ON rdp_subjects
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "rdp_problem_all" ON rdp_problem
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "rdp_indicators_all" ON rdp_indicators
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "rdp_solutions_all" ON rdp_solutions
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE rdp_subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE rdp_problem;
ALTER PUBLICATION supabase_realtime ADD TABLE rdp_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE rdp_solutions;
