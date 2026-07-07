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
  passThreshold: 0.875,
  buckets: [
    { id: 'forces', label: 'Forces', hint: 'Atout interne', tone: 'success' },
    { id: 'faiblesses', label: 'Faiblesses', hint: 'Limite interne', tone: 'danger' },
    { id: 'opportunites', label: 'Opportunités', hint: 'Levier externe', tone: 'accent' },
    { id: 'menaces', label: 'Menaces', hint: 'Risque externe', tone: 'warning' },
  ],
  items: [
    // Forces — interne + positif
    { id: 's1', prompt: 'Équipe technique très expérimentée', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's2', prompt: 'Trésorerie solide', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's3', prompt: 'Outil de production récent et automatisé', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's4', prompt: 'Marque reconnue et bonne réputation', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's5', prompt: 'Certification ISO 9001 obtenue', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's6', prompt: 'Faible turnover des équipes', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's7', prompt: 'Savoir-faire breveté maîtrisé en interne', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's8', prompt: 'Réseau de distribution bien implanté', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's9', prompt: 'Marges élevées sur la gamme premium', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    { id: 's10', prompt: 'Service après-vente réactif et apprécié', answer: 'forces', why: 'Interne et positif : c’est une force.' },
    // Faiblesses — interne + négatif
    { id: 's11', prompt: 'Parc machines vieillissant', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's12', prompt: 'Dépendance à un seul gros client', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's13', prompt: 'Endettement élevé de l’entreprise', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's14', prompt: 'Absence de service marketing structuré', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's15', prompt: 'Délais de production trop longs', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's16', prompt: 'Système informatique obsolète', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's17', prompt: 'Manque de compétences en digital', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's18', prompt: 'Gamme de produits peu diversifiée', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's19', prompt: 'Coûts de fabrication supérieurs à la concurrence', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    { id: 's20', prompt: 'Locaux trop exigus pour la croissance', answer: 'faiblesses', why: 'Interne et négatif : c’est une faiblesse.' },
    // Opportunités — externe + positif
    { id: 's21', prompt: 'Un nouveau marché à l’export s’ouvre', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's22', prompt: 'Aide publique à la modernisation industrielle', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's23', prompt: 'Demande croissante pour les produits écologiques', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's24', prompt: 'Retrait d’un concurrent du marché', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's25', prompt: 'Nouvelle technologie devenue abordable', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's26', prompt: 'Baisse du prix des matières premières', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's27', prompt: 'Partenariat possible avec un grand distributeur', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's28', prompt: 'Marché local en forte croissance démographique', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's29', prompt: 'Subventions pour la transition énergétique', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    { id: 's30', prompt: 'Évolution favorable des habitudes de consommation', answer: 'opportunites', why: 'Externe et positif : c’est une opportunité.' },
    // Menaces — externe + négatif
    { id: 's31', prompt: 'Les délais des fournisseurs s’allongent', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's32', prompt: 'Nouvelle réglementation environnementale contraignante', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's33', prompt: 'Arrivée d’un concurrent low-cost', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's34', prompt: 'Forte hausse du prix de l’énergie', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's35', prompt: 'Pénurie de main-d’œuvre qualifiée sur le marché', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's36', prompt: 'Instabilité géopolitique perturbant les approvisionnements', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's37', prompt: 'Baisse du pouvoir d’achat des clients', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's38', prompt: 'Concentration des fournisseurs sur le marché', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's39', prompt: 'Multiplication des cyberattaques dans le secteur', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
    { id: 's40', prompt: 'Durcissement des normes imposées par la profession', answer: 'menaces', why: 'Externe et négatif : c’est une menace.' },
  ],
};

/** Catalogue des jeux disponibles (les outils absents apparaissent « Bientôt »). */
export const CHALLENGE_SETS: Partial<Record<AcademyToolId, ChallengeSet>> = {
  swot: SWOT,
};

export function challengeSet(tool: AcademyToolId): ChallengeSet | undefined {
  return CHALLENGE_SETS[tool];
}
