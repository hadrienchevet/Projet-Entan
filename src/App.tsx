import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { Onboarding } from './modules/onboarding/Onboarding';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { RaciPage } from './modules/raci/RaciPage';
import { AmdecPage } from './modules/amdec/AmdecPage';
import { ActionsPage } from './modules/actions/ActionsPage';
import { PlanningPage } from './modules/planning/PlanningPage';
import { HelpPage } from './modules/onboarding/HelpPage';

export default function App() {
  const projects = useStore((s) => s.projects);
  const loading = useStore((s) => s.loading);
  const loadProjects = useStore((s) => s.loadProjects);
  const hasProjects = projects.length > 0;

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (loading && !hasProjects) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Chargement de vos projets...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={hasProjects ? <DashboardPage /> : <Onboarding />} />
        <Route path="raci" element={<RaciPage />} />
        <Route path="amdec" element={<AmdecPage />} />
        <Route path="actions" element={<ActionsPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
