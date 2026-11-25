import React from 'react';
import {interpolate} from 'remotion';
import {NeonCanvas} from '../NeonCanvas';
import {drawPendulum, drawTrail, tips, Pt} from '../draw';
import {FPS, TL, scene, wordAt} from '../timeline';
import {C, FONT, NeonText, Pill, glow, useT} from '../ui';
import {SceneFrame} from './common';

const PX = 540;
const PY = 740;
const L = 255;
const D = TL.single.data;
const frames = D.length / 2;
const ang = (f: number) => {
  const i = Math.max(0, Math.min(frames - 1, Math.floor(f)));
  return [D[i * 2], D[i * 2 + 1]] as const;
};

const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, alpha: number) => {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.font = `800 40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 34;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 30, w, 60, 30);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillText(text, x, y + 2);
  ctx.restore();
};

export const Single: React.FC = () => {
  const t = useT();
  const sc = scene('single');
  const simF = (t - sc.start) * FPS;
  const tStab = wordAt('s1', 'Stäbe');
  const tGel = wordAt('s1', 'Gelenke');
  const tG = wordAt('s1', 'Schwerkraft');
  const tNewton = wordAt('s2', 'Newton');
  const tMin = wordAt('s3', 'Minute');

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Spur der unteren Masse (letzte 3,5 s, ab 60 s-Hinweis länger)
    const len = Math.round(FPS * (t > tMin ? 7 : 3.5));
    const pts: Pt[] = [];
    for (let k = len; k >= 0; k--) {
      const f = simF - k;
      if (f < 0) continue;
      const [a, b] = ang(f);
      pts.push(tips(a, b, PX, PY, L, L)[1]);
    }
    drawTrail(ctx, pts, (i, n) => (280 - (i / n) * 120 + t * 20) % 360, 7);

    const [t1, t2] = ang(simF);
    const [a, b] = drawPendulum(ctx, t1, t2, {px: PX, py: PY, L1: L, L2: L, rod: C.cyan, m1: C.magenta, m2: C.yellow, width: 8});

    // Beschriftungen synchron zur Sprache
    const fade = (at: number, dur = 2.6) => interpolate(t, [at, at + 0.2, at + dur, at + dur + 0.3], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    label(ctx, 'Stab 1', (PX + a.x) / 2, (PY + a.y) / 2 - 50, C.cyan, fade(tStab));
    label(ctx, 'Stab 2', (a.x + b.x) / 2, (a.y + b.y) / 2 - 50, C.cyan, fade(tStab + 0.25));
    const gA = fade(tGel, 2.2);
    if (gA > 0) {
      ctx.save();
      ctx.globalAlpha = gA;
      for (const p of [{x: PX, y: PY}, a]) {
        const r = 34 + 14 * Math.sin((t - tGel) * 9);
        ctx.strokeStyle = C.lime;
        ctx.shadowColor = C.lime;
        ctx.shadowBlur = 16;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    // Schwerkraft-Pfeil
    const gv = fade(tG, 3.4);
    if (gv > 0) {
      ctx.save();
      ctx.globalAlpha = gv;
      const x = 930;
      const y0 = 480;
      const y1 = 480 + 260 * Math.min(1, (t - tG) * 3);
      ctx.strokeStyle = C.orange;
      ctx.fillStyle = C.orange;
      ctx.shadowColor = C.orange;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 26, y1 - 10);
      ctx.lineTo(x + 26, y1 - 10);
      ctx.lineTo(x, y1 + 30);
      ctx.closePath();
      ctx.fill();
      ctx.font = `900 56px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('g', x, y0 - 50);
      ctx.font = `700 30px ${FONT}`;
      ctx.fillText('9,81 m/s²', x, y1 + 75);
      ctx.restore();
    }
  };

  return (
    <SceneFrame id="single" zoom={0.05}>
      <NeonCanvas draw={draw} />
      <NeonText at={sc.start + 0.25} until={wordAt('s2', 'Kein')} top={170} size={92} color={C.cyan}>
        DOPPELPENDEL
        <div style={{fontSize: 34, fontWeight: 600, letterSpacing: 10, marginTop: 14, textShadow: glow(C.magenta, 0.6)}}>2 STÄBE · 2 GELENKE · 1 KRAFT</div>
      </NeonText>
      <Pill color={C.red} at={wordAt('s2', 'Zufall')} until={tNewton - 0.1} top={190}>✕ ZUFALL</Pill>
      <Pill color={C.red} at={wordAt('s2', 'Motor')} until={tNewton - 0.1} top={300}>✕ MOTOR</Pill>
      <NeonText at={tNewton - 0.05} until={wordAt('s3', 'trotzdem')} top={150} size={110} color={C.lime}>
        F = m · a
        <div style={{fontSize: 30, fontWeight: 600, letterSpacing: 3, marginTop: 18, color: '#d8ffd0', textShadow: glow(C.lime, 0.4)}}>
          Lagrange-Gleichungen · Runge-Kutta 4
          <br />
          720 Rechenschritte pro Sekunde
        </div>
      </NeonText>
      <NeonText at={tMin - 0.1} until={sc.end} top={170} size={120} color={C.magenta}>
        t + 60 s = <span style={{color: C.yellow, textShadow: glow(C.yellow)}}>{['?', '??', '???'][Math.floor(t * 4) % 3]}</span>
      </NeonText>
    </SceneFrame>
  );
};
