-- =============================================================================
-- ENTAN — Migration fix-33 : les actions correctives d'un RDP deviennent de
-- VRAIES actions du projet.
--
-- Avant : une action décidée en résolution de problème vivait dans
-- `capa_actions`, table à part → elle n'apparaissait ni dans le Gantt, ni dans
-- le dashboard, ni en revue, ni dans « Mes actions », ni au compte-rendu. Le
-- chef de projet la ressaisissait dans le module Actions.
--
-- Après : c'est une ligne de `actions` porteuse de `rdp_id`, exactement comme
-- `amdec_item_id` relie déjà une action à un risque AMDEC.
--
-- Prérequis : fix-32 appliqué (table `rdps`). Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Le lien + les attributs propres à la méthode CAPA
-- -----------------------------------------------------------------------------
-- ON DELETE SET NULL (et non CASCADE, contrairement aux 9 tables de fix-32) :
-- supprimer une résolution ne doit pas effacer des actions engagées auprès de
-- l'équipe. Elles se détachent simplement de la démarche.
ALTER TABLE actions ADD COLUMN IF NOT EXISTS rdp_id UUID REFERENCES rdps(id) ON DELETE SET NULL;

-- Phase de la démarche : 5 = mise en œuvre, 6 = standardisation.
ALTER TABLE actions ADD COLUMN IF NOT EXISTS rdp_phase INTEGER CHECK (rdp_phase IN (5, 6));

ALTER TABLE actions ADD COLUMN IF NOT EXISTS capa_type TEXT CHECK (capa_type IN ('corrective', 'preventive'));

-- « Vérifiée » est une 4e étape du statut CAPA (vérification d'efficacité) qui
-- n'existe pas pour une action ordinaire. Plutôt que de la perdre en écrasant
-- le statut, on la porte à part : ailleurs dans l'app l'action est « terminée ».
ALTER TABLE actions ADD COLUMN IF NOT EXISTS capa_verified BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS actions_rdp_idx ON actions (rdp_id);

-- -----------------------------------------------------------------------------
-- 2. Reprise des capa_actions existantes
--    (en pratique la table est vide en production : ce bloc ne fera rien)
-- -----------------------------------------------------------------------------
INSERT INTO actions (
  project_id, rdp_id, rdp_phase, capa_type, capa_verified,
  title, description, responsible_id, status, due_date, created_at
)
SELECT
  c.project_id,
  c.rdp_id,
  COALESCE(c.phase, 5),
  c.type,
  (c.status = 'verified'),
  c.title,
  -- `source` n'a pas d'équivalent sur les actions : on le préserve en clair.
  CASE
    WHEN COALESCE(c.source, '') <> '' THEN trim(both E'\n' FROM COALESCE(c.description, '')) || E'\n\nSource : ' || c.source
    ELSE COALESCE(c.description, '')
  END,
  c.responsible_id,
  CASE c.status
    WHEN 'open'        THEN 'todo'
    WHEN 'in_progress' THEN 'in_progress'
    ELSE 'done'                       -- closed ET verified
  END,
  c.due_date,
  c.created_at
FROM capa_actions c
WHERE c.rdp_id IS NOT NULL
  -- actions.responsible_id est NOT NULL : une CAPA sans responsable ne peut pas
  -- être reprise telle quelle (cf. le NOTICE ci-dessous).
  AND c.responsible_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM actions a
    WHERE a.rdp_id = c.rdp_id AND a.title = c.title AND a.created_at = c.created_at
  );

DO $$
DECLARE orphelines INTEGER;
BEGIN
  SELECT count(*) INTO orphelines
  FROM capa_actions WHERE responsible_id IS NULL OR rdp_id IS NULL;
  IF orphelines > 0 THEN
    RAISE NOTICE 'fix-33 : % action(s) CAPA non reprises (sans responsable ou sans rdp_id). Elles restent dans capa_actions ; leur affecter un responsable puis ré-exécuter cette migration.', orphelines;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- NON FAIT ICI, VOLONTAIREMENT : la suppression de `capa_actions`.
-- La table n'est plus ni lue ni écrite par l'application (dépréciée), mais on
-- la garde le temps de confirmer la reprise. Suppression dans un fix-34.
-- =============================================================================
