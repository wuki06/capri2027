import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {NeonCanvas} from '../NeonCanvas';
import {drawChaos, useChaosData} from '../chaos';
import {FPS, TL, scene, wordAt} from '../timeline';
import {C, FONT, NeonText, glow, sup, useT} from '../ui';
import {SceneFrame, shake} from './common';
import {L, PX, PY} from './Hook';

export const Reveal: React.FC = () => {
  const t = useT();
  const data = useChaosData();
  const sc = scene('reveal');
  const ev = TL.events;
  const simT = Math.max(0, t - ev.revealRelease);
  const boom = ev.revealBoom;
  // Kamera: langsames Heranfahren bis zum Boom, dann Rückstoß
  const push = t < boom
    ? interpolate(t, [sc.start, boom], [1, 1.16], {extrapolateLeft: 'clamp'})
    : interpolate(t, [boom, boom + 0.5], [1.22, 1.0], {extrapolateRight: 'clamp'});
  const sh = shake(t, boom, 34, 0.9);
  const flash = interpolate(t, [boom - 0.05, boom, boom + 0.45], [0, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tension = interpolate(t, [ev.revealRiser, boom], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <SceneFrame id="reveal" zoom={0}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px) scale(${push})`, transformOrigin: `${PX}px ${PY + 120}px`}}>
        {data && (
          <NeonCanvas
            bloom={1.1 + 0.4 * tension}
            draw={(ctx) => drawChaos(ctx, data, simT * FPS, {px: PX, py: PY, L, intensity: t > boom ? 1.25 : 1, trail: 12})}
          />
        )}
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontVariantNumeric: 'tabular-nums'}}>
        <div style={{fontSize: 44, fontWeight: 800, letterSpacing: 12, color: '#fff', textShadow: glow(C.cyan, 0.7)}}>1000 PENDEL · Δθ = 10{sup(-9)}°</div>
        <div style={{fontSize: 92, fontWeight: 900, color: '#fff', marginTop: 6, textShadow: glow(t > boom ? C.red : C.violet, 1)}}>
          t = {simT.toFixed(2).replace('.', ',')} s
        </div>
      </div>
      <NeonText at={boom} until={wordAt('r3', 'Chaos') + 0.2} top={1170} size={104} color={C.red} spacing={10}>
        CHAOS
      </NeonText>
      {/* Vignette, die sich vor dem Boom zuzieht */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, transparent ${60 - 25 * tension}%, rgba(0,0,0,${0.5 * tension}) 100%)`}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
    </SceneFrame>
  );
};
