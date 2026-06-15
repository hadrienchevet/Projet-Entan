import { AbsoluteFill } from 'remotion';
import { theme } from './theme';
import { ColdOpen } from './scenes/ColdOpen';
import { FinalLogo } from './scenes/FinalLogo';
import { Captions } from './scenes/Captions';
import { AppWindow } from './components/AppWindow';
import { DashboardM } from './modules/DashboardM';
import { Raci } from './modules/Raci';
import { AmdecM } from './modules/AmdecM';
import { ActionsM } from './modules/ActionsM';
import { Planning } from './modules/Planning';
import { CollabM } from './modules/CollabM';

/**
 * Film continu : pas de TransitionSeries. Le cold-open laisse place à la
 * fenêtre persistante (AppWindow) dans laquelle les modules se fondent par
 * frame absolue, pendant que le surlignage de la sidebar glisse et que la
 * caméra pousse lentement. Le logo final referme le bookend.
 * Tout consomme la frame GLOBALE (aucun sous-Sequence qui décale le temps).
 */
export const Film: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <ColdOpen />
      <AppWindow>
        <DashboardM />
        <Raci />
        <AmdecM />
        <ActionsM />
        <Planning />
        <CollabM />
      </AppWindow>
      <Captions />
      <FinalLogo />
    </AbsoluteFill>
  );
};
