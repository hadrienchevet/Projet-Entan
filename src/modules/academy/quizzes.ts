/**
 * Académie Pilotix — quiz de connaissance (QCM).
 *
 * Pour certains outils, un classement par panier ne teste rien de solide :
 * soit la règle est triviale (Planning : comparer une date), soit la
 * frontière est floue et subjective (5 Pourquoi : « cause intermédiaire »
 * vs « cause racine » est un jugement, pas une règle fixe). Le QCM teste
 * la compréhension de la méthode elle-même, avec une justification à
 * chaque réponse. Données pures (aucun composant React) — le moteur vit
 * dans `QuizGame`. Aucune IA (conforme V1).
 */

import type { AcademyToolId } from './challenges';

export interface QuizChoice {
  id: string;
  label: string;
}

/** Une question : un énoncé + choix + la bonne réponse + sa justification. */
export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  /** id du choix correct. */
  answer: string;
  why: string;
}

export interface QuizSet {
  id: string;
  tool: AcademyToolId;
  title: string;
  tagline: string;
  questions: QuizQuestion[];
  /** Part de bonnes réponses pour décrocher le badge (0–1). */
  passThreshold: number;
}

const PLANNING_QUIZ: QuizSet = {
  id: 'planning',
  tool: 'planning',
  title: 'Planning — le quiz',
  tagline: 'Jalons, dépendances, chemin critique : la vraie logique du suivi.',
  passThreshold: 0.875,
  questions: [
    {
      id: 'pq1',
      prompt: 'Une action est marquée « Terminée », mais son échéance est dépassée. Est-elle en retard ?',
      choices: [
        { id: 'a', label: 'Oui, l’échéance est dépassée' },
        { id: 'b', label: 'Non, le statut « Terminée » clôt l’action, peu importe la date' },
        { id: 'c', label: 'Seulement si le retard dépasse une semaine' },
      ],
      answer: 'b',
      why: 'Le statut « Terminée » ferme le sujet : le retard ne concerne que les actions encore ouvertes après leur échéance.',
    },
    {
      id: 'pq2',
      prompt: 'Qu’est-ce qu’un jalon (milestone) dans un planning ?',
      choices: [
        { id: 'a', label: 'Une tâche longue et complexe' },
        { id: 'b', label: 'Un point de passage clé, sans durée, à une date précise' },
        { id: 'c', label: 'Une action sans responsable' },
      ],
      answer: 'b',
      why: 'Un jalon marque un événement clé (livraison, validation…) à une date donnée — il n’a pas de durée, contrairement à une action.',
    },
    {
      id: 'pq3',
      prompt: 'Dans ENTAN, comment un jalon s’affiche-t-il sur le Gantt ?',
      choices: [
        { id: 'a', label: 'En losange, à sa date d’échéance' },
        { id: 'b', label: 'En barre plus longue que les autres' },
        { id: 'c', label: 'En pointillés' },
      ],
      answer: 'a',
      why: 'Le jalon est représenté par un losange à sa date, pour le distinguer d’une action à durée.',
    },
    {
      id: 'pq4',
      prompt: 'Qu’est-ce que le « chemin critique » d’un planning ?',
      choices: [
        { id: 'a', label: 'La liste des actions les plus urgentes du jour' },
        { id: 'b', label: 'La suite d’actions dont le retard décale directement la fin du projet' },
        { id: 'c', label: 'Les actions sans responsable assigné' },
      ],
      answer: 'b',
      why: 'Le chemin critique est la chaîne d’actions dépendantes qui détermine la durée totale : retarder l’une d’elles retarde tout le projet.',
    },
    {
      id: 'pq5',
      prompt: 'À quoi servent les dépendances entre actions (ex. « fin → début ») ?',
      choices: [
        { id: 'a', label: 'À décorer le Gantt' },
        { id: 'b', label: 'À refléter un ordre technique réel : ne pas commencer avant la fin du prérequis' },
        { id: 'c', label: 'À assigner automatiquement un responsable' },
      ],
      answer: 'b',
      why: 'Une dépendance traduit une contrainte réelle (ex. on ne peut pas monter une pièce avant qu’elle soit livrée).',
    },
    {
      id: 'pq6',
      prompt: 'Dans ENTAN, une flèche de dépendance apparaît en rouge sur le Gantt. Que signifie cette couleur ?',
      choices: [
        { id: 'a', label: 'L’action est terminée' },
        { id: 'b', label: 'Le successeur démarre avant la fin de son prédécesseur : la dépendance n’est pas respectée' },
        { id: 'c', label: 'L’action est un jalon' },
      ],
      answer: 'b',
      why: 'Le rouge signale une incohérence : le planning prévoit de démarrer une action avant que son prérequis soit fini.',
    },
    {
      id: 'pq7',
      prompt: 'Une action sans échéance renseignée…',
      choices: [
        { id: 'a', label: 'Est automatiquement classée « Terminée »' },
        { id: 'b', label: 'Ne peut pas être suivie : impossible de savoir si elle est en retard' },
        { id: 'c', label: 'Est plus prioritaire que les autres' },
      ],
      answer: 'b',
      why: 'Sans date, il n’y a rien à comparer à aujourd’hui : l’action échappe totalement au suivi des retards.',
    },
    {
      id: 'pq8',
      prompt: 'Une action a pris du retard sur le chemin critique. Quel est l’impact ?',
      choices: [
        { id: 'a', label: 'Aucun, tant que les autres actions sont à l’heure' },
        { id: 'b', label: 'La date de fin globale du projet glisse d’autant' },
        { id: 'c', label: 'Seule cette action est concernée' },
      ],
      answer: 'b',
      why: 'Sur le chemin critique, il n’y a pas de marge : chaque jour de retard se répercute directement sur la fin du projet.',
    },
    {
      id: 'pq9',
      prompt: 'Faut-il figer le planning au lancement du projet et ne plus y toucher ?',
      choices: [
        { id: 'a', label: 'Oui, un planning ne se modifie jamais' },
        { id: 'b', label: 'Non, c’est un outil vivant à mettre à jour au fil de l’avancement réel' },
        { id: 'c', label: 'Seulement en cas de retard supérieur à un mois' },
      ],
      answer: 'b',
      why: 'Un planning qui ne reflète pas la réalité perd toute utilité pour le pilotage : il doit être tenu à jour.',
    },
    {
      id: 'pq10',
      prompt:
        'Deux actions ne sont pas liées par une dépendance, mais l’une doit clairement finir avant que l’autre commence sur le terrain. Que faire ?',
      choices: [
        { id: 'a', label: 'Rien, ce n’est pas grave' },
        { id: 'b', label: 'Créer la dépendance manquante pour que le planning reflète la vraie contrainte' },
        { id: 'c', label: 'Supprimer l’une des deux actions' },
      ],
      answer: 'b',
      why: 'Sans la dépendance, le planning autorise un chevauchement impossible en réalité — mieux vaut la modéliser.',
    },
    {
      id: 'pq11',
      prompt:
        'Un chef de projet a une action en retard de 3 jours et une action à échéance dans 2 semaines. Laquelle traiter en premier ?',
      choices: [
        { id: 'a', label: 'Celle à 2 semaines, il a le temps de voir venir' },
        { id: 'b', label: 'Celle en retard : chaque jour supplémentaire aggrave l’impact' },
        { id: 'c', label: 'Les deux en même temps, peu importe l’ordre' },
      ],
      answer: 'b',
      why: 'Un retard non traité s’accumule et peut bloquer les actions qui en dépendent : il se traite en priorité.',
    },
    {
      id: 'pq12',
      prompt: 'Qu’apporte un diagramme de Gantt par rapport à une simple liste de tâches ?',
      choices: [
        { id: 'a', label: 'Rien de plus, c’est esthétique' },
        { id: 'b', label: 'Il visualise la durée, l’ordre et les chevauchements dans le temps' },
        { id: 'c', label: 'Il remplace le besoin d’un responsable par action' },
      ],
      answer: 'b',
      why: 'Le Gantt place les actions sur un calendrier : on voit immédiatement qui fait quoi, quand, et ce qui s’enchaîne.',
    },
    {
      id: 'pq13',
      prompt:
        'Une action « À faire » a une échéance dans 1 jour, une autre « À faire » dans 15 jours. Comment les distinguer dans les priorités ?',
      choices: [
        { id: 'a', label: 'Elles ont exactement la même priorité' },
        { id: 'b', label: 'Celle à échéance imminente mérite une attention immédiate' },
        { id: 'c', label: 'Celle à 15 jours est plus urgente car plus complexe' },
      ],
      answer: 'b',
      why: 'Plus l’échéance est proche, plus le risque de retard imminent est élevé : elle demande une vigilance immédiate.',
    },
    {
      id: 'pq14',
      prompt: 'Pourquoi assigner un responsable unique à chaque action du planning ?',
      choices: [
        { id: 'a', label: 'Pour des raisons purement administratives' },
        { id: 'b', label: 'Pour qu’il y ait toujours quelqu’un d’identifiable en cas de retard ou de question' },
        { id: 'c', label: 'Ce n’est pas nécessaire si l’équipe est petite' },
      ],
      answer: 'b',
      why: 'Sans responsable clair, une action en difficulté n’a personne pour réagir — le suivi devient impossible.',
    },
    {
      id: 'pq15',
      prompt: 'Un planning affiche 3 actions en retard sur un même projet. Que doit faire le chef de projet ?',
      choices: [
        { id: 'a', label: 'Attendre la prochaine revue mensuelle' },
        { id: 'b', label: 'Comprendre pourquoi (charge, blocage, dépendance) et réagir rapidement' },
        { id: 'c', label: 'Supprimer les actions en retard du planning' },
      ],
      answer: 'b',
      why: 'Les retards non traités s’enchaînent souvent : mieux vaut identifier la cause et agir tôt plutôt que laisser s’accumuler.',
    },
  ],
};

