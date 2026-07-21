/**
 * Catalogue des outils de gestion modulables.
 * Chaque projet de gestion active la palette d'outils qu'il souhaite ; le
 * dashboard, la page Outils et l'accès sont toujours présents.
 */

export type ToolId = 'raci' | 'amdec' | 'actions' | 'planning' | 'revue' | 'liens' | 'couts' | 'a3' | 'swot';

export interface ToolDef {
  id: ToolId;
  label: string;
  href: string;
  description: string;
}

/** Ordre canonique d'affichage dans la sidebar. */
export const TOOL_ORDER: ToolId[] = ['raci', 'amdec', 'actions', 'planning', 'revue', 'liens', 'couts', 'a3', 'swot'];

export const TOOLS: Record<ToolId, ToolDef> = {
  raci: { id: 'raci', label: 'RACI', href: '/raci', description: 'Responsabilités : qui est Responsible, Accountable, Consulté, Informé.' },
  amdec: { id: 'amdec', label: 'AMDEC', href: '/amdec', description: 'Analyse des risques et criticité, avant/après actions correctives.' },
  actions: { id: 'actions', label: 'Actions', href: '/actions', description: 'Plan d’action : tâches, responsables, échéances, statuts.' },
  planning: { id: 'planning', label: 'Planning', href: '/planning', description: 'Calendrier et diagramme de Gantt des actions.' },
  revue: { id: 'revue', label: 'Revue de projet', href: '/revue', description: 'Anime ta réunion d’avancement depuis l’outil : actions, risques et décisions mis à jour en direct, compte-rendu automatique.' },
  liens: { id: 'liens', label: 'Liens', href: '/liens', description: 'Arborescence des relations entre risques, actions et éléments.' },
  couts: { id: 'couts', label: 'Coûts', href: '/couts', description: 'Suivi des coûts : budget prévu vs coût réel, écart et consommation.' },
  a3: { id: 'a3', label: 'Charte A3', href: '/a3', description: 'Fiche A3 : contexte, situation, objectifs, analyse, plan d’action, suivi.' },
  swot: { id: 'swot', label: 'SWOT', href: '/swot', description: 'Forces, faiblesses, opportunités, menaces — matrice stratégique.' },
};

/** Outils activés par défaut sur un nouveau projet de gestion (couts off). */
export const DEFAULT_TOOLS_GESTION: ToolId[] = ['raci', 'amdec', 'actions', 'planning', 'liens'];

/** Liste (ordonnée, valide) des outils activés pour un projet. */
export function enabledTools(tools: ToolId[] | null | undefined): ToolId[] {
  const set = tools ?? DEFAULT_TOOLS_GESTION;
  return TOOL_ORDER.filter((id) => set.includes(id));
}
