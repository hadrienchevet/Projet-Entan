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

const RACI: ChallengeSet = {
  id: 'raci',
  tool: 'raci',
  title: 'RACI — quel rôle ?',
  tagline: 'Responsible, Accountable, Consulted ou Informed ?',
  passThreshold: 0.875,
  buckets: [
    { id: 'r', label: 'R · Responsible', hint: 'Réalise l’action', tone: 'accent' },
    { id: 'a', label: 'A · Accountable', hint: 'Rend des comptes', tone: 'accent' },
    { id: 'c', label: 'C · Consulted', hint: 'Donne son avis', tone: 'neutral' },
    { id: 'i', label: 'I · Informed', hint: 'Tenu au courant', tone: 'neutral' },
  ],
  items: [
    { id: 'r1', prompt: 'C’est elle qui exécute concrètement la tâche', answer: 'r', why: 'Réalise l’action : Responsible (R).' },
    { id: 'r2', prompt: 'Il valide le travail et en répond devant la direction', answer: 'a', why: 'Un seul garant qui rend des comptes : Accountable (A).' },
    { id: 'r3', prompt: 'On lui demande son avis d’expert avant de décider', answer: 'c', why: 'Sollicité pour son avis : Consulted (C).' },
    { id: 'r4', prompt: 'On le prévient une fois la tâche terminée', answer: 'i', why: 'Simplement tenu au courant : Informed (I).' },
    { id: 'r5', prompt: 'Un seul par action : celui qui a le dernier mot', answer: 'a', why: 'Un seul garant qui rend des comptes : Accountable (A).' },
    { id: 'r6', prompt: 'Elle rédige le rapport demandé', answer: 'r', why: 'Réalise l’action : Responsible (R).' },
    { id: 'r7', prompt: 'Le service juridique est sollicité pour vérifier la conformité', answer: 'c', why: 'Sollicité pour son avis : Consulted (C).' },
    { id: 'r8', prompt: 'La direction reçoit le compte rendu pour information', answer: 'i', why: 'Simplement tenu au courant : Informed (I).' },
    { id: 'r9', prompt: 'Il approuve la dépense engagée par l’équipe', answer: 'a', why: 'Un seul garant qui rend des comptes : Accountable (A).' },
    { id: 'r10', prompt: 'Ce technicien monte effectivement la pièce', answer: 'r', why: 'Réalise l’action : Responsible (R).' },
    { id: 'r11', prompt: 'On échange avec le client avant de figer le cahier des charges', answer: 'c', why: 'Sollicité pour son avis : Consulted (C).' },
    { id: 'r12', prompt: 'L’équipe voisine est notifiée du changement de planning', answer: 'i', why: 'Simplement tenu au courant : Informed (I).' },
    { id: 'r13', prompt: 'Elle est chargée de livrer le livrable dans les temps', answer: 'r', why: 'Réalise l’action : Responsible (R).' },
    { id: 'r14', prompt: 'C’est lui qui assume la réussite ou l’échec final', answer: 'a', why: 'Un seul garant qui rend des comptes : Accountable (A).' },
    { id: 'r15', prompt: 'Le bureau d’études donne son expertise sur le choix technique', answer: 'c', why: 'Sollicité pour son avis : Consulted (C).' },
    { id: 'r16', prompt: 'Les opérateurs sont informés de la nouvelle consigne', answer: 'i', why: 'Simplement tenu au courant : Informed (I).' },
    { id: 'r17', prompt: 'Ce sont eux qui réalisent les tests', answer: 'r', why: 'Réalise l’action : Responsible (R).' },
    { id: 'r18', prompt: 'Le chef de projet valide le passage à l’étape suivante', answer: 'a', why: 'Un seul garant qui rend des comptes : Accountable (A).' },
    { id: 'r19', prompt: 'On consulte le responsable qualité avant de trancher', answer: 'c', why: 'Sollicité pour son avis : Consulted (C).' },
    { id: 'r20', prompt: 'Le comité de pilotage est tenu au courant de l’avancement', answer: 'i', why: 'Simplement tenu au courant : Informed (I).' },
  ],
};

