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

const AMDEC: ChallengeSet = {
  id: 'amdec',
  tool: 'amdec',
  title: 'AMDEC — quelle criticité ?',
  tagline: 'Criticité = Gravité × Occurrence × Détectabilité.',
  passThreshold: 0.875,
  buckets: [
    { id: 'high', label: 'Critique', hint: '≥ 24', tone: 'danger' },
    { id: 'medium', label: 'À surveiller', hint: '12 à 23', tone: 'warning' },
    { id: 'low', label: 'Faible', hint: '< 12', tone: 'success' },
  ],
  items: [
    { id: 'am1', prompt: 'Gravité 2 · Occurrence 2 · Détectabilité 2', answer: 'low', why: '2 × 2 × 2 = 8, sous 12 : faible.' },
    { id: 'am2', prompt: 'Gravité 1 · Occurrence 3 · Détectabilité 3', answer: 'low', why: '1 × 3 × 3 = 9, sous 12 : faible.' },
    { id: 'am3', prompt: 'Gravité 3 · Occurrence 1 · Détectabilité 2', answer: 'low', why: '3 × 1 × 2 = 6, sous 12 : faible.' },
    { id: 'am4', prompt: 'Gravité 2 · Occurrence 1 · Détectabilité 4', answer: 'low', why: '2 × 1 × 4 = 8, sous 12 : faible.' },
    { id: 'am5', prompt: 'Gravité 3 · Occurrence 3 · Détectabilité 1', answer: 'low', why: '3 × 3 × 1 = 9, sous 12 : faible.' },
    { id: 'am6', prompt: 'Gravité 2 · Occurrence 2 · Détectabilité 1', answer: 'low', why: '2 × 2 × 1 = 4, sous 12 : faible.' },
    { id: 'am7', prompt: 'Gravité 1 · Occurrence 2 · Détectabilité 4', answer: 'low', why: '1 × 2 × 4 = 8, sous 12 : faible.' },
    { id: 'am8', prompt: 'Gravité 2 · Occurrence 2 · Détectabilité 3', answer: 'medium', why: '2 × 2 × 3 = 12, entre 12 et 23 : à surveiller.' },
    { id: 'am9', prompt: 'Gravité 3 · Occurrence 3 · Détectabilité 2', answer: 'medium', why: '3 × 3 × 2 = 18, entre 12 et 23 : à surveiller.' },
    { id: 'am10', prompt: 'Gravité 4 · Occurrence 2 · Détectabilité 2', answer: 'medium', why: '4 × 2 × 2 = 16, entre 12 et 23 : à surveiller.' },
    { id: 'am11', prompt: 'Gravité 3 · Occurrence 4 · Détectabilité 1', answer: 'medium', why: '3 × 4 × 1 = 12, entre 12 et 23 : à surveiller.' },
    { id: 'am12', prompt: 'Gravité 2 · Occurrence 3 · Détectabilité 3', answer: 'medium', why: '2 × 3 × 3 = 18, entre 12 et 23 : à surveiller.' },
    { id: 'am13', prompt: 'Gravité 4 · Occurrence 4 · Détectabilité 1', answer: 'medium', why: '4 × 4 × 1 = 16, entre 12 et 23 : à surveiller.' },
    { id: 'am14', prompt: 'Gravité 4 · Occurrence 3 · Détectabilité 2', answer: 'high', why: '4 × 3 × 2 = 24, seuil 24 atteint : critique.' },
    { id: 'am15', prompt: 'Gravité 3 · Occurrence 3 · Détectabilité 3', answer: 'high', why: '3 × 3 × 3 = 27, ≥ 24 : critique.' },
    { id: 'am16', prompt: 'Gravité 4 · Occurrence 4 · Détectabilité 2', answer: 'high', why: '4 × 4 × 2 = 32, ≥ 24 : critique.' },
    { id: 'am17', prompt: 'Gravité 4 · Occurrence 3 · Détectabilité 3', answer: 'high', why: '4 × 3 × 3 = 36, ≥ 24 : critique.' },
    { id: 'am18', prompt: 'Gravité 2 · Occurrence 4 · Détectabilité 3', answer: 'high', why: '2 × 4 × 3 = 24, seuil 24 atteint : critique.' },
    { id: 'am19', prompt: 'Gravité 4 · Occurrence 4 · Détectabilité 4', answer: 'high', why: '4 × 4 × 4 = 64, ≥ 24 : critique.' },
    { id: 'am20', prompt: 'Gravité 3 · Occurrence 4 · Détectabilité 2', answer: 'high', why: '3 × 4 × 2 = 24, seuil 24 atteint : critique.' },
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

const PLANNING: ChallengeSet = {
  id: 'planning',
  tool: 'planning',
  title: 'Planning — en retard ou dans les temps ?',
  tagline: 'Terminée l’emporte sur la date ; sinon, échéance passée = retard.',
  passThreshold: 0.875,
  buckets: [
    { id: 'late', label: 'En retard', hint: 'échéance dépassée', tone: 'danger' },
    { id: 'ontime', label: 'Dans les temps', hint: 'à venir', tone: 'accent' },
    { id: 'done', label: 'Terminée', hint: 'close', tone: 'success' },
  ],
  items: [
    { id: 'pl1', prompt: 'Échéance dépassée de 3 jours · statut En cours', answer: 'late', why: 'Échéance passée et non terminée : en retard.' },
    { id: 'pl2', prompt: 'Échéance dans 5 jours · statut À faire', answer: 'ontime', why: 'Échéance à venir et pas encore due : dans les temps.' },
    { id: 'pl3', prompt: 'Statut Terminée · échéance hier', answer: 'done', why: 'Statut terminé : l’action est close, quelle que soit la date.' },
    { id: 'pl4', prompt: 'Échéance dépassée d’une semaine · statut À faire', answer: 'late', why: 'Échéance passée et non terminée : en retard.' },
    { id: 'pl5', prompt: 'Échéance dans 2 jours · statut En cours', answer: 'ontime', why: 'Échéance à venir et pas encore due : dans les temps.' },
    { id: 'pl6', prompt: 'Statut Terminée · échéance la semaine dernière', answer: 'done', why: 'Statut terminé : l’action est close, quelle que soit la date.' },
    { id: 'pl7', prompt: 'Échéance aujourd’hui · statut À faire', answer: 'ontime', why: 'Le jour même n’est pas dépassé : encore dans les temps.' },
    { id: 'pl8', prompt: 'Échéance dépassée de 1 jour · statut En cours', answer: 'late', why: 'Échéance passée et non terminée : en retard.' },
    { id: 'pl9', prompt: 'Statut Terminée · livrée en avance', answer: 'done', why: 'Statut terminé : l’action est close, quelle que soit la date.' },
    { id: 'pl10', prompt: 'Échéance dans 10 jours · statut À faire', answer: 'ontime', why: 'Échéance à venir et pas encore due : dans les temps.' },
    { id: 'pl11', prompt: 'Échéance dépassée de 5 jours · statut À faire', answer: 'late', why: 'Échéance passée et non terminée : en retard.' },
    { id: 'pl12', prompt: 'Statut Terminée · échéance dans 3 jours', answer: 'done', why: 'Statut terminé : l’action est close, quelle que soit la date.' },
    { id: 'pl13', prompt: 'Échéance dans 1 jour · statut En cours', answer: 'ontime', why: 'Échéance à venir et pas encore due : dans les temps.' },
    { id: 'pl14', prompt: 'Échéance dépassée de 2 semaines · statut En cours', answer: 'late', why: 'Échéance passée et non terminée : en retard.' },
    { id: 'pl15', prompt: 'Statut Terminée · échéance dépassée', answer: 'done', why: 'Statut terminé : l’action est close, quelle que soit la date.' },
    { id: 'pl16', prompt: 'Échéance dans 4 jours · statut À faire', answer: 'ontime', why: 'Échéance à venir et pas encore due : dans les temps.' },
    { id: 'pl17', prompt: 'Échéance dépassée hier · statut À faire', answer: 'late', why: 'Échéance passée et non terminée : en retard.' },
    { id: 'pl18', prompt: 'Statut Terminée · échéance aujourd’hui', answer: 'done', why: 'Statut terminé : l’action est close, quelle que soit la date.' },
    { id: 'pl19', prompt: 'Échéance dans 7 jours · statut En cours', answer: 'ontime', why: 'Échéance à venir et pas encore due : dans les temps.' },
    { id: 'pl20', prompt: 'Échéance dépassée de 4 jours · statut À faire', answer: 'late', why: 'Échéance passée et non terminée : en retard.' },
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

const CINQ_POURQUOI: ChallengeSet = {
  id: 'cinq-pourquoi',
  tool: 'cinq-pourquoi',
  title: '5 Pourquoi — symptôme ou cause racine ?',
  tagline: 'Descendre du symptôme visible jusqu’à la cause à traiter.',
  passThreshold: 0.875,
  buckets: [
    { id: 'symptome', label: 'Symptôme', hint: 'effet visible', tone: 'warning' },
    { id: 'inter', label: 'Cause intermédiaire', hint: 'a encore une cause', tone: 'neutral' },
    { id: 'racine', label: 'Cause racine', hint: 'à traiter', tone: 'success' },
  ],
  items: [
    { id: 'cp1', prompt: 'Le client a reçu sa commande avec 3 jours de retard', answer: 'symptome', why: 'C’est l’effet visible, pas une cause : un symptôme.' },
    { id: 'cp2', prompt: 'La ligne de production s’est arrêtée ce matin', answer: 'symptome', why: 'C’est l’effet visible, pas une cause : un symptôme.' },
    { id: 'cp3', prompt: 'Le taux de rebut a doublé cette semaine', answer: 'symptome', why: 'C’est l’effet visible, pas une cause : un symptôme.' },
    { id: 'cp4', prompt: 'Une réclamation qualité a été ouverte', answer: 'symptome', why: 'C’est l’effet visible, pas une cause : un symptôme.' },
    { id: 'cp5', prompt: 'Le produit a été livré non conforme', answer: 'symptome', why: 'C’est l’effet visible, pas une cause : un symptôme.' },
    { id: 'cp6', prompt: 'La commande n’est pas partie à temps', answer: 'symptome', why: 'C’est l’effet visible, pas une cause : un symptôme.' },
    { id: 'cp7', prompt: 'Un incident a été déclaré sur le poste 3', answer: 'symptome', why: 'C’est l’effet visible, pas une cause : un symptôme.' },
    { id: 'cp8', prompt: 'La pièce nécessaire n’était pas en stock', answer: 'inter', why: 'Cette cause a elle-même une cause : intermédiaire, continue à demander « pourquoi ».' },
    { id: 'cp9', prompt: 'Le roulement a cédé en cours de production', answer: 'inter', why: 'Cette cause a elle-même une cause : intermédiaire, continue à demander « pourquoi ».' },
    { id: 'cp10', prompt: 'L’opérateur a monté la mauvaise référence', answer: 'inter', why: 'Cette cause a elle-même une cause : intermédiaire, continue à demander « pourquoi ».' },
    { id: 'cp11', prompt: 'Le contrôle final n’a pas détecté le défaut', answer: 'inter', why: 'Cette cause a elle-même une cause : intermédiaire, continue à demander « pourquoi ».' },
    { id: 'cp12', prompt: 'La commande fournisseur est partie en retard', answer: 'inter', why: 'Cette cause a elle-même une cause : intermédiaire, continue à demander « pourquoi ».' },
    { id: 'cp13', prompt: 'Le réglage machine était incorrect', answer: 'inter', why: 'Cette cause a elle-même une cause : intermédiaire, continue à demander « pourquoi ».' },
    { id: 'cp14', prompt: 'Aucune procédure de réapprovisionnement n’existe', answer: 'racine', why: 'Cause profonde et actionnable : la racine à traiter.' },
    { id: 'cp15', prompt: 'Le plan de maintenance préventive n’a jamais été mis en place', answer: 'racine', why: 'Cause profonde et actionnable : la racine à traiter.' },
    { id: 'cp16', prompt: 'Les opérateurs ne sont pas formés à la vérification des références', answer: 'racine', why: 'Cause profonde et actionnable : la racine à traiter.' },
    { id: 'cp17', prompt: 'Il n’existe pas de standard de contrôle qualité', answer: 'racine', why: 'Cause profonde et actionnable : la racine à traiter.' },
    { id: 'cp18', prompt: 'Le seuil de réapprovisionnement n’a jamais été défini', answer: 'racine', why: 'Cause profonde et actionnable : la racine à traiter.' },
    { id: 'cp19', prompt: 'Aucun système d’alerte de stock n’est en place', answer: 'racine', why: 'Cause profonde et actionnable : la racine à traiter.' },
    { id: 'cp20', prompt: 'La polyvalence des équipes n’est pas organisée', answer: 'racine', why: 'Cause profonde et actionnable : la racine à traiter.' },
  ],
};

const A3: ChallengeSet = {
  id: 'a3',
  tool: 'a3',
  title: 'Charte A3 — dans quelle case ?',
  tagline: 'Contexte, situation, objectifs, analyse, plan ou suivi ?',
  passThreshold: 0.875,
  buckets: [
    { id: 'contexte', label: 'Contexte', hint: 'l’enjeu', tone: 'neutral' },
    { id: 'situation', label: 'Situation', hint: 'état des lieux', tone: 'neutral' },
    { id: 'objectifs', label: 'Objectifs', hint: 'la cible', tone: 'neutral' },
    { id: 'analyse', label: 'Analyse', hint: 'les causes', tone: 'neutral' },
    { id: 'plan', label: 'Plan d’action', hint: 'les actions', tone: 'neutral' },
    { id: 'suivi', label: 'Suivi', hint: 'les résultats', tone: 'neutral' },
  ],
  items: [
    { id: 'a1', prompt: 'Cette ligne représente 40 % du chiffre d’affaires', answer: 'contexte', why: 'Pourquoi ce sujet et son enjeu : Contexte.' },
    { id: 'a2', prompt: 'Le sujet a été priorisé par la direction en janvier', answer: 'contexte', why: 'Pourquoi ce sujet et son enjeu : Contexte.' },
    { id: 'a3', prompt: 'Les arrêts machine pèsent sur la satisfaction client', answer: 'contexte', why: 'Pourquoi ce sujet et son enjeu : Contexte.' },
    { id: 'a4', prompt: 'Aujourd’hui, on compte 12 arrêts par semaine', answer: 'situation', why: 'L’état des lieux chiffré d’aujourd’hui : Situation.' },
    { id: 'a5', prompt: 'Le taux de rebut actuel est de 8 %', answer: 'situation', why: 'L’état des lieux chiffré d’aujourd’hui : Situation.' },
    { id: 'a6', prompt: 'Les délais de livraison atteignent 15 jours', answer: 'situation', why: 'L’état des lieux chiffré d’aujourd’hui : Situation.' },
    { id: 'a7', prompt: 'L’état des lieux révèle 3 pannes récurrentes', answer: 'situation', why: 'L’état des lieux chiffré d’aujourd’hui : Situation.' },
    { id: 'a8', prompt: 'Réduire les arrêts de 50 % d’ici juin', answer: 'objectifs', why: 'La cible à atteindre : Objectifs.' },
    { id: 'a9', prompt: 'Passer le taux de rebut sous 3 %', answer: 'objectifs', why: 'La cible à atteindre : Objectifs.' },
    { id: 'a10', prompt: 'Ramener le délai de livraison à 7 jours', answer: 'objectifs', why: 'La cible à atteindre : Objectifs.' },
    { id: 'a11', prompt: 'L’Ishikawa pointe un défaut de maintenance', answer: 'analyse', why: 'La recherche des causes : Analyse.' },
    { id: 'a12', prompt: 'Les 5 pourquoi mènent à l’absence de procédure', answer: 'analyse', why: 'La recherche des causes : Analyse.' },
    { id: 'a13', prompt: 'L’AMDEC identifie le convoyeur comme critique', answer: 'analyse', why: 'La recherche des causes : Analyse.' },
    { id: 'a14', prompt: 'La cause racine est un manque de formation', answer: 'analyse', why: 'La recherche des causes : Analyse.' },
    { id: 'a15', prompt: 'Former les opérateurs avant fin mai — resp. Claire', answer: 'plan', why: 'Les actions, responsables et échéances : Plan d’action.' },
    { id: 'a16', prompt: 'Mettre en place la maintenance préventive — resp. Marc', answer: 'plan', why: 'Les actions, responsables et échéances : Plan d’action.' },
    { id: 'a17', prompt: 'Rédiger le standard de contrôle — échéance 30/06', answer: 'plan', why: 'Les actions, responsables et échéances : Plan d’action.' },
    { id: 'a18', prompt: 'Suivre l’indicateur d’arrêts chaque semaine', answer: 'suivi', why: 'La mesure des résultats dans le temps : Suivi.' },
    { id: 'a19', prompt: 'Mesurer l’écart entre objectif et résultat', answer: 'suivi', why: 'La mesure des résultats dans le temps : Suivi.' },
    { id: 'a20', prompt: 'Vérifier l’efficacité des actions à 3 mois', answer: 'suivi', why: 'La mesure des résultats dans le temps : Suivi.' },
  ],
};

/** Catalogue des jeux disponibles (les outils absents apparaissent « Bientôt »). */
export const CHALLENGE_SETS: Partial<Record<AcademyToolId, ChallengeSet>> = {
  swot: SWOT,
  raci: RACI,
  amdec: AMDEC,
  actions: ACTIONS,
  planning: PLANNING,
  ishikawa: ISHIKAWA,
  'cinq-pourquoi': CINQ_POURQUOI,
  a3: A3,
};

export function challengeSet(tool: AcademyToolId): ChallengeSet | undefined {
  return CHALLENGE_SETS[tool];
}
