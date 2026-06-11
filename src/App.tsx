import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { Onboarding } from './modules/onboarding/Onboarding';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { RaciPage } from './modules/raci/RaciPage';
import { AmdecPage } from './modules/amdec/AmdecPage';
import { ActionsPage } from './modules/actions/ActionsPage';
import { PlanningPage } from './modules/planning/PlanningPage';

export default function App() {
  const hasProjects = useStore((s) => s.projects.length > 0);

  if (!hasProjects) {
    return (
      <div className="app">
        <main className="main">
          <Onboarding />
        </main>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="raci" element={<RaciPage />} />
        <Route path="amdec" element={<AmdecPage />} />
        <Route path="actions" element={<ActionsPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
