import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Space} from './Space';
import {Hook} from './Hook';
import {ERP} from './ERP';
import {Web} from './Web';
import {Network} from './Network';
import {Reveal} from './Reveal';
import {FPS, clamp} from './lib';

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="1080" height="1920">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 47} />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // Hintergrund-Raum: stark im Hook, dezent dahinter, ruhig im Finale
  const spaceI = t < 3 ? clamp(t / 0.6) : t < 14 ? 0.35 : 0.25;
  return (
    <AbsoluteFill style={{background: '#030407'}}>
      {/* volumetrisches Licht / Nebel */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 25%, rgba(47,90,255,${0.16 + 0.05 * Math.sin(t)}), transparent 55%), radial-gradient(ellipse at 75% 75%, rgba(139,92,255,0.12), transparent 55%)`}} />
      <Space intensity={spaceI} warpAt={t < 3.2 ? 2.2 : 99} streak={t < 3.2 ? 1 : 0.4} />
      <Hook />
      <ERP />
      <Web />
      <Network />
      <Reveal />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.75) 100%)', pointerEvents: 'none'}} />
      <Grain />
      {/* Ein- und Ausblende aus Schwarz */}
      <AbsoluteFill style={{background: '#000', opacity: 1 - clamp(t / 0.25)}} />
    </AbsoluteFill>
  );
};

export const Video: React.FC<{thumb?: boolean}> = () => (
  <CameraMotionBlur shutterAngle={180} samples={3}>
    <Scene />
  </CameraMotionBlur>
);
