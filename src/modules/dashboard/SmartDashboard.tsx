'use client';

import { useCurrentProject } from '@/lib/store';
import { DashboardPage } from './DashboardPage';
import { DashboardRdpPage } from '@/modules/rdp/DashboardRdpPage';

export function SmartDashboard() {
  const project = useCurrentProject();
  if (project?.projectType === 'rdp') return <DashboardRdpPage />;
  return <DashboardPage />;
}
