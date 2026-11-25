import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {TL} from './timeline';
import {tips} from './draw';

let cache: Float32Array | null = null;
let promise: Promise<Float32Array> | null = null;

/** Lädt die vorberechnete RK4-Simulation der 1000 Pendel (Float32: frame × pendel × [θ1, θ2]) */
export const useChaosData = (): Float32Array | null => {
  const [data, setData] = useState<Float32Array | null>(cache);
  const [handle] = useState(() => (cache ? null : delayRender('Lade Simulation')));
  useEffect(() => {
    if (cache) return;
    promise ??= fetch(staticFile('sim/chaos1000.bin'))
      .then((r) => r.arrayBuffer())
      .then((b) => (cache = new Float32Array(b)));
    promise.then((d) => {
      setData(d);
      if (handle !== null) continueRender(handle);
    });
  }, [handle]);
  return data;
};

const N = TL.chaos.n;
const BUCKETS = 60;
const hueOf = (b: number) => (185 + (330 * b) / BUCKETS) % 360;

export type ChaosOpts = {
  px: number;
  py: number;
  L: number;
  intensity?: number;
  trail?: number;
  freezeAt?: number;
};

/** Spreizung der Pendelspitzen in Pixeln (für automatische Helligkeit) */
export const spreadAt = (data: Float32Array, f: number, L: number) => {
  let sx = 0,
    sy = 0,
    sxx = 0,
    syy = 0,
    c = 0;
  for (let i = 0; i < N; i += 10) {
    const o = (f * N + i) * 2;
    const [, b] = tips(data[o], data[o + 1], 0, 0, L, L);
    sx += b.x;
    sy += b.y;
    sxx += b.x * b.x;
    syy += b.y * b.y;
    c++;
  }
  return Math.sqrt(Math.max(0, sxx / c - (sx / c) ** 2 + syy / c - (sy / c) ** 2));
};

export const drawChaos = (
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  simFrame: number,
  o: ChaosOpts,
) => {
  const f = Math.max(0, Math.min(TL.chaos.frames - 1, Math.floor(simFrame)));
  const spread = spreadAt(data, f, o.L);
  const s = Math.min(1, spread / 260);
  const intensity = o.intensity ?? 1;
  const trailLen = s > 0.015 ? (o.trail ?? 9) : 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const per = N / BUCKETS;

  // Spuren der Spitzen (Bewegungsunschärfe)
  if (trailLen > 0) {
    ctx.lineWidth = 2.2;
    for (let b = 0; b < BUCKETS; b++) {
      ctx.strokeStyle = `hsl(${hueOf(b)}, 100%, 60%)`;
      ctx.globalAlpha = (0.05 + 0.28 * s) * intensity;
      ctx.beginPath();
      for (let i = Math.floor(b * per); i < Math.floor((b + 1) * per); i++) {
        let first = true;
        for (let k = trailLen; k >= 0; k--) {
          const ff = Math.max(0, f - k);
          const off = (ff * N + i) * 2;
          const [, p] = tips(data[off], data[off + 1], o.px, o.py, o.L, o.L);
          if (first) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
          first = false;
        }
      }
      ctx.stroke();
    }
  }

  // Stäbe
  ctx.lineWidth = 3.4 - 1.4 * s;
  for (let b = 0; b < BUCKETS; b++) {
    ctx.strokeStyle = `hsl(${hueOf(b)}, 100%, ${62 - 6 * s}%)`;
    ctx.globalAlpha = (0.022 + 0.2 * s) * intensity;
    ctx.beginPath();
    for (let i = Math.floor(b * per); i < Math.floor((b + 1) * per); i++) {
      const off = (f * N + i) * 2;
      const [a, p] = tips(data[off], data[off + 1], o.px, o.py, o.L, o.L);
      ctx.moveTo(o.px, o.py);
      ctx.lineTo(a.x, a.y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // Massen
  for (let b = 0; b < BUCKETS; b++) {
    ctx.fillStyle = `hsl(${hueOf(b)}, 100%, 70%)`;
    ctx.globalAlpha = (0.04 + 0.6 * s) * intensity;
    for (let i = Math.floor(b * per); i < Math.floor((b + 1) * per); i++) {
      const off = (f * N + i) * 2;
      const [a, p] = tips(data[off], data[off + 1], o.px, o.py, o.L, o.L);
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      ctx.fillRect(a.x - 2, a.y - 2, 4, 4);
    }
  }
  ctx.restore();

  // "Hero"-Pendel: solange alle 1000 deckungsgleich sind, leuchten sie wie ein einziges
  const hero = Math.max(0, 1 - s / 0.3);
  if (hero > 0) {
    const off = (f * N + Math.floor(N / 2)) * 2;
    const [a, p] = tips(data[off], data[off + 1], o.px, o.py, o.L, o.L);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [w, col, al] of [
      [26, '#5f7dff', 0.25],
      [14, '#b48cff', 0.45],
      [7, '#ffffff', 0.9],
    ] as const) {
      ctx.globalAlpha = al * hero * intensity;
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(o.px, o.py);
      ctx.lineTo(a.x, a.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    for (const [pt, r] of [
      [a, 16],
      [p, 22],
    ] as const) {
      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 3);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, '#c9a6ffcc');
      g.addColorStop(1, '#6a5cff00');
      ctx.globalAlpha = hero * intensity;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Aufhängung
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(o.px, o.py, 0, o.px, o.py, 30);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#ffffff00');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(o.px, o.py, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return {spread, s};
};
