/**
 * Registre des widgets du tableau de bord modulable.
 * Ce fichier ne contient que des métadonnées (pas de composants React) — la
 * correspondance id → composant vit dans src/modules/dashboard/widgets.
 */

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
  | 'costs-breakdown'
  // Résolution de problèmes (outil, cf. fix-32)
  | 'rdp';

/** Instance de widget telle que stockée (ordre = position dans le tableau). */
export interface WidgetInstance {
  id: WidgetId;
  /** Largeur personnalisée (override du `span` par défaut du widget). */
  span?: 1 | 2;
  settings?: Record<string, number | string | boolean>;
}

export interface WidgetDef {
  id: WidgetId;
  title: string;
  description: string;
  /** Outil dont dépend le widget : masqué si l'outil n'est pas activé. */
  requiresTool?: 'couts' | 'rdp';
  /** Largeur : 1 = demi-colonne, 2 = pleine largeur. */
  span: 1 | 2;
  defaultSettings?: Record<string, number | string | boolean>;
}

export const WIDGETS: Record<WidgetId, WidgetDef> = {
  kpis: { id: 'kpis', title: 'Chiffres clés', description: 'Actions en cours, avancement, risques critiques.', span: 2 },
  progress: { id: 'progress', title: 'Avancement', description: 'Frise d’avancement des actions (à faire / en cours / terminé).', span: 2 },
  delays: { id: 'delays', title: 'Retards & urgences', description: 'Actions en retard et échéances proches.', span: 1, defaultSettings: { urgentDays: 3 } },
  upcoming: { id: 'upcoming', title: 'À venir (planning)', description: 'Actions à terminer et à démarrer dans les prochains jours.', span: 1, defaultSettings: { horizonDays: 14 } },
  risks: { id: 'risks', title: 'Risques (AMDEC)', description: 'Criticité après actions correctives.', span: 1 },
  'team-load': { id: 'team-load', title: 'Charge équipe', description: 'Actions ouvertes par membre.', span: 1 },
  'status-breakdown': { id: 'status-breakdown', title: 'Répartition par statut', description: 'À faire / en cours / terminée.', span: 1 },
  costs: { id: 'costs', requiresTool: 'couts', title: 'Suivi des coûts', description: 'Budget prévu vs réel, écart et consommation.', span: 1 },
  'costs-breakdown': { id: 'costs-breakdown', requiresTool: 'couts', title: 'Répartition des coûts', description: 'Poids de chaque poste dans la dépense.', span: 1 },

  rdp: { id: 'rdp', title: 'Résolutions de problèmes', description: 'Les démarches en cours sur ce projet et leur phase.', requiresTool: 'rdp', span: 1 },
};

export const DEFAULT_LAYOUT_GESTION: WidgetInstance[] = [
  { id: 'kpis' },
  { id: 'delays' },
  { id: 'risks' },
  { id: 'team-load' },
  { id: 'upcoming' },
];

export function defaultLayout(): WidgetInstance[] {
  return DEFAULT_LAYOUT_GESTION;
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

/** Widgets proposables : tout le catalogue, moins ceux dont l'outil est éteint. */
export function widgetsForTools(enabled: readonly string[]): WidgetId[] {
  return (Object.keys(WIDGETS) as WidgetId[]).filter((id) => {
    const need = WIDGETS[id].requiresTool;
    return !need || enabled.includes(need);
  });
}
