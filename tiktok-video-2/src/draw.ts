// Zeichen-Helfer für Pendel (Canvas 2D)

export type Pt = {x: number; y: number};

export const tips = (
  t1: number,
  t2: number,
  px: number,
  py: number,
  L1: number,
  L2: number,
): [Pt, Pt] => {
  const x1 = px + L1 * Math.sin(t1);
  const y1 = py + L1 * Math.cos(t1);
  return [
    {x: x1, y: y1},
    {x: x1 + L2 * Math.sin(t2), y: y1 + L2 * Math.cos(t2)},
  ];
};

export const glowDot = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  core = '#ffffff',
) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color + '88');
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
};

/** Einzelnes "massives" Neon-Pendel: Stäbe, Gelenke, Massen */
export const drawPendulum = (
  ctx: CanvasRenderingContext2D,
  t1: number,
  t2: number,
  o: {px: number; py: number; L1: number; L2: number; rod: string; m1: string; m2: string; width?: number; alpha?: number},
) => {
  const [a, b] = tips(t1, t2, o.px, o.py, o.L1, o.L2);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // weicher Außenschein
  ctx.strokeStyle = o.rod + '55';
  ctx.lineWidth = (o.width ?? 7) * 3;
  ctx.beginPath();
  ctx.moveTo(o.px, o.py);
  ctx.lineTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = o.rod;
  ctx.lineWidth = o.width ?? 7;
  ctx.stroke();
  ctx.strokeStyle = '#ffffffcc';
  ctx.lineWidth = (o.width ?? 7) * 0.3;
  ctx.stroke();
  // Aufhängung
  glowDot(ctx, o.px, o.py, 9, '#ffffff', '#ffffff');
  glowDot(ctx, a.x, a.y, 17, o.m1);
  glowDot(ctx, b.x, b.y, 22, o.m2);
  ctx.restore();
  return [a, b] as const;
};

/** Leuchtspur mit Farbverlauf und Ausblendung */
export const drawTrail = (
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  hueAt: (i: number, n: number) => number,
  width = 5,
) => {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';
  const n = pts.length;
  for (let i = 1; i < n; i++) {
    const f = i / n;
    ctx.strokeStyle = `hsla(${hueAt(i, n)}, 100%, ${50 + 15 * f}%, ${Math.pow(f, 1.6)})`;
    ctx.lineWidth = width * (0.25 + 0.75 * f);
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
    ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  ctx.restore();
};

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
