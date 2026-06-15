import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { theme } from './theme';
import { Intro } from './scenes/Intro';
import { Dashboard } from './scenes/Dashboard';
import { Amdec } from './scenes/Amdec';
import { Actions } from './scenes/Actions';
import { Collab } from './scenes/Collab';
import { Outro } from './scenes/Outro';

/**
 * Montage : 6 séquences reliées par des transitions (fondus + glissés
 * directionnels). Les durées sont en frames @30fps.
 * Les transitions se chevauchent, donc la durée totale = somme des séquences
 * moins la somme des transitions (voir TOTAL dans Root.tsx).
 */
const T = 18; // durée d'une transition (frames)

export const Film: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={95}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={165}>
          <Dashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Amdec />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={155}>
          <Actions />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Collab />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence durationInFrames={110}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/** Durée totale = 95+165+150+155+150+110 − 5×18 = 735 frames (24,5 s @30fps). */
export const TOTAL_FRAMES = 95 + 165 + 150 + 155 + 150 + 110 - 5 * T;