const ACTIONS: ChallengeSet = {
  id: 'actions',
  tool: 'actions',
  title: 'Actions — qu’est-ce qui manque ?',
  tagline: 'Une action se suit si elle a un responsable et une échéance.',
  passThreshold: 0.875,
  buckets: [
    { id: 'resp', label: 'Le responsable', hint: 'manquant', tone: 'neutral' },
    { id: 'due', label: 'L’échéance', hint: 'manquante', tone: 'neutral' },
    { id: 'ok', label: 'Rien, complète', hint: 'resp. + échéance + statut', tone: 'success' },
  ],
  items: [
    { id: 'ac1', prompt: 'Réviser le convoyeur — resp. Marc · éch. 30/06 · En cours', answer: 'ok', why: 'Responsable, échéance et statut : l’action est complète.' },
    { id: 'ac2', prompt: 'Auditer la ligne — éch. 15/05 · À faire', answer: 'resp', why: 'Aucun responsable : personne n’est en charge (R manquant).' },
    { id: 'ac3', prompt: 'Changer les roulements — resp. Sonia · À faire', answer: 'due', why: 'Aucune date : une action sans échéance ne se suit pas.' },
    { id: 'ac4', prompt: 'Former les opérateurs — resp. Claire · éch. 10/07 · Terminée', answer: 'ok', why: 'Responsable, échéance et statut : l’action est complète.' },
    { id: 'ac5', prompt: 'Mettre à jour la doc — éch. 22/04 · En cours', answer: 'resp', why: 'Aucun responsable : personne n’est en charge (R manquant).' },
    { id: 'ac6', prompt: 'Commander les pièces — resp. Karim · En cours', answer: 'due', why: 'Aucune date : une action sans échéance ne se suit pas.' },
    { id: 'ac7', prompt: 'Nettoyer la zone — resp. Léa · éch. 03/06 · À faire', answer: 'ok', why: 'Responsable, échéance et statut : l’action est complète.' },
    { id: 'ac8', prompt: 'Vérifier les capteurs — éch. 18/05 · À faire', answer: 'resp', why: 'Aucun responsable : personne n’est en charge (R manquant).' },
    { id: 'ac9', prompt: 'Rédiger le rapport — resp. Paul · À faire', answer: 'due', why: 'Aucune date : une action sans échéance ne se suit pas.' },
    { id: 'ac10', prompt: 'Contrôler la qualité — resp. Nadia · éch. 25/06 · En cours', answer: 'ok', why: 'Responsable, échéance et statut : l’action est complète.' },
    { id: 'ac11', prompt: 'Planifier la maintenance — éch. 30/05 · À faire', answer: 'resp', why: 'Aucun responsable : personne n’est en charge (R manquant).' },
    { id: 'ac12', prompt: 'Tester le prototype — resp. Hugo · En cours', answer: 'due', why: 'Aucune date : une action sans échéance ne se suit pas.' },
    { id: 'ac13', prompt: 'Réparer la vanne — resp. Amel · éch. 12/06 · Terminée', answer: 'ok', why: 'Responsable, échéance et statut : l’action est complète.' },
    { id: 'ac14', prompt: 'Analyser les retours clients — éch. 08/07 · À faire', answer: 'resp', why: 'Aucun responsable : personne n’est en charge (R manquant).' },
    { id: 'ac15', prompt: 'Installer le logiciel — resp. Théo · À faire', answer: 'due', why: 'Aucune date : une action sans échéance ne se suit pas.' },
    { id: 'ac16', prompt: 'Auditer les stocks — resp. Inès · éch. 20/06 · En cours', answer: 'ok', why: 'Responsable, échéance et statut : l’action est complète.' },
    { id: 'ac17', prompt: 'Réviser le plan qualité — éch. 14/05 · À faire', answer: 'resp', why: 'Aucun responsable : personne n’est en charge (R manquant).' },
    { id: 'ac18', prompt: 'Calibrer la machine — resp. Yanis · En cours', answer: 'due', why: 'Aucune date : une action sans échéance ne se suit pas.' },
    { id: 'ac19', prompt: 'Rédiger la procédure — resp. Sarah · éch. 28/06 · À faire', answer: 'ok', why: 'Responsable, échéance et statut : l’action est complète.' },
    { id: 'ac20', prompt: 'Contrôler les soudures — resp. Omar · En cours', answer: 'due', why: 'Aucune date : une action sans échéance ne se suit pas.' },
  ],
};

