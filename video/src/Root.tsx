import { Composition } from 'remotion';
import { Film } from './Film';
import { FPS, TOTAL } from './timeline';

/** Composition Remotion — 60 fps, 1920×1080, ~48 s. */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ProjetEntan"
      component={Film}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
