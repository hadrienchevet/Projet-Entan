/**
 * Académie — jeu « Construis la ligne AMDEC ».
 *
 * Mécanique dédiée (≠ classement) : pour chaque scénario, l'apprenant
 * 1) distingue le mode de défaillance, la cause et l'effet (la confusion n°1
 *    quand on remplit un AMDEC), puis 2) cote Gravité / Occurrence /
 *    Détectabilité et voit la criticité + la priorité se calculer.
 * Données pures, aucune IA : les bonnes réponses et la cotation de référence
 * sont en dur, avec leur justification.
 */

export interface AmdecScenario {
  id: string;
  /** Élément / composant analysé (contexte donné). */
  element: string;
  /** Courte mise en situation. */
  situation: string;
  /** Bonne réponse — façon dont l'élément défaille. */
  mode: string;
  /** Bonne réponse — origine de la défaillance. */
  cause: string;
  /** Bonne réponse — conséquence de la défaillance. */
  effect: string;
  /** Cotation de référence (1–4) et sa justification (étape formative). */
  g: number;
  o: number;
  d: number;
  gWhy: string;
  oWhy: string;
  dWhy: string;
}

export const AMDEC_BUILDER = {
  tool: 'amdec' as const,
  title: 'AMDEC — construis la ligne',
  tagline: 'Distinguer mode / cause / effet, puis coter le risque.',
  /** Ratio de bonnes réponses (labellisation) pour le badge. */
  passThreshold: 0.875,
};

/** Barème G/O/D 1–4 rappelé pendant l'étape de cotation. */
export const AMDEC_SCALES = {
  g: 'Gravité : 1 = mineure … 4 = très grave (sécurité, arrêt, client).',
  o: 'Occurrence : 1 = rare … 4 = très fréquente.',
  d: 'Détectabilité : 1 = repérée aussitôt … 4 = quasi indétectable.',
} as const;

export const AMDEC_SCENARIOS: AmdecScenario[] = [
  {
    id: 'sc1',
    element: 'Pompe de refroidissement',
    situation: 'Le joint d’étanchéité de la pompe vieillit.',
    mode: 'Fuite au niveau du joint',
    cause: 'Usure du joint d’étanchéité',
    effect: 'Surchauffe moteur et arrêt de la ligne',
    g: 4, o: 3, d: 2,
    gWhy: 'Un arrêt de ligne est très pénalisant : gravité 4.',
    oWhy: 'L’usure revient régulièrement : occurrence 3.',
    dWhy: 'La fuite finit par être visible : détectabilité 2.',
  },
  {
    id: 'sc2',
    element: 'Convoyeur d’atelier',
    situation: 'Le moteur du convoyeur chauffe anormalement.',
    mode: 'Arrêt inopiné du convoyeur',
    cause: 'Roulement en fin de vie',
    effect: 'Interruption du flux de production',
    g: 4, o: 2, d: 2,
    gWhy: 'Le flux s’arrête : gravité 4.',
    oWhy: 'Panne occasionnelle : occurrence 2.',
    dWhy: 'Un bruit annonciateur alerte : détectabilité 2.',
  },
  {
    id: 'sc3',
    element: 'Capteur de température',
    situation: 'Le capteur dérive au fil des semaines.',
    mode: 'Mesure erronée du capteur',
    cause: 'Défaut d’étalonnage',
    effect: 'Produit hors tolérance livré au client',
    g: 4, o: 2, d: 3,
    gWhy: 'Un défaut livré au client est grave : gravité 4.',
    oWhy: 'La dérive est peu fréquente : occurrence 2.',
    dWhy: 'Erreur difficile à repérer sans contrôle : détectabilité 3.',
  },
  {
    id: 'sc4',
    element: 'Assemblage vissé',
    situation: 'Le serrage des vis varie selon l’opérateur.',
    mode: 'Desserrage de la vis',
    cause: 'Couple de serrage insuffisant',
    effect: 'Vibration et jeu mécanique',
    g: 2, o: 3, d: 2,
    gWhy: 'Jeu gênant mais non critique : gravité 2.',
    oWhy: 'Serrage variable, donc fréquent : occurrence 3.',
    dWhy: 'Se détecte au contrôle : détectabilité 2.',
  },
  {
    id: 'sc5',
    element: 'Poste d’étiquetage',
    situation: 'La buse d’étiquetage se dérègle par moments.',
    mode: 'Étiquette mal positionnée',
    cause: 'Dérive du réglage de la buse',
    effect: 'Rejet du lot au contrôle final',
    g: 2, o: 2, d: 2,
    gWhy: 'Rejeté avant expédition : gravité 2.',
    oWhy: 'Dérive occasionnelle : occurrence 2.',
    dWhy: 'Défaut visible immédiatement : détectabilité 2.',
  },
  {
    id: 'sc6',
    element: 'Poste de soudure',
    situation: 'Le débit de gaz de protection est parfois trop faible.',
    mode: 'Soudure poreuse',
    cause: 'Gaz de protection insuffisant',
    effect: 'Rupture de la pièce en service',
    g: 4, o: 2, d: 4,
    gWhy: 'Rupture en service : gravité maximale 4.',
    oWhy: 'Arrive de temps en temps : occurrence 2.',
    dWhy: 'Porosité interne quasi indétectable à l’œil : détectabilité 4.',
  },
  {
    id: 'sc7',
    element: 'Circuit hydraulique',
    situation: 'La maintenance du filtre est parfois oubliée.',
    mode: 'Colmatage du filtre',
    cause: 'Maintenance non effectuée',
    effect: 'Baisse de pression du circuit',
    g: 3, o: 3, d: 1,
    gWhy: 'Perte de performance, sans danger : gravité 3.',
    oWhy: 'Fréquent si la maintenance saute : occurrence 3.',
    dWhy: 'Indicateur de colmatage bien visible : détectabilité 1.',
  },
];
