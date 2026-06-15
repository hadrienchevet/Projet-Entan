import type { FC } from 'react';
import type { Project } from '@/lib/types';
import type { WidgetId, WidgetInstance } from '@/lib/widgets';
import { KpisWidget } from './KpisWidget';
import { DelaysWidget } from './DelaysWidget';
import { UpcomingWidget } from './UpcomingWidget';
import { RisksWidget } from './RisksWidget';
import { TeamLoadWidget } from './TeamLoadWidget';
import { StatusBreakdownWidget } from './StatusBreakdownWidget';
import { RdpPhaseWidget } from './RdpPhaseWidget';
import { RdpSubjectWidget } from './RdpSubjectWidget';
import { RdpStatsWidget } from './RdpStatsWidget';
import { RdpIndicatorsWidget } from './RdpIndicatorsWidget';
import { RdpStandardisationWidget } from './RdpStandardisationWidget';

export interface WidgetProps {
  project: Project;
  instance: WidgetInstance;
}

/** Correspondance id → composant de rendu du widget. */
export const WIDGET_COMPONENTS: Record<WidgetId, FC<WidgetProps>> = {
  kpis: KpisWidget,
  delays: DelaysWidget,
  upcoming: UpcomingWidget,
  risks: RisksWidget,
  'team-load': TeamLoadWidget,
  'status-breakdown': StatusBreakdownWidget,
  'rdp-phase': RdpPhaseWidget,
  'rdp-subject': RdpSubjectWidget,
  'rdp-stats': RdpStatsWidget,
  'rdp-indicators': RdpIndicatorsWidget,
  'rdp-standardisation': RdpStandardisationWidget,
};
