-- =============================================================================
-- ENTAN — Migration fix-32 : la RDP devient un OUTIL, plusieurs RDP par projet
--
-- Avant : la Résolution de problèmes était un TYPE de projet
-- (projects.project_type = 'rdp'), un seul RDP par projet — contrainte inscrite
-- dans le schéma (rdp_problem.project_id en PRIMARY KEY, projects.rdp_current_phase).
--
-- Après : un projet normal peut activer l'outil « rdp » et contenir PLUSIEURS
-- résolutions de problème, chacune rattachée au projet parent.
--
-- Choix : on AJOUTE rdp_id sans retirer project_id des 9 tables. Les policies
-- RLS (is_project_member(project_id)) et le filtre realtime (project_id=eq.…)
-- continuent donc de fonctionner sans être réécrits. rdp_id est le vrai parent,
-- project_id reste la dénormalisation qui porte la sécurité.
--
-- Prérequis : fix-03 et fix-04 appliqués. Idempotent (ré-exécutable).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. L'entité RDP
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rdps (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL DEFAULT 'Résolution de problème',
  status        TEXT        NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'cloturee')),
  -- Phase courante de la démarche (0 = Choisir un sujet … 6 = Standardiser).
  -- Remplace projects.rdp_current_phase, qui n'avait plus de sens à plusieurs RDP.
  current_phase INTEGER     NOT NULL DEFAULT 0 CHECK (current_phase BETWEEN 0 AND 6),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rdps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rdps_all" ON rdps;
CREATE POLICY "rdps_all" ON rdps
  FOR ALL USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE INDEX IF NOT EXISTS rdps_project_idx ON rdps (project_id);

-- -----------------------------------------------------------------------------
-- 2. rdp_id sur les 9 tables RDP — nullable d'abord, pour permettre le backfill
-- -----------------------------------------------------------------------------
ALTER TABLE five_why_analyses ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE five_why_levels   ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE ishikawa_analyses ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE ishikawa_causes   ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE capa_actions      ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE rdp_subjects      ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE rdp_indicators    ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE rdp_solutions     ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;
ALTER TABLE rdp_problem       ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 3. Backfill — un RDP par projet qui en portait un (type 'rdp' OU données RDP
--    présentes), puis rattachement des lignes existantes.
--    Sans données RDP en base, ce bloc ne fait simplement rien.
-- -----------------------------------------------------------------------------
INSERT INTO rdps (project_id, title, current_phase)
SELECT p.id,
       'Résolution de problème',
       COALESCE(p.rdp_current_phase, 0)
FROM projects p
WHERE (
        p.project_type = 'rdp'
        OR EXISTS (SELECT 1 FROM rdp_subjects   s WHERE s.project_id = p.id)
        OR EXISTS (SELECT 1 FROM rdp_problem    r WHERE r.project_id = p.id)
        OR EXISTS (SELECT 1 FROM ishikawa_analyses i WHERE i.project_id = p.id)
        OR EXISTS (SELECT 1 FROM five_why_analyses f WHERE f.project_id = p.id)
        OR EXISTS (SELECT 1 FROM capa_actions   c WHERE c.project_id = p.id)
      )
  AND NOT EXISTS (SELECT 1 FROM rdps x WHERE x.project_id = p.id);

UPDATE five_why_analyses t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE five_why_levels   t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE ishikawa_analyses t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE ishikawa_causes   t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE capa_actions      t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE rdp_subjects      t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE rdp_indicators    t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE rdp_solutions     t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;
UPDATE rdp_problem       t SET rdp_id = r.id FROM rdps r WHERE r.project_id = t.project_id AND t.rdp_id IS NULL;

-- Les anciens projets de type 'rdp' deviennent des projets normaux avec l'outil
-- « rdp » activé (c'était leur seul contenu).
UPDATE projects
SET project_type = 'gestion',
    tools = '["rdp"]'::jsonb
WHERE project_type = 'rdp';

-- -----------------------------------------------------------------------------
-- 4. rdp_problem : la PRIMARY KEY passe de project_id à rdp_id.
--    C'est ce qui faisait « une seule fiche problème par projet ».
--    NB : si cette étape échoue pour cause de rdp_id NULL, c'est qu'il reste des
--    lignes RDP orphelines (sans projet correspondant) — les nettoyer d'abord.
-- -----------------------------------------------------------------------------
DELETE FROM rdp_problem WHERE rdp_id IS NULL;

ALTER TABLE rdp_problem DROP CONSTRAINT IF EXISTS rdp_problem_pkey;
ALTER TABLE rdp_problem ALTER COLUMN rdp_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'rdp_problem'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE rdp_problem ADD PRIMARY KEY (rdp_id);
  END IF;
END $$;

-- project_id devient facultatif sur rdp_problem : rdp_id porte l'identité, mais
-- on garde la colonne (remplie) car la policy RLS s'appuie dessus.
ALTER TABLE rdp_problem ALTER COLUMN project_id DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Realtime pour la nouvelle table (tolère une ré-exécution).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE rdps;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- NON FAIT ICI, VOLONTAIREMENT : la suppression de projects.rdp_current_phase.
-- Pendant le déploiement, une ancienne version du client la lit encore. À
-- retirer dans un fix-33 une fois la nouvelle version en ligne et stable.
-- =============================================================================
