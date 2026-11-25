import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {NeonCanvas} from '../NeonCanvas';
import {drawPendulum, drawTrail, tips, Pt} from '../draw';
import {FPS, TL, scene, wordAt} from '../timeline';
import {C, FONT, Pill, glow, sci, useT} from '../ui';
import {SceneFrame, shake} from './common';

const PX = 540;
const PY = 800;
const L = 235;
const D = TL.twins.data; // [frame][2 pendel][θ1, θ2]
const frames = D.length / 4;
const get = (f: number, i: number) => {
  const k = Math.max(0, Math.min(frames - 1, Math.floor(f)));
  return [D[(k * 2 + i) * 2], D[(k * 2 + i) * 2 + 1]] as const;
};
const DELTA0 = 1e-6;
/** Abweichung der Zustände in Grad */
const diffDeg = (f: number) => {
  const [a1, a2] = get(f, 0);
  const [b1, b2] = get(f, 1);
  const w = (x: number) => Math.atan2(Math.sin(x), Math.cos(x));
  return Math.max(DELTA0 * 0.999, (Math.hypot(w(a1 - b1), w(a2 - b2)) * 180) / Math.PI);
};

export const Twins: React.FC = () => {
  const t = useT();
  const sc = scene('twins');
  const ev = TL.events;
  const simF = Math.max(0, (t - ev.twinRelease) * FPS);
  const d = diffDeg(simF);
  const doublings = Math.max(0, Math.log2(d / DELTA0));
  const split = t >= ev.twinSplit;
  const sh = shake(t, ev.twinSplit, 22, 0.6);
  const hudIn = interpolate(t, [sc.start + 0.3, sc.start + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const danger = Math.min(1, doublings / 20);
  const hudColor = `hsl(${interpolate(danger, [0, 1], [150, 350])}, 100%, 60%)`;

  const draw = (ctx: CanvasRenderingContext2D) => {
    const cols = [C.cyan, C.magenta];
    for (let i = 0; i < 2; i++) {
      const pts: Pt[] = [];
      for (let k = 50; k >= 0; k--) {
        const f = simF - k;
        if (f < 0) continue;
        const [a, b] = get(f, i);
        pts.push(tips(a, b, PX, PY, L, L)[1]);
      }
      drawTrail(ctx, pts, () => (i === 0 ? 185 : 315), 6);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      const [a, b] = get(simF, i);
      drawPendulum(ctx, a, b, {px: PX, py: PY, L1: L, L2: L, rod: cols[i], m1: cols[i], m2: cols[i], width: 7, alpha: 0.85});
    }
    ctx.restore();

    // Mini-Graph: log10(Abweichung) über die Zeit
    const gx = 120;
    const gy = 395;
    const gw = 840;
    const gh = 150;
    ctx.save();
    ctx.globalAlpha = hudIn;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('log Abweichung', gx + 10, gy + 28);
    const span = ev.twinSplit - ev.twinRelease + 2;
    ctx.beginPath();
    for (let f = 0; f <= simF; f += 2) {
      const x = gx + (f / FPS / span) * gw;
      const y = gy + gh - ((Math.log10(diffDeg(f)) + 6.2) / 8.6) * gh;
      if (f === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, Math.max(gy, y));
    }
    ctx.strokeStyle = hudColor;
    ctx.shadowColor = hudColor;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  };

  return (
    <SceneFrame id="twins" zoom={0.03}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <NeonCanvas draw={draw} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          opacity: hudIn,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div style={{fontSize: 30, fontWeight: 700, letterSpacing: 10, color: 'rgba(255,255,255,0.7)'}}>ABWEICHUNG</div>
        <div style={{fontSize: 104, fontWeight: 900, color: '#fff', textShadow: glow(hudColor, 1.1), marginTop: 2}}>{sci(d, 2)}°</div>
        <div style={{fontSize: 34, fontWeight: 700, color: hudColor, textShadow: glow(hudColor, 0.5), marginTop: 6, letterSpacing: 2}}>
          {t >= wordAt('t3', 'verdoppelt') - 0.3 ? `× 2 × 2 × 2 …  ${Math.floor(doublings)} Verdopplungen` : 'Startwinkel-Differenz: 0,000001°'}
        </div>
      </div>
      {split && <Pill color={C.red} at={ev.twinSplit} top={1185} size={46}>⚡ GETRENNT</Pill>}
      {split && (
        <AbsoluteFill
          style={{
            background: '#fff',
            opacity: interpolate(t, [ev.twinSplit, ev.twinSplit + 0.25], [0.55, 0], {extrapolateRight: 'clamp'}),
            mixBlendMode: 'screen',
          }}
        />
      )}
      {t < ev.twinRelease && t > sc.start + 0.2 && (
        <Pill color={C.yellow} at={sc.start + 0.2} top={1185} size={36}>BEREIT …</Pill>
      )}
    </SceneFrame>
  );
};
