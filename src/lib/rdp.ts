/**
 * Méthodologie de résolution de problème en 7 phases (0 → 6).
 * Source : « Méthodologie de résolution de problème » — démarche simple,
 * efficace, adaptable à tout le monde (P. Caliot).
 */

export interface RdpPhaseMeta {
  num: number;
  label: string;
  /** Page de l'app qui porte la phase. */
  href: string;
  /** Outils préconisés par la méthodologie. */
  tools: string[];
  description: string;
}

export const RDP_PHASES: RdpPhaseMeta[] = [
  {
    num: 0,
    label: 'Choisir un sujet',
    href: '/sujet',
    tools: ['Brainstorming', 'Tableau à double entrée', '5 Pourquoi'],
    description:
      'Brainstormer les problèmes rencontrés, les prioriser et choisir le sujet à traiter.',
  },
  {
    num: 1,
    label: 'Poser le problème',
    href: '/probleme',
    tools: ['QQOQCP', 'Pareto', 'Tableau de bord', 'Feuilles de relevés'],
    description:
      'Règle des 3T — tout voir, tout noter, tout mesurer. Décrire la situation actuelle et souhaitée, quantifier l’écart.',
  },
  {
    num: 2,
    label: 'Rechercher les causes',
    href: '/ishikawa',
    tools: ['Brainstorming', 'Ishikawa / 5M', 'Courbe ABC'],
    description:
      'Identifier toutes les causes possibles, les classer par nature (5M) puis par importance.',
  },
  {
    num: 3,
    label: 'Rechercher les solutions',
    href: '/solutions',
    tools: ['Brainstorming', 'Tableau à double entrée'],
    description: 'Pour chaque cause identifiée, rechercher des solutions et les classer.',
  },
  {
    num: 4,
    label: 'Choisir une solution',
    href: '/solutions',
    tools: ['Matrice de décision'],
    description:
      'Confronter les solutions aux critères et choisir. « Il vaut mieux un imparfait immédiat qu’un parfait à venir. »',
  },
  {
    num: 5,
    label: 'Mettre en œuvre',
    href: '/capa',
    tools: ['Cycle PDCA', 'QQOQCP'],
    description:
      'Établir le plan d’action — qui fait quoi, où, quand, comment — suivre la mise en œuvre et mesurer les écarts.',
  },
  {
    num: 6,
    label: 'Standardiser',
    href: '/standardisation',
    tools: ['Cycle PDCA', 'QQOQCP'],
    description:
      'Étendre la solution aux autres procédés et pérenniser — esprit Kaizen : on peut toujours améliorer.',
  },
];