const ISHIKAWA: ChallengeSet = {
  id: 'ishikawa',
  tool: 'ishikawa',
  title: 'Ishikawa — range la cause (5M)',
  tagline: 'Matière, Méthode, Machine, Main-d’œuvre ou Milieu ?',
  passThreshold: 0.875,
  buckets: [
    { id: 'matiere', label: 'Matière', hint: 'entrants', tone: 'neutral' },
    { id: 'methode', label: 'Méthode', hint: 'procédé', tone: 'neutral' },
    { id: 'machine', label: 'Machine', hint: 'équipement', tone: 'neutral' },
    { id: 'mo', label: 'Main-d’œuvre', hint: 'personnes', tone: 'neutral' },
    { id: 'milieu', label: 'Milieu', hint: 'environnement', tone: 'neutral' },
  ],
  items: [
    { id: 'is1', prompt: 'Matière première de qualité irrégulière', answer: 'matiere', why: 'Cause liée aux entrants : Matière.' },
    { id: 'is2', prompt: 'Lot de composants non conforme', answer: 'matiere', why: 'Cause liée aux entrants : Matière.' },
    { id: 'is3', prompt: 'Mauvaise référence de pièce utilisée', answer: 'matiere', why: 'Cause liée aux entrants : Matière.' },
    { id: 'is4', prompt: 'Colle périmée', answer: 'matiere', why: 'Cause liée aux entrants : Matière.' },
    { id: 'is5', prompt: 'Procédure de contrôle non écrite', answer: 'methode', why: 'Cause liée au procédé : Méthode.' },
    { id: 'is6', prompt: 'Gamme de montage ambiguë', answer: 'methode', why: 'Cause liée au procédé : Méthode.' },
    { id: 'is7', prompt: 'Absence de mode opératoire standard', answer: 'methode', why: 'Cause liée au procédé : Méthode.' },
    { id: 'is8', prompt: 'Ordre des opérations mal défini', answer: 'methode', why: 'Cause liée au procédé : Méthode.' },
    { id: 'is9', prompt: 'Réglage de la presse déréglé', answer: 'machine', why: 'Cause liée à l’équipement : Machine.' },
    { id: 'is10', prompt: 'Usure de l’outil de coupe', answer: 'machine', why: 'Cause liée à l’équipement : Machine.' },
    { id: 'is11', prompt: 'Panne récurrente du convoyeur', answer: 'machine', why: 'Cause liée à l’équipement : Machine.' },
    { id: 'is12', prompt: 'Capteur mal étalonné', answer: 'machine', why: 'Cause liée à l’équipement : Machine.' },
    { id: 'is13', prompt: 'Opérateur non formé au poste', answer: 'mo', why: 'Cause liée aux personnes : Main-d’œuvre.' },
    { id: 'is14', prompt: 'Manque de personnel sur la ligne', answer: 'mo', why: 'Cause liée aux personnes : Main-d’œuvre.' },
    { id: 'is15', prompt: 'Geste métier mal maîtrisé', answer: 'mo', why: 'Cause liée aux personnes : Main-d’œuvre.' },
    { id: 'is16', prompt: 'Fatigue de l’équipe de nuit', answer: 'mo', why: 'Cause liée aux personnes : Main-d’œuvre.' },
    { id: 'is17', prompt: 'Température de l’atelier trop élevée', answer: 'milieu', why: 'Cause liée à l’environnement : Milieu.' },
    { id: 'is18', prompt: 'Éclairage insuffisant au poste', answer: 'milieu', why: 'Cause liée à l’environnement : Milieu.' },
    { id: 'is19', prompt: 'Poussière ambiante importante', answer: 'milieu', why: 'Cause liée à l’environnement : Milieu.' },
    { id: 'is20', prompt: 'Espace de travail encombré', answer: 'milieu', why: 'Cause liée à l’environnement : Milieu.' },
  ],
};

/**
 * Planning, 5 Pourquoi et Charte A3 sont passés en QCM (voir `quizzes.ts`) :
 * un classement par panier n'y testait pas grand-chose (règle triviale pour
 * Planning, frontière floue et subjective pour 5 Pourquoi entre cause
 * intermédiaire et cause racine).
 */

/** Catalogue des jeux disponibles (les outils absents apparaissent « Bientôt »). */
export const CHALLENGE_SETS: Partial<Record<AcademyToolId, ChallengeSet>> = {
  swot: SWOT,
  raci: RACI,
  actions: ACTIONS,
  ishikawa: ISHIKAWA,
};

export function challengeSet(tool: AcademyToolId): ChallengeSet | undefined {
  return CHALLENGE_SETS[tool];
}
