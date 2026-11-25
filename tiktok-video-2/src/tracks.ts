import {TL} from './timeline';
import {C} from './ui';

export const KEYS = ['A', 'B', 'C', 'D'] as const;
export type Key = (typeof KEYS)[number];
export const COL: Record<Key, string> = {A: C.cyan, B: C.lime, C: C.magenta, D: C.orange};
export const LEN: Record<Key, string> = {A: '1,86 m', B: '1,97 m', C: '2,00 m', D: '2,52 m'};

export const OX = 110;
export const OY = 470;
export const S = 860 / TL.geo.W;
export const px = (x: number) => OX + x * S;
export const py = (y: number) => OY + y * S;
export const END = {x: px(TL.geo.W), y: py(TL.geo.H)};

/** Position einer Kugel zur Sim-Zeit (lineare Interpolation der 1-ms-Abtastung) */
export const posAt = (xs: number[], ys: number[], sim: number) => {
  const f = Math.max(0, sim) / TL.geo.sample;
  const i = Math.min(xs.length - 2, Math.floor(f));
  const k = Math.min(1, f - i);
  return {x: px(xs[i] + (xs[i + 1] - xs[i]) * k), y: py(ys[i] + (ys[i + 1] - ys[i]) * k)};
};
export const ballAt = (k: Key, sim: number) => posAt(TL.race[k].xs, TL.race[k].ys, sim);

export const drawTrack = (
  ctx: CanvasRenderingContext2D,
  k: Key,
  o: {alpha?: number; progress?: number; width?: number; color?: string} = {},
) => {
  const p = TL.race[k].path;
  const n = p.length / 2;
  const upto = Math.max(1, Math.floor(n * (o.progress ?? 1)));
  const col = o.color ?? COL[k];
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < upto; i++) {
    const x = px(p[i * 2]);
    const y = py(p[i * 2 + 1]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  const w = o.width ?? 6;
  ctx.strokeStyle = col + '44';
  ctx.lineWidth = w * 4;
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.strokeStyle = '#ffffffaa';
  ctx.lineWidth = w * 0.3;
  ctx.stroke();
  ctx.restore();
};

/** Punkt auf der Bahn bei Anteil u (für Beschriftungen) */
export const trackPoint = (k: Key, u: number) => {
  const p = TL.race[k].path;
  const i = Math.min(p.length / 2 - 1, Math.floor((p.length / 2) * u));
  return {x: px(p[i * 2]), y: py(p[i * 2 + 1])};
};

export const drawBall = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  letter?: string,
  r = 24,
  alpha = 1,
) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
  g.addColorStop(0, color + 'cc');
  g.addColorStop(0.4, color + '55');
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
  ctx.fill();
  const b = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  b.addColorStop(0, '#ffffff');
  b.addColorStop(0.35, color);
  b.addColorStop(1, '#000000');
  ctx.fillStyle = b;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (letter) {
    ctx.fillStyle = '#000';
    ctx.font = `900 ${r * 1.05}px 'Inter Display', 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x, y + 1);
  }
  ctx.restore();
};

export const drawFinish = (ctx: CanvasRenderingContext2D, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = END.x + 30;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#ffffff' : '#222';
      ctx.fillRect(x + j * 14, END.y - 80 + i * 14, 14, 14);
    }
  }
  ctx.font = `800 30px 'Inter Display', 'Inter', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 12;
  ctx.fillText('ZIEL', x + 14, END.y - 100);
  ctx.restore();
};
