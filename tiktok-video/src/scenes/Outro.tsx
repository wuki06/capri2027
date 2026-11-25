import React from 'react';
import {interpolate} from 'remotion';
import {NeonCanvas} from '../NeonCanvas';
import {drawChaos, useChaosData} from '../chaos';
import {FPS, TL, scene, wordAt} from '../timeline';
import {C, NeonText, Pill, usePop, useT} from '../ui';
import {SceneFrame} from './common';
import {L, PX, PY} from './Hook';

const Bubble: React.FC<{at: number}> = ({at}) => {
  const t = useT();
  const p = usePop(at, 8);
  if (t < at) return null;
  const bob = Math.sin((t - at) * 6) * 8;
  return (
    <svg width={190} height={170} viewBox="0 0 190 170" style={{position: 'absolute', left: 445, top: 1150 + bob, transform: `scale(${p})`, filter: `drop-shadow(0 0 18px ${C.yellow})`}}>
      <path d="M20 15 H170 a12 12 0 0 1 12 12 V105 a12 12 0 0 1 -12 12 H85 L45 155 V117 H20 a12 12 0 0 1 -12 -12 V27 a12 12 0 0 1 12 -12Z" fill="rgba(0,0,0,0.6)" stroke={C.yellow} strokeWidth={7} />
      {[60, 95, 130].map((x, i) => (
        <circle key={x} cx={x} cy={66} r={10} fill={C.yellow} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 5 - i))} />
      ))}
    </svg>
  );
};

export const Outro: React.FC = () => {
  const t = useT();
  const data = useChaosData();
  const sc = scene('outro');
  const simT = t - TL.events.revealRelease;
  const dim = interpolate(t, [sc.start, sc.start + 1], [1, 0.55], {extrapolateRight: 'clamp'});
  return (
    <SceneFrame id="outro" zoom={0.04}>
      {data && <NeonCanvas bloom={0.9} draw={(ctx) => drawChaos(ctx, data, simT * FPS, {px: PX, py: PY + 60, L, intensity: dim, trail: 14})} />}
      <NeonText at={sc.start + 0.15} top={170} size={96} color={C.cyan}>
        HÄTTEST DU&apos;S
        <br />
        GEDACHT?
      </NeonText>
      <Bubble at={wordAt('c1', 'Kommentare')} />
      <Pill color={C.magenta} at={sc.end - 2.6} top={440} size={40}>FOLGE FÜR MEHR PHYSIK</Pill>
    </SceneFrame>
  );
};
