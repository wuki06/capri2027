import React from 'react';
import {interpolate} from 'remotion';
import {NeonCanvas} from '../NeonCanvas';
import {scene, wordAt} from '../timeline';
import {C, FONT, NeonText, glow, useT} from '../ui';
import {SceneFrame} from './common';

// Lorenz-System (Wettermodell von Edward Lorenz, 1963), RK4-integriert
const SIG = 10;
const RHO = 28;
const BETA = 8 / 3;
const lorenz = (x0: number, steps: number, dt: number) => {
  const out = new Float32Array(steps * 3);
  let x = x0,
    y = 1,
    z = 1;
  const f = (x: number, y: number, z: number) => [SIG * (y - x), x * (RHO - z) - y, x * y - BETA * z];
  for (let i = 0; i < steps; i++) {
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
    const k1 = f(x, y, z);
    const k2 = f(x + (dt / 2) * k1[0], y + (dt / 2) * k1[1], z + (dt / 2) * k1[2]);
    const k3 = f(x + (dt / 2) * k2[0], y + (dt / 2) * k2[1], z + (dt / 2) * k2[2]);
    const k4 = f(x + dt * k3[0], y + dt * k3[1], z + dt * k3[2]);
    x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    y += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    z += (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
  }
  return out;
};
const STEPS = 9000;
const A = lorenz(1, STEPS, 0.005);
const B = lorenz(1.00001, STEPS, 0.005);

const project = (arr: Float32Array, i: number, rot: number) => {
  const x = arr[i * 3];
  const y = arr[i * 3 + 1];
  const z = arr[i * 3 + 2] - 25;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const xr = x * c - y * s;
  const yr = x * s + y * c;
  const depth = 1 / (1 + yr / 160);
  return {x: 540 + xr * 19 * depth, y: 790 - z * 19 * depth, d: depth};
};

export const Meaning: React.FC = () => {
  const t = useT();
  const sc = scene('meaning');
  const p = (t - sc.start) / (sc.end - sc.start);
  const shown = Math.floor(interpolate(p, [0, 0.85], [400, STEPS], {extrapolateRight: 'clamp'}));
  const rot = 0.6 + t * 0.35;

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const [arr, hue] of [
      [A, 188],
      [B, 318],
    ] as const) {
      const seg = 60;
      for (let s0 = 0; s0 < shown; s0 += seg) {
        const age = (shown - s0) / shown;
        ctx.strokeStyle = `hsla(${hue}, 100%, 62%, ${0.25 + 0.7 * Math.pow(1 - age, 2)})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = s0; i <= Math.min(shown - 1, s0 + seg); i++) {
          const q = project(arr, i, rot);
          if (i === s0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
      }
      const head = project(arr, shown - 1, rot);
      const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 28);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, `hsla(${hue},100%,60%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const tW = wordAt('m2', 'Wetterbericht');
  const tWeeks = wordAt('m2', 'Wochen');
  const days = Math.floor(interpolate(t, [tW, tWeeks + 0.3], [0, 14], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const tTrotz = wordAt('m3', 'trotzdem');

  return (
    <SceneFrame id="meaning" zoom={0.05}>
      <NeonCanvas draw={draw} />
      <NeonText at={wordAt('m1', 'Schmetterlings')} until={tW - 0.1} top={170} size={78} color={C.magenta} spacing={3}>
        SCHMETTERLINGS-
        <br />
        EFFEKT
        <div style={{fontSize: 30, fontWeight: 600, letterSpacing: 6, marginTop: 16, textShadow: glow(C.cyan, 0.5)}}>LORENZ-ATTRAKTOR · 1963</div>
      </NeonText>
      {t >= tW - 0.05 && t < wordAt('m3', 'Universum') && (
        <div style={{position: 'absolute', top: 175, left: 80, right: 80, fontFamily: FONT, textAlign: 'center', opacity: interpolate(t, [tW - 0.05, tW + 0.2], [0, 1], {extrapolateRight: 'clamp'})}}>
          <div style={{fontSize: 34, fontWeight: 800, letterSpacing: 10, color: '#fff', textShadow: glow(C.lime, 0.6)}}>WETTERVORHERSAGE</div>
          <div style={{display: 'flex', gap: 8, marginTop: 22, justifyContent: 'center'}}>
            {Array.from({length: 18}, (_, i) => {
              const on = i < days;
              const beyond = i >= 14;
              const col = beyond ? C.red : C.lime;
              return (
                <div
                  key={i}
                  style={{
                    width: 40,
                    height: 70,
                    borderRadius: 8,
                    border: `2px solid ${col}${beyond ? '88' : 'cc'}`,
                    background: on ? col : beyond && days >= 14 ? `rgba(255,59,92,${0.15 + 0.3 * Math.abs(Math.sin(t * 13 + i * 2.1))})` : 'transparent',
                    boxShadow: on ? `0 0 14px ${col}` : undefined,
                  }}
                />
              );
            })}
          </div>
          <div style={{fontSize: 40, fontWeight: 900, color: days >= 14 ? C.red : C.lime, marginTop: 18, textShadow: glow(days >= 14 ? C.red : C.lime, 0.6)}}>
            {days >= 14 ? 'GRENZE ≈ 14 TAGE' : `Tag ${days}`}
          </div>
        </div>
      )}
      <NeonText at={wordAt('m3', 'Regeln')} until={sc.end} top={190} size={66} color={C.cyan} spacing={2}>
        DETERMINISTISCH
      </NeonText>
      <NeonText at={tTrotz} until={sc.end} top={275} size={70} color={C.red} spacing={2}>
        ≠
      </NeonText>
      <NeonText at={tTrotz + 0.35} until={sc.end} top={360} size={66} color={C.magenta} spacing={2}>
        VORHERSAGBAR
      </NeonText>
    </SceneFrame>
  );
};