const CINQ_POURQUOI_QUIZ: QuizSet = {
  id: 'cinq-pourquoi',
  tool: 'cinq-pourquoi',
  title: '5 Pourquoi — le quiz',
  tagline: 'Symptôme, cause intermédiaire, cause racine : creuser jusqu’où ?',
  passThreshold: 0.875,
  questions: [
    {
      id: 'wq1',
      prompt: 'À quoi sert la méthode des 5 Pourquoi ?',
      choices: [
        { id: 'a', label: 'À trouver un coupable' },
        { id: 'b', label: 'À remonter d’un symptôme visible jusqu’à sa cause racine, en posant « pourquoi » plusieurs fois' },
        { id: 'c', label: 'À lister toutes les causes possibles sans les prioriser' },
      ],
      answer: 'b',
      why: 'L’objectif est de creuser au-delà du symptôme pour atteindre la cause qu’on peut réellement traiter.',
    },
    {
      id: 'wq2',
      prompt: 'Le nombre « 5 » dans la méthode signifie…',
      choices: [
        { id: 'a', label: 'Qu’il faut toujours poser exactement 5 questions' },
        { id: 'b', label: 'Un ordre de grandeur : on s’arrête dès qu’on atteint une cause actionnable' },
        { id: 'c', label: 'Qu’il faut 5 personnes dans l’analyse' },
      ],
      answer: 'b',
      why: '5 est indicatif, pas une règle stricte — l’important est d’atteindre une cause sur laquelle on peut agir.',
    },
    {
      id: 'wq3',
      prompt: 'Qu’est-ce qui caractérise une bonne cause racine ?',
      choices: [
        { id: 'a', label: 'Elle est actionnable : on peut mettre en place une action concrète pour l’éliminer' },
        { id: 'b', label: 'Elle est la plus simple à énoncer' },
        { id: 'c', label: 'Elle implique toujours une personne précise' },
      ],
      answer: 'a',
      why: 'Une cause racine se reconnaît à ce qu’elle ouvre une action corrective durable, pas à sa simplicité d’énoncé.',
    },
    {
      id: 'wq4',
      prompt: '« La ligne s’est arrêtée » — qu’est-ce que c’est dans l’analyse ?',
      choices: [
        { id: 'a', label: 'Une cause racine' },
        { id: 'b', label: 'Un symptôme : l’effet visible, pas encore analysé' },
        { id: 'c', label: 'Une action corrective' },
      ],
      answer: 'b',
      why: 'C’est ce qu’on observe en premier — le point de départ de l’analyse, pas son résultat.',
    },
    {
      id: 'wq5',
      prompt: 'Pourquoi est-il risqué de s’arrêter au premier « pourquoi » ?',
      choices: [
        { id: 'a', label: 'Ce n’est pas risqué, une seule question suffit toujours' },
        { id: 'b', label: 'On risque de traiter un symptôme, sans empêcher le problème de revenir' },
        { id: 'c', label: 'Cela prend trop de temps de continuer' },
      ],
      answer: 'b',
      why: 'S’arrêter trop tôt mène souvent à corriger un effet plutôt que la cause profonde, qui reste alors intacte.',
    },
    {
      id: 'wq6',
      prompt: '« L’opérateur a monté la mauvaise pièce » est citée comme cause. Faut-il s’arrêter là ?',
      choices: [
        { id: 'a', label: 'Oui, on a trouvé le responsable' },
        { id: 'b', label: 'Non, mieux vaut demander pourquoi (référence peu claire ? pas de contrôle visuel ?)' },
        { id: 'c', label: 'Oui, car une personne est toujours la vraie cause' },
      ],
      answer: 'b',
      why: 'Blâmer une personne masque souvent la vraie cause : un manque de procédure, de formation ou de contrôle.',
    },
    {
      id: 'wq7',
      prompt: 'Pourquoi la méthode évite-t-elle de désigner une personne comme « cause racine » ?',
      choices: [
        { id: 'a', label: 'Par politesse uniquement' },
        { id: 'b', label: 'Parce que blâmer un individu masque généralement une cause système, la vraie à corriger' },
        { id: 'c', label: 'Parce que c’est interdit par une norme' },
      ],
      answer: 'b',
      why: 'Une cause « humaine » cache presque toujours une faille de système derrière elle — c’est celle-ci qu’il faut corriger.',
    },
    {
      id: 'wq8',
      prompt: 'Après avoir trouvé la cause racine, que doit-on faire ?',
      choices: [
        { id: 'a', label: 'Rien, l’analyse s’arrête là' },
        { id: 'b', label: 'Définir une action ciblée, puis vérifier qu’elle empêche la récidive' },
        { id: 'c', label: 'Recommencer l’analyse depuis le début' },
      ],
      answer: 'b',
      why: 'Trouver la cause ne suffit pas : il faut une action ciblée, puis vérifier son efficacité dans la durée.',
    },
    {
      id: 'wq9',
      prompt: '« Le roulement a cédé pendant la production » : quel niveau d’analyse ?',
      choices: [
        { id: 'a', label: 'Un symptôme' },
        { id: 'b', label: 'Une cause intermédiaire : on peut encore demander pourquoi il a cédé' },
        { id: 'c', label: 'Une cause racine, on arrête l’analyse' },
      ],
      answer: 'b',
      why: 'Cette cause a elle-même une cause (manque d’entretien ? usure non détectée ?) : il faut continuer à creuser.',
    },
    {
      id: 'wq10',
      prompt: '« Aucun plan de maintenance préventive n’a jamais été mis en place » : quel niveau ?',
      choices: [
        { id: 'a', label: 'Un symptôme' },
        { id: 'b', label: 'Une cause intermédiaire, encore à creuser' },
        { id: 'c', label: 'Une cause racine : actionnable directement (créer le plan)' },
      ],
      answer: 'c',
      why: 'C’est une cause profonde sur laquelle une action corrective directe est possible : mettre en place ce plan.',
    },
    {
      id: 'wq11',
      prompt: 'Qui devrait idéalement participer à une session 5 Pourquoi ?',
      choices: [
        { id: 'a', label: 'Le chef de projet seul, pour aller plus vite' },
        { id: 'b', label: 'Les personnes qui connaissent réellement le terrain et le processus concerné' },
        { id: 'c', label: 'Uniquement la direction' },
      ],
      answer: 'b',
      why: 'Les 5 Pourquoi fonctionnent mieux en groupe, avec les personnes qui ont l’expérience concrète du processus.',
    },
    {
      id: 'wq12',
      prompt: 'Un problème revient malgré une action déjà mise en place. Que faut-il soupçonner ?',
      choices: [
        { id: 'a', label: 'L’action visait un symptôme ou une cause intermédiaire, pas la vraie racine' },
        { id: 'b', label: 'C’est une fatalité, rien à faire' },
        { id: 'c', label: 'Il faut simplement répéter la même action plus souvent' },
      ],
      answer: 'a',
      why: 'Un problème récurrent malgré une action est un signe classique que la cause racine n’a pas été atteinte.',
    },
    {
      id: 'wq13',
      prompt: 'Peut-on avoir plusieurs branches de « pourquoi » pour un même problème ?',
      choices: [
        { id: 'a', label: 'Non, il n’existe qu’une seule chaîne de causes possible' },
        { id: 'b', label: 'Oui, un même symptôme peut avoir plusieurs causes racines indépendantes' },
        { id: 'c', label: 'Non, cela invaliderait la méthode' },
      ],
      answer: 'b',
      why: 'Un problème complexe peut avoir plusieurs causes racines indépendantes, chacune méritant sa propre action.',
    },
    {
      id: 'wq14',
      prompt: '« Le client a reçu sa commande en retard » — à quel niveau se situe cette phrase ?',
      choices: [
        { id: 'a', label: 'Cause racine' },
        { id: 'b', label: 'Symptôme : l’effet visible du problème, le point de départ' },
        { id: 'c', label: 'Cause intermédiaire' },
      ],
      answer: 'b',
      why: 'C’est ce que l’on constate en premier, avant toute analyse — le symptôme déclencheur.',
    },
    {
      id: 'wq15',
      prompt: 'Comment savoir qu’on doit arrêter de poser « pourquoi » ?',
      choices: [
        { id: 'a', label: 'Après exactement 5 questions, toujours' },
        { id: 'b', label: 'Quand la cause trouvée est spécifique, vérifiable, et actionnable par une action concrète' },
        { id: 'c', label: 'Dès que quelqu’un propose une explication plausible' },
      ],
      answer: 'b',
      why: 'Le critère d’arrêt est l’actionnabilité de la cause, pas un nombre fixe de questions ni la première explication venue.',
    },
  ],
};

