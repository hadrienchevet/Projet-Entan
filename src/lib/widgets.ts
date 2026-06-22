/**
 * Registre des widgets du tableau de bord modulable.
 * Ce fichier ne contient que des métadonnées (pas de composants React) — la
 * correspondance id → composant vit dans src/modules/dashboard/widgets.
 */

export type WidgetScope = 'gestion' | 'rdp';

export type WidgetId =
  // Gestion
  | 'kpis'
  | 'progress'
  | 'delays'
  | 'upcoming'
  | 'risks'
  | 'team-load'
  | 'status-breakdown'
  | 'costs'
  // RDP
  | 'rdp-phase'
  | 'rdp-subject'
  | 'rdp-stats'
  | 'rdp-indicators'
  | 'rdp-standardisation';

/** Instance de widget telle que stockée (ordre = position dans le tableau). */
export interface WidgetInstance {
  id: WidgetId;
  settings?: Record<string, number | string | boolean>;
}

export interface WidgetDef {
  id: WidgetId;
  title: string;
  description: string;
  scope: WidgetScope;
  /** Largeur : 1 = demi-colonne, 2 = pleine largeur. */
  span: 1 | 2;
  defaultSettings?: Record<string, number | string | boolean>;
}

export const WIDGETS: Record<WidgetId, WidgetDef> = {
  kpis: { id: 'kpis', title: 'Chiffres clés', description: 'Actions en cours, avancement, risques critiques.', scope: 'gestion', span: 2 },
  progress: { id: 'progress', title: 'Avancement', description: 'Frise d’avancement des actions (à faire / en cours / terminé).', scope: 'gestion', span: 2 },
  delays: { id: 'delays', title: 'Retards & urgences', description: 'Actions en retard et échéances proches.', scope: 'gestion', span: 1, defaultSettings: { urgentDays: 3 } },
  upcoming: { id: 'upcoming', title: 'À venir (planning)', description: 'Actions à terminer et à démarrer dans les prochains jours.', scope: 'gestion', span: 1, defaultSettings: { horizonDays: 14 } },
  risks: { id: 'risks', title: 'Risques (AMDEC)', description: 'Criticité après actions correctives.', scope: 'gestion', span: 1 },
  'team-load': { id: 'team-load', title: 'Charge équipe', description: 'Actions ouvertes par membre.', scope: 'gestion', span: 1 },
  'status-breakdown': { id: 'status-breakdown', title: 'Répartition par statut', description: 'À faire / en cours / terminée.', scope: 'gestion', span: 1 },
  costs: { id: 'costs', title: 'Suivi des coûts', description: 'Budget prévu vs réel, écart et consommation.', scope: 'gestion', span: 1 },

  'rdp-phase': { id: 'rdp-phase', title: 'Avancement de la démarche', description: 'Les 7 phases, navigation et phase courante.', scope: 'rdp', span: 2 },
  'rdp-subject': { id: 'rdp-subject', title: 'Sujet retenu', description: 'Le problème traité.', scope: 'rdp', span: 2 },
  'rdp-stats': { id: 'rdp-stats', title: 'Chiffres clés RDP', description: 'Sujets, causes, solutions, actions.', scope: 'rdp', span: 2 },
  'rdp-indicators': { id: 'rdp-indicators', title: 'Indicateurs de performance', description: 'Valeur actuelle vs objectif.', scope: 'rdp', span: 2 },
  'rdp-standardisation': { id: 'rdp-standardisation', title: 'Standardisation', description: 'Actions de la phase 6.', scope: 'rdp', span: 2 },
};

export const DEFAULT_LAYOUT_GESTION: WidgetInstance[] = [
  { id: 'kpis' },
  { id: 'delays' },
  { id: 'risks' },
  { id: 'team-load' },
  { id: 'upcoming' },
];

export const DEFAULT_LAYOUT_RDP: WidgetInstance[] = [
  { id: 'rdp-subject' },
  { id: 'rdp-phase' },
  { id: 'rdp-stats' },
  { id: 'rdp-indicators' },
];

export function defaultLayout(scope: WidgetScope): WidgetInstance[] {
  return scope === 'rdp' ? DEFAULT_LAYOUT_RDP : DEFAULT_LAYOUT_GESTION;
}

/** Lecture d'un réglage avec repli sur la valeur par défaut du widget. */
export function widgetSetting<T extends number | string | boolean>(
  instance: WidgetInstance,
  key: string,
  fallback: T,
): T {
  const v = instance.settings?.[key];
  if (v === undefined || v === null) {
    const d = WIDGETS[instance.id].defaultSettings?.[key];
    return (d as T) ?? fallback;
  }
  return v as T;
}

/** Ids valides pour un scope (utile pour filtrer une config stockée). */
export function widgetsForScope(scope: WidgetScope): WidgetId[] {
  return (Object.keys(WIDGETS) as WidgetId[]).filter((id) => WIDGETS[id].scope === scope);
}
