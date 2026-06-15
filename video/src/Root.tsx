import { Composition } from 'remotion';
import { Film, TOTAL_FRAMES } from './Film';

/** Enregistrement des compositions Remotion. 30 fps, 1920×1080. */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ProjetEntan"
      component={Film}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
