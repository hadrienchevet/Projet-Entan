'use client';

import { DashboardGrid } from './DashboardGrid';

/**
 * Le tableau de bord est désormais une grille modulable unique : elle gère
 * les deux types de projet (gestion / RDP) via le catalogue de widgets.
 */
export function SmartDashboard() {
  return <DashboardGrid />;
}
