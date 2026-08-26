import type { ReactElement } from 'react';
import {
  IconA3,
  IconActions,
  IconAmdec,
  IconCost,
  IconIshikawa,
  IconPlanning,
  IconRaci,
  IconRevue,
  IconSparkles,
  IconSwot,
  IconTree,
} from '@/components/icons';

/**
 * Contenu du guide — séparé du composant parce que DEUX pages le rendent :
 * `/help` (guide produit, en interne) et `/methodes` (page publique de
 * référencement). Une seule source de vérité pour les deux.
 *
 * Règles de rédaction, à tenir pour que la page ne regonfle pas :
 * - `question` : le titre replié. Une QUESTION, pas un nom d'outil — c'est ce
 *   que le lecteur se demande, et un nom d'outil ne lui parle pas s'il ne le
 *   connaît pas déjà. 8 mots maximum.
 * - `oneLine` : 25 mots maximum. `when` : 30 mots maximum.
 * - `inApp.steps` : 3 étapes maximum, à l'impératif.
 * Le reste (`why`, `link`) porte la profondeur méthodo et le référencement :
 * texte long assumé, mais il est derrière un dépli.
 */

export interface GuideCard {
  id: string;
  /** Titre replié : la question que se pose le lecteur. */
  question: string;
  /** Nom de l'outil, affiché après la question. */
  tool: string;
  icon: ReactElement;
  oneLine: string;
  when: string;
  example: ReactElement;
  /** Mode d'emploi produit — masqué sur la page publique. */
  inApp: { steps: string[]; href: string; cta: string };
  why: string;
  link: string;
}

export interface GuideGroup {
  id: string;
  label: string;
  /** Libellé court du raccourci de saut. */
  chip: string;
  intro: string;
  cards: GuideCard[];
}