const A3_QUIZ: QuizSet = {
  id: 'a3',
  tool: 'a3',
  title: 'Charte A3 — le quiz',
  tagline: 'Contexte, analyse, plan, suivi : la logique derrière les cases.',
  passThreshold: 0.875,
  questions: [
    {
      id: 'aq1',
      prompt: 'Quel est l’objectif principal d’une charte A3 ?',
      choices: [
        { id: 'a', label: 'Remplacer le plan d’action détaillé' },
        { id: 'b', label: 'Structurer tout le raisonnement d’un problème sur une seule page' },
        { id: 'c', label: 'Servir uniquement de support de présentation à la direction' },
      ],
      answer: 'b',
      why: 'L’A3 tient en une page toute l’histoire du problème, pour une communication concise et structurée.',
    },
    {
      id: 'aq2',
      prompt: 'Que doit-on écrire dans la case « Contexte » ?',
      choices: [
        { id: 'a', label: 'Les chiffres actuels du problème' },
        { id: 'b', label: 'Pourquoi ce sujet est traité maintenant, et son enjeu' },
        { id: 'c', label: 'La liste des actions à mener' },
      ],
      answer: 'b',
      why: 'Le Contexte explique l’importance et la raison d’être du sujet, avant même de décrire l’état des lieux.',
    },
    {
      id: 'aq3',
      prompt: 'Que doit contenir la case « Situation » ?',
      choices: [
        { id: 'a', label: 'Des opinions sur le problème' },
        { id: 'b', label: 'L’état des lieux factuel, idéalement chiffré, de la situation actuelle' },
        { id: 'c', label: 'Les objectifs visés' },
      ],
      answer: 'b',
      why: 'La Situation décrit factuellement où on en est aujourd’hui — de préférence avec des données mesurables.',
    },
    {
      id: 'aq4',
      prompt: 'Un objectif rédigé « améliorer la qualité » pose problème dans une charte A3. Pourquoi ?',
      choices: [
        { id: 'a', label: 'Ce n’est pas un problème, c’est un bon objectif' },
        { id: 'b', label: 'Il n’est pas mesurable : impossible de vérifier en Suivi s’il est atteint' },
        { id: 'c', label: 'Il est trop ambitieux' },
      ],
      answer: 'b',
      why: 'Un objectif doit être mesurable (ex. réduire le taux de rebut de 8 % à 3 %) pour pouvoir être suivi ensuite.',
    },
    {
      id: 'aq5',
      prompt: 'Peut-on remplir directement le « Plan d’action » avant d’avoir terminé l’« Analyse » ?',
      choices: [
        { id: 'a', label: 'Oui, c’est même recommandé pour gagner du temps' },
        { id: 'b', label: 'Non : les actions doivent découler des causes identifiées' },
        { id: 'c', label: 'Cela n’a pas d’importance, l’ordre des cases est libre' },
      ],
      answer: 'b',
      why: 'Sauter à des solutions avant d’avoir compris les causes est un piège classique : le plan doit répondre à l’analyse.',
    },
    {
      id: 'aq6',
      prompt: 'La case « Analyse » d’une charte A3 devrait s’appuyer sur…',
      choices: [
        { id: 'a', label: 'Des impressions et opinions de l’équipe' },
        { id: 'b', label: 'Des outils d’investigation factuels : Ishikawa, 5 Pourquoi, AMDEC…' },
        { id: 'c', label: 'Uniquement l’avis du chef de projet' },
      ],
      answer: 'b',
      why: 'Une bonne analyse s’appuie sur des méthodes structurées et des données, pas sur des impressions non vérifiées.',
    },
    {
      id: 'aq7',
      prompt: 'À quoi sert la case « Suivi » ?',
      choices: [
        { id: 'a', label: 'À lister les tâches terminées' },
        { id: 'b', label: 'À mesurer, dans le temps, si les actions ont réellement atteint l’objectif visé' },
        { id: 'c', label: 'À noter les nouvelles idées d’amélioration' },
      ],
      answer: 'b',
      why: 'Le Suivi vérifie l’efficacité des actions dans la durée, pas seulement si elles ont été réalisées.',
    },
    {
      id: 'aq8',
      prompt: 'Une action est « Terminée » dans le plan d’action. L’objectif de la charte est-il automatiquement atteint ?',
      choices: [
        { id: 'a', label: 'Oui, terminer les actions suffit' },
        { id: 'b', label: 'Pas forcément : il faut vérifier en Suivi que le résultat visé est bien obtenu' },
        { id: 'c', label: 'Cela dépend du nombre d’actions' },
      ],
      answer: 'b',
      why: 'Faire l’action ne garantit pas le résultat — le Suivi mesure si l’objectif est réellement atteint.',
    },
    {
      id: 'aq9',
      prompt: 'Quel lien la charte A3 entretient-elle avec la logique PDCA (Plan-Do-Check-Act) ?',
      choices: [
        { id: 'a', label: 'Aucun lien, ce sont deux outils indépendants' },
        { id: 'b', label: 'Contexte/Situation/Objectifs/Analyse/Plan = « Plan », le Suivi = « Check/Act »' },
        { id: 'c', label: 'La charte A3 remplace complètement le PDCA' },
      ],
      answer: 'b',
      why: 'L’A3 structure physiquement le cycle PDCA sur une page : préparation d’un côté, vérification et ajustement de l’autre.',
    },
    {
      id: 'aq10',
      prompt: '« Cette ligne représente 40 % du chiffre d’affaires » — dans quelle case cette phrase a-t-elle sa place ?',
      choices: [
        { id: 'a', label: 'Suivi' },
        { id: 'b', label: 'Contexte : elle justifie l’enjeu du sujet traité' },
        { id: 'c', label: 'Plan d’action' },
      ],
      answer: 'b',
      why: 'C’est un élément qui justifie pourquoi ce sujet mérite d’être traité — typiquement du Contexte.',
    },
    {
      id: 'aq11',
      prompt: 'Pourquoi tenir la charte A3 sur une seule page plutôt qu’un rapport de plusieurs pages ?',
      choices: [
        { id: 'a', label: 'Par contrainte technique du format papier' },
        { id: 'b', label: 'Pour forcer la synthèse et faciliter une communication rapide et partagée' },
        { id: 'c', label: 'Parce que les détails ne sont jamais utiles' },
      ],
      answer: 'b',
      why: 'La contrainte d’une page force à synthétiser l’essentiel, ce qui rend le sujet plus facile à partager.',
    },
    {
      id: 'aq12',
      prompt: 'Un plan d’action mentionne « Former les opérateurs — resp. Claire — avant fin mai ». Quelle case ?',
      choices: [
        { id: 'a', label: 'Analyse' },
        { id: 'b', label: 'Plan d’action : action, responsable et échéance sont réunis' },
        { id: 'c', label: 'Objectifs' },
      ],
      answer: 'b',
      why: 'Une action avec responsable et échéance décrit ce qui va être fait concrètement : Plan d’action.',
    },
    {
      id: 'aq13',
      prompt: 'Peut-on écrire une charte A3 seul, sans jamais consulter le terrain ?',
      choices: [
        { id: 'a', label: 'Oui, c’est plus rapide' },
        { id: 'b', label: 'Ce n’est pas recommandé : Situation et Analyse doivent refléter la réalité du terrain' },
        { id: 'c', label: 'Oui, à condition d’avoir de l’expérience' },
      ],
      answer: 'b',
      why: 'Une charte A3 basée sur des suppositions plutôt que sur le terrain risque de rater la vraie situation et les vraies causes.',
    },
    {
      id: 'aq14',
      prompt: 'Le « Suivi » montre que l’objectif n’est pas atteint après les actions. Que faire ?',
      choices: [
        { id: 'a', label: 'La charte A3 est un échec définitif, il faut l’abandonner' },
        { id: 'b', label: 'Revenir à l’analyse : la cause traitée n’était peut-être pas la bonne' },
        { id: 'c', label: 'Rien, le Suivi est juste informatif' },
      ],
      answer: 'b',
      why: 'Le Suivi qui ne montre pas d’amélioration doit relancer la réflexion — c’est la boucle d’amélioration continue.',
    },
    {
      id: 'aq15',
      prompt: 'Une charte A3 sert avant tout à…',
      choices: [
        { id: 'a', label: 'Remplacer les autres outils qualité (AMDEC, Ishikawa, RACI…)' },
        { id: 'b', label: 'Rassembler et structurer, sur une page, ce que ces autres outils ont déjà produit' },
        { id: 'c', label: 'Décorer les réunions de direction' },
      ],
      answer: 'b',
      why: 'L’A3 ne remplace pas les outils d’analyse : il en synthétise les résultats dans une histoire structurée et lisible.',
    },
  ],
};

/** Catalogue des quiz disponibles. */
export const QUIZ_SETS: Partial<Record<AcademyToolId, QuizSet>> = {
  planning: PLANNING_QUIZ,
  'cinq-pourquoi': CINQ_POURQUOI_QUIZ,
  a3: A3_QUIZ,
};

export function quizSet(tool: AcademyToolId): QuizSet | undefined {
  return QUIZ_SETS[tool];
}
