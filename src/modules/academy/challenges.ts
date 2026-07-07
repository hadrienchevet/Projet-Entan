/**
 * Académie Pilotix — mini-jeux de prise en main des outils.
 *
 * Données pures (aucun composant React). Un « défi » = un énoncé à ranger dans
 * le bon panier ; le moteur `ClassifyGame` consomme ces jeux de données.
 * Ajouter un jeu = ajouter une entrée dans `CHALLENGE_SETS`, sans toucher au
 * moteur. Tout est en dur et validé par règle : aucune IA (conforme V1).
 */

export type BucketTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

/** Une catégorie de classement (un quadrant SWOT, un rôle RACI, une famille 5M…). */
export interface ClassifyBucket {
  id: string;
  label: string;
  hint: string;
  tone: BucketTone;
}

/** Une question : un énoncé + le panier correct + la justification. */
export interface ClassifyItem {
  id: string;
  prompt: string;
  /** id du panier attendu. */
  answer: string;
  /** Explication affichée après la réponse (le « pourquoi »). */
  why: string;
}

export interface ChallengeSet {
  id: string;
  /** Outil rattaché — sert au parcours et aux badges. */
  tool: AcademyToolId;
  title: string;
  tagline: string;
  buckets: ClassifyBucket[];
  items: ClassifyItem[];
  /** Part de bonnes réponses pour décrocher le badge (0–1). */
  passThreshold: number;
}

/** Ordre du parcours (chips du hub). */
export const ACADEMY_TOOL_ORDER = [
  'swot',
  'raci',
  'amdec',
  'actions',
  'planning',
  'ishikawa',
  'cinq-pourquoi',
  'a3',
] as const;
export type AcademyToolId = (typeof ACADEMY_TOOL_ORDER)[number];

export const ACADEMY_TOOL_LABELS: Record<AcademyToolId, string> = {
  swot: 'SWOT',
  raci: 'RACI',
  amdec: 'AMDEC',
  actions: 'Actions',
  planning: 'Planning',
  ishikawa: 'Ishikawa',
  'cinq-pourquoi': '5 Pourquoi',
  a3: 'Charte A3',
};

const SWOT: ChallengeSet = {
  id: 'swot',
  tool: 'swot',
  title: 'SWOT — trie dans la matrice',
  tagline: 'Interne ou externe ? Positif ou négatif ?',
  passThreshold: 0.8,
  buckets: [
    { id: 'forces', label: 'Forces', hint: 'Atout interne', tone: 'success' },
    { id: 'faiblesses', label: 'Faiblesses', hint: 'Limite interne', tone: 'danger' },
    { id: 'opportunites', label: 'Opportunités', hint: 'Levier externe', tone: 'accent' },
    { id: 'menaces', label: 'Menaces', hint: 'Risque externe', tone: 'warning' },
  ],
  items: [
    { id: 's1', prompt: 'Équipe technique très expérimentée', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's2', prompt: 'Parc machines vieillissant', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's3', prompt: 'Un nouveau marché à l’export s’ouvre', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's4', prompt: 'Les délais des fournisseurs s’allongent', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's5', prompt: 'Trésorerie solide', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's6', prompt: 'Nouvelle réglementation environnementale contraignante', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's7', prompt: 'Dépendance à un seul gros client', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's8', prompt: 'Aide publique à la modernisation industrielle', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
  ],
};

/** Catalogue des jeux disponibles (les outils absents apparaissent « Bientôt »). */
export const CHALLENGE_SETS: Partial<Record<AcademyToolId, ChallengeSet>> = {
  swot: SWOT,
};

export function challengeSet(tool: AcademyToolId): ChallengeSet | undefined {
  return CHALLENGE_SETS[tool];
}