export const GUIDE_GROUPS: GuideGroup[] = [
  {
    id: 'cadrer',
    label: 'Cadrer le projet',
    chip: 'Cadrer',
    intro: 'Avant de lancer quoi que ce soit : où on en est, et où on veut aller.',
    cards: [
      {
        id: 'swot',
        question: 'Sur quoi m’appuyer, qu’est-ce qui me menace ?',
        tool: 'SWOT',
        icon: <IconSwot />,
        oneLine:
          'Une matrice en quatre cases : vos Forces et Faiblesses internes, vos Opportunités et Menaces externes.',
        when: 'Au démarrage d’un projet, ou quand le contexte change — nouveau client, nouvelle ligne, nouveau concurrent.',
        example: (
          <div className="ex-swot">
            <div className="s"><b>Forces</b>Équipe expérimentée</div>
            <div className="w"><b>Faiblesses</b>Machines vieillissantes</div>
            <div className="o"><b>Opportunités</b>Nouveau marché export</div>
            <div className="t"><b>Menaces</b>Délais fournisseurs</div>
          </div>
        ),
        inApp: {
          steps: [
            'Activez l’outil SWOT depuis la page Outils du projet.',
            'Saisissez vos éléments dans les quatre cases, un par ligne.',
            'Reprenez chaque menace en risque AMDEC, chaque faiblesse en action.',
          ],
          href: '/swot',
          cta: 'Ouvrir le SWOT',
        },
        why: 'Avant de se lancer, elle oblige à regarder la réalité en face : sur quoi s’appuyer, que corriger, que saisir, qu’anticiper. C’est le point de départ stratégique d’un projet.',
        link: 'Les menaces identifiées alimentent naturellement l’AMDEC, et les faiblesses se transforment en actions d’amélioration.',
      },
      {
        id: 'a3',
        question: 'Comment résumer tout le projet sur une page ?',
        tool: 'Charte A3',
        icon: <IconA3 />,
        oneLine:
          'Une fiche unique qui condense contexte, situation, objectifs, analyse, plan d’action et suivi.',
        when: 'Pour présenter le projet à un comité, ou pour le transmettre à quelqu’un qui le reprend.',
        example: (
          <div className="ex-a3">
            <div className="full"><b>Contexte</b>Fiabiliser la ligne A3</div>
            <div><b>Objectifs</b>−50 % d’arrêts</div>
            <div><b>Analyse</b>Ishikawa + AMDEC</div>
            <div className="full"><b>Plan &amp; suivi</b>5 actions · 80 % avancées</div>
          </div>
        ),
        inApp: {
          steps: [
            'Activez la Charte A3 dans les Outils du projet.',
            'Remplissez les six blocs ; tout s’enregistre au fil de la saisie.',
            'Exportez en PDF pour la diffuser.',
          ],
          href: '/a3',
          cta: 'Ouvrir la charte A3',
        },
        why: 'Héritée du lean (Toyota), elle impose la clarté : si ça ne tient pas sur une feuille A3, c’est que ce n’est pas assez mûr. Idéale pour communiquer et standardiser.',
        link: 'L’A3 agrège des données déjà saisies ailleurs : c’est une synthèse, pas une ressaisie.',
      },
    ],
  },
  {
    id: 'piloter',
    label: 'Répartir et piloter',
    chip: 'Piloter',
    intro: 'Qui fait quoi, pour quand — et comment vous tenez les délais.',
    cards: [
      {
        id: 'raci',
        question: 'Qui fait quoi, vraiment ?',
        tool: 'RACI',
        icon: <IconRaci />,
        oneLine:
          'Chaque action reçoit un Responsible qui la réalise, un Accountable qui en répond, des Consulted et des Informed.',
        when: 'Dès qu’une action implique plus d’une personne, ou dès que vous entendez « je croyais que c’était toi ».',
        example: (
          <div className="ex-raci">
            <div className="act">Action : valider le plan qualité</div>
            <div className="roles">
              <span className="role"><b>R</b> Claire</span>
              <span className="role"><b>A</b> Marc</span>
              <span className="role"><b>C</b> Sonia</span>
              <span className="role"><b>I</b> Équipe</span>
            </div>
          </div>
        ),
        inApp: {
          steps: [
            'Constituez l’équipe du projet depuis « Accès au projet ».',
            'Ouvrez le RACI : une ligne par action, une colonne par membre.',
            'Attribuez les rôles directement dans le tableau.',
          ],
          href: '/raci',
          cta: 'Ouvrir le RACI',
        },
        why: 'La première cause de retard d’un projet, c’est le flou sur les responsabilités. Le RACI supprime les « je croyais que c’était toi » et garantit qu’une action a toujours un responsable unique.',
        link: 'Chaque rôle est porté par une action réelle : la responsabilité suit la tâche jusque dans le plan d’action et le planning, sans ressaisie.',
      },
      {
        id: 'actions',
        question: 'Comment transformer les intentions en tâches ?',
        tool: 'Plan d’action',
        icon: <IconActions />,
        oneLine:
          'La liste des tâches du projet : titre, responsable, échéance et statut — à faire, en cours, terminée.',
        when: 'En permanence. C’est le moteur du projet : tout le reste vient l’alimenter ou le suivre.',
        example: (
          <div className="ex-action">
            <span className="st">En cours</span>
            <span>Remplacer les roulements du convoyeur</span>
            <span className="due">éch. 30 juin · Marc</span>
          </div>
        ),
        inApp: {
          steps: [
            'Cliquez sur « Nouvelle action » depuis le tableau de bord.',
            'Donnez-lui un responsable et une échéance — les deux comptent.',
            'Cochez « Jalon » pour les points de passage clés.',
          ],
          href: '/actions',
          cta: 'Ouvrir le plan d’action',
        },
        why: 'C’est le moteur du projet : sans plan d’action suivi, la meilleure analyse reste lettre morte. Il transforme les intentions en tâches datées et assignées.',
        link: 'L’action est l’entité centrale de l’app : elle porte son RACI, apparaît dans le planning, peut être chiffrée dans les coûts et découler d’une AMDEC.',
      },
      {
        id: 'planning',
        question: 'Où est-ce que je vais déraper ?',
        tool: 'Planning et Gantt',
        icon: <IconPlanning />,
        oneLine:
          'Vos actions posées sur un calendrier et un diagramme de Gantt : dates, retards, jalons et dépendances.',
        when: 'Chaque semaine, pour repérer les retards et les semaines surchargées avant qu’ils ne vous tombent dessus.',
        example: (
          <div className="ex-gantt">
            <div>
              <div className="lbl">Diagnostic</div>
              <div className="track"><span className="bar" style={{ left: '4%', width: '28%' }} /></div>
            </div>
            <div>
              <div className="lbl">Commande des pièces</div>
              <div className="track"><span className="bar late" style={{ left: '26%', width: '34%' }} /></div>
            </div>
            <div>
              <div className="lbl">Montage</div>
              <div className="track"><span className="bar" style={{ left: '58%', width: '30%' }} /></div>
            </div>
          </div>
        ),
        inApp: {
          steps: [
            'Basculez sur l’onglet Gantt pour voir les barres dans le temps.',
            'Glissez depuis la poignée d’une barre pour créer une dépendance.',
            'Une flèche rouge signale un enchaînement intenable.',
          ],
          href: '/planning',
          cta: 'Ouvrir le planning',
        },
        why: 'Il rend le temps visible : on repère d’un coup d’œil les retards, les goulots et les semaines chargées, et on réagit avant l’embouteillage.',
        link: 'Le planning ne stocke aucune donnée propre : c’est une vue des actions. Changer une échéance dans le plan d’action met le Gantt à jour instantanément.',
      },
    ],
  },
  {
    id: 'analyser',
    label: 'Analyser et anticiper',
    chip: 'Analyser',
    intro: 'Traiter les problèmes avant qu’ils ne coûtent cher — et ceux qui sont déjà là.',
    cards: [
      {
        id: 'amdec',
        question: 'Quels risques traiter en premier ?',
        tool: 'AMDEC',
        icon: <IconAmdec />,
        oneLine:
          'Chaque risque est coté en Gravité, Occurrence et Détectabilité ; leur produit donne la criticité, de 1 à 64.',
        when: 'Dès que le projet touche un procédé, une machine ou un délai dont la défaillance coûterait cher.',
        example: (
          <div className="ex-amdec">
            <span>Arrêt inopiné du convoyeur</span>
            <span className="calc">
              G&nbsp;<b>4</b> × O&nbsp;<b>3</b> × D&nbsp;<b>2</b> ={' '}
              <span className="crit">24 · Critique</span>
            </span>
          </div>
        ),
        inApp: {
          steps: [
            'Listez vos modes de défaillance, un par ligne.',
            'Cotez G, O et D de 1 à 4 : au-delà de 24, le risque est critique.',
            'Générez l’action corrective depuis la ligne de risque.',
          ],
          href: '/amdec',
          cta: 'Ouvrir l’AMDEC',
        },
        why: 'Plutôt que de subir les pannes, on les hiérarchise : l’effort se concentre sur les risques les plus critiques, avant qu’ils ne coûtent cher. C’est le cœur de la démarche qualité industrielle.',
        link: 'Un risque critique se transforme en un clic en action corrective, reliée à l’AMDEC d’origine : la traçabilité va du risque à sa parade.',
      },
      {
        id: 'rdp',
        question: 'Un problème revient sans arrêt, par où commencer ?',
        tool: 'Résolution de problèmes',
        icon: <IconIshikawa />,
        oneLine:
          'Une démarche en sept phases, du choix du sujet à la standardisation, en passant par le QQOQCP et l’Ishikawa 5M.',
        when: 'Quand un problème récurrent résiste aux rustines et qu’il faut remonter à la cause racine.',
        example: (
          <div className="ex-link">
            <span className="node"><small>Phase 1</small>QQOQCP</span>
            <span className="arr">→</span>
            <span className="node"><small>Phase 2</small>Ishikawa 5M</span>
            <span className="arr">→</span>
            <span className="node"><small>Phase 4</small>Solution retenue</span>
          </div>
        ),
        inApp: {
          steps: [
            'Activez l’outil Résolution de problèmes, puis créez une résolution.',
            'Suivez les phases : le fil guide la démarche de bout en bout.',
            'Les actions correctives deviennent de vraies actions du projet.',
          ],
          href: '/rdp',
          cta: 'Ouvrir la résolution de problèmes',
        },
        why: 'Un projet peut contenir autant de résolutions que nécessaire : un problème surgit dans un projet, il n’en est pas un. La démarche impose de chercher la cause avant la solution, ce qui évite de traiter le symptôme.',
        link: 'Les actions issues des phases 5 et 6 remontent dans le plan d’action, le planning et les revues — sans double saisie.',
      },
      {
        id: 'liens',
        question: 'D’où vient cette action, et qu’est-ce qu’elle déclenche ?',
        tool: 'Vue Liens',
        icon: <IconTree />,
        oneLine:
          'L’arborescence des relations entre risques, actions et éléments du projet.',
        when: 'Pour expliquer le projet à quelqu’un, ou vérifier qu’aucun risque n’est resté sans parade.',
        example: (
          <div className="ex-link">
            <span className="node"><small>Risque</small>Arrêt convoyeur</span>
            <span className="arr">→</span>
            <span className="node"><small>Action</small>Maintenance préventive</span>
            <span className="arr">→</span>
            <span className="node"><small>Élément</small>Roulements</span>
          </div>
        ),
        inApp: {
          steps: [
            'Ouvrez la vue Liens : elle se construit seule à partir de vos données.',
            'Dépliez une branche pour suivre un risque jusqu’à sa parade.',
          ],
          href: '/liens',
          cta: 'Ouvrir la vue Liens',
        },
        why: 'Elle donne la vision d’ensemble : comprendre d’où vient une action, ce qu’un risque déclenche, comment tout s’enchaîne — pour expliquer et pour ne rien oublier.',
        link: 'C’est la carte qui matérialise le fil rouge entre tous les modules.',
      },
    ],
  },
  {
    id: 'partager',
    label: 'Suivre et partager',
    chip: 'Partager',
    intro: 'Le budget, les points d’équipe, et ce que vous montrez à l’extérieur.',
    cards: [
      {
        id: 'couts',
        question: 'Est-ce que je tiens le budget ?',
        tool: 'Coûts',
        icon: <IconCost />,
        oneLine:
          'Le budget prévu face au coût réel, poste par poste, avec l’écart et le taux de consommation.',
        when: 'Dès qu’il y a des achats, une prestation ou un abonnement à suivre dans le projet.',
        example: (
          <div className="ex-cost">
            <div className="line">
              Prévu <b>10 000 €</b> · réel <b>11 200 €</b> · <span className="over">écart +12 %</span>
            </div>
            <div className="bar"><span /></div>
          </div>
        ),
        inApp: {
          steps: [
            'Activez l’outil Coûts dans les Outils du projet.',
            'Saisissez le prévu ; renseignez le réel au fil des dépenses.',
            'Pour un abonnement, cochez la case et incrémentez les mois.',
          ],
          href: '/couts',
          cta: 'Ouvrir les coûts',
        },
        why: 'Un projet qui tient les délais mais explose le budget reste un échec. Le suivi des coûts garde la dimension économique sous contrôle.',
        link: 'Les dépenses se rattachent au projet et à ses actions : chaque coût est relié à ce qui le génère.',
      },
      {
        id: 'revue',
        question: 'Comment animer un point d’avancement ?',
        tool: 'Revue de projet',
        icon: <IconRevue />,
        oneLine:
          'Une réunion animée depuis l’outil : actions et risques à jour en direct, décisions captées, compte-rendu automatique.',
        when: 'À chaque point hebdomadaire, COPIL ou revue de jalon — pour arrêter de rédiger le compte-rendu après coup.',
        example: (
          <div className="ex-action">
            <span className="st">COPIL</span>
            <span>3 décisions · 2 actions créées</span>
            <span className="due">clôturée · CR envoyé</span>
          </div>
        ),
        inApp: {
          steps: [
            'Démarrez une revue et cochez les présents.',
            'Notez les décisions en séance ; créez les actions au fil de l’eau.',
            'À la clôture, le compte-rendu se fige et s’envoie par email.',
          ],
          href: '/revue',
          cta: 'Ouvrir les revues',
        },
        why: 'Le compte-rendu est figé à la clôture : un document d’audit ne doit pas changer parce qu’une action a été renommée depuis. La revue suivante affiche le delta — ce qui a avancé, ce qui a glissé.',
        link: 'La revue ne ressaisit rien : elle lit les actions, les risques et l’avancement du projet, et n’ajoute que les décisions et les présences.',
      },
      {
        id: 'contexte-ia',
        question: 'Comment faire analyser mon projet par une IA ?',
        tool: 'Contexte IA',
        icon: <IconSparkles />,
        oneLine:
          'Un résumé structuré du projet, à coller dans l’assistant IA de votre choix pour l’interroger ou préparer une réunion.',
        when: 'Avant une revue, pour rédiger un point d’avancement, ou pour faire challenger votre analyse de risques.',
        example: (
          <div className="ex-action">
            <span className="st">Markdown</span>
            <span>Avancement, retards, jalons, risques, budget</span>
            <span className="due">~1 page</span>
          </div>
        ),
        inApp: {
          steps: [
            'Cliquez sur « Contexte IA » dans l’en-tête du tableau de bord.',
            'Copiez le document, collez-le dans votre assistant.',
            'Ajoutez votre demande à la suite — des exemples sont fournis.',
          ],
          href: '/help/contexte-ia',
          cta: 'Voir les exemples d’usage',
        },
        why: 'Le document est fabriqué dans votre navigateur et n’est envoyé nulle part : rien ne sort tant que vous ne collez pas le texte vous-même. Une case permet d’anonymiser les noms de l’équipe.',
        link: 'Il agrège ce que les autres outils contiennent déjà — c’est ce qui permet à une IA de raisonner sur votre projet plutôt que sur des généralités.',
      },
    ],
  },
];

/** Le fil rouge, affiché après les fiches. */
export const FLOW = ['SWOT', 'AMDEC', 'Actions', 'RACI', 'Planning', 'Coûts', 'A3'];
