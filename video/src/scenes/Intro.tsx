import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

/**
 * Scène d'intro — le logo Projet Entan.
 * Entrée du sigle en ressort + léger flip 3D, mot-symbole qui monte,
 * baseline en lettres espacées, halo qui respire. Tout en frame-perfect.
 */
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Sigle : ressort d'apparition (scale + flip Y) puis stable.
  const markSpring = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const markScale = interpolate(markSpring, [0, 1], [0.6, 1]);
  const markRotateY = interpolate(markSpring, [0, 1], [80, 0]);

  // Mot-symbole : monte et se resserre, démarre à 14 frames.
  const wordSpring = spring({ frame: frame - 14, fps, config: { damping: 18, mass: 0.7 } });
  const wordY = interpolate(wordSpring, [0, 1], [40, 0]);
  const wordOpacity = interpolate(frame, [14, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Baseline : fondu + resserrement du letter-spacing.
  const tagOpacity = interpolate(frame, [34, 50], [0, 1], { extrapolateRight: 'clamp' });
  const tagSpacing = interpolate(frame, [34, 56], [16, 6], { extrapolateRight: 'clamp' });

  // Halo qui respire.
  const haloScale = 1 + Math.sin(frame / 22) * 0.06;
  const haloOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Reflet lumineux qui traverse le sigle une fois.
  const shine = interpolate(frame, [26, 46], [-120, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, rgba(217,119,87,0.18), transparent 70%)`,
          opacity: haloOpacity,
          transform: `scale(${haloScale})`,
          filter: 'blur(40px)',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 156,
            height: 156,
            borderRadius: 38,
            background: theme.accent,
            color: '#fff',
            fontFamily: theme.sans,
            fontSize: 66,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 40px',
            position: 'relative',
            overflow: 'hidden',
            transform: `perspective(1200px) rotateY(${markRotateY}deg) scale(${markScale})`,
            boxShadow: '0 40px 120px rgba(217,119,87,0.32)',
          }}
        >
          PE
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 90,
              left: shine,
              background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)',
              transform: 'skewX(-18deg)',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: theme.serif,
            fontSize: 88,
            fontWeight: 600,
            color: theme.text,
            letterSpacing: -2,
            opacity: wordOpacity,
            transform: `translateY(${wordY}px)`,
          }}
        >
          Projet Entan
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: theme.sans,
            fontSize: 22,
            fontWeight: 500,
            textTransform: 'uppercase',
            color: theme.accent,
            letterSpacing: tagSpacing,
            opacity: tagOpacity,
          }}
        >
          En temps réel
        </div>
      </div>
    </AbsoluteFill>
  );
};
