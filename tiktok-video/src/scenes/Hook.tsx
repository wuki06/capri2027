import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {NeonCanvas} from '../NeonCanvas';
import {drawChaos, useChaosData} from '../chaos';
import {FPS, TL, scene, wordAt} from '../timeline';
import {C, FONT, NeonText, Pill, glow, useT} from '../ui';
import {SceneFrame, shake} from './common';

export const PX = 540;
export const PY = 760;
export const L = 250;

export const Hook: React.FC = () => {
  const t = useT();
  const data = useChaosData();
  const ev = TL.events;
  const glitch = t >= ev.glitch && t < ev.glitch + 0.75;
  // Während des Glitches: Blick in die Zukunft (Sim-Zeit 17 s)
  const simT = glitch ? 17 + (t - ev.glitch) : t - ev.hookRelease;
  const sh = shake(t, ev.glitch, 26, 0.75);
  const n1000 = Math.round(interpolate(t, [wordAt('h1', '1000'), wordAt('h1', '1000') + 0.7], [0, 1000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const deltaAt = wordAt('h2', 'Milliardstel');
  const typed = '0,000000001°'.slice(0, Math.max(0, Math.floor((t - deltaAt) * 22)));
  const end = scene('hook').end;
  return (
    <SceneFrame id="hook" zoom={0.06}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`, filter: glitch ? `saturate(1.8) contrast(1.2)` : undefined}}>
        {data && (
          <NeonCanvas
            bloom={1.15}
            draw={(ctx) => drawChaos(ctx, data, simT * FPS, {px: PX, py: PY, L, intensity: 1})}
          />
        )}
        {glitch && (
          <>
            <AbsoluteFill style={{background: `rgba(255,0,60,${0.08 + 0.06 * Math.sin(t * 80)})`, mixBlendMode: 'screen'}} />
            <AbsoluteFill
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 7px)',
                transform: `translateY(${(t * 900) % 7}px)`,
              }}
            />
          </>
        )}
      </AbsoluteFill>
      {glitch && <Pill color={C.red} at={ev.glitch} top={300} size={40}>▶▶ IN 17 SEKUNDEN</Pill>}
      {!glitch && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 150,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 150,
              color: '#fff',
              letterSpacing: 4,
              textShadow: glow(C.cyan, 1.2),
              opacity: t > wordAt('h1', '1000') - 0.05 ? 1 : 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {n1000.toLocaleString('de-DE')}
            <div style={{fontSize: 46, letterSpacing: 18, marginTop: -6, textShadow: glow(C.magenta)}}>DOPPELPENDEL</div>
          </div>
          {t > deltaAt && (
            <div
              style={{
                position: 'absolute',
                top: 1180,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 52,
                color: C.cyan,
                textShadow: glow(C.cyan, 0.6),
                fontVariantNumeric: 'tabular-nums',
                opacity: interpolate(t, [end - 0.6, end], [1, 0], {extrapolateLeft: 'clamp'}),
              }}
            >
              Δθ = {typed}
              {Math.floor(t * 3) % 2 === 0 ? '▍' : ' '}
            </div>
          )}
        </>
      )}
    </SceneFrame>
  );
};
