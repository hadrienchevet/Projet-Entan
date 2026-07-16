/**
 * Certification ENTAN — dérivée de la progression de l'Académie.
 *
 * Un profil est « Certifié » lorsqu'il a décroché le badge de TOUS les outils
 * du parcours (`ACADEMY_TOOL_ORDER`). Tant que ce n'est pas le cas, on affiche
 * l'avancement « X / N badges ». Purement calculé — aucune donnée dédiée.
 */

import { ACADEMY_TOOL_ORDER } from './challenges';
import type { AcademyProgress } from './useAcademyProgress';

export interface CertificationStatus {
  /** Nombre de badges décrochés. */
  mastered: number;
  /** Nombre total d'outils du parcours. */
  total: number;
  /** Certifié = tous les badges décrochés. */
  certified: boolean;
}

export function certificationStatus(progress: AcademyProgress): CertificationStatus {
  const total = ACADEMY_TOOL_ORDER.length;
  const mastered = ACADEMY_TOOL_ORDER.filter((tool) => progress[tool]?.passed).length;
  return { mastered, total, certified: mastered === total };
}
