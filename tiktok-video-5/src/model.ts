import raw from './timeline.json';

export type Word = {w: string; s: number; e: number};
export type Line = {id: string; scene: string; show: string; start: number; end: number; words: Word[]};
export const TL = raw as unknown as {
  fps: number;
  durationInFrames: number;
  total: number;
  lines: Line[];
  scenes: {id: string; start: number; end: number}[];
  events: Record<string, number>;
  result: {stay: number; swap: number; seed: number};
  balls: [number, number, number][];
  first: number[];
};
export const FPS = TL.fps;
export const ev = TL.events;
export const line = (id: string) => TL.lines.find((l) => l.id === id)!;
export const scene = (id: string) => TL.scenes.find((s) => s.id === id)!;
export const wordAt = (id: string, m: string) => line(id).words.find((w) => w.w.toLowerCase().includes(m.toLowerCase()))!.s;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x: number) => {
  const k = clamp(x);
  return k * k * (3 - 2 * k);
};
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- Türen
const openCurve = (t: number, at: number, dur = 0.7) => {
  const k = clamp((t - at) / dur);
  // leichtes Überschwingen wie eine echte Tür
  return smooth(k) * (1 + 0.06 * Math.sin(k * Math.PI));
};
export const doorAngles = (t: number): [number, number, number] => {
  const peek = t < ev.peekEnd + 0.8 ? openCurve(t, ev.peek - 0.1) - openCurve(t, ev.peekEnd) : 0;
  const d3 = openCurve(t, ev.open3);
  const explain = scene('explain').start;
  const back = t >= explain - 0.05 ? 1 : 0;
  const d1 = back ? openCurve(t, ev.open12) : 0;
  const d2 = back ? openCurve(t, ev.open12 + 0.7) : 0;
  const A = 1.75;
  return [Math.max(peek, d1) * A, Math.max(peek, d2) * A, Math.max(peek, t >= explain - 0.05 ? 1 : d3) * A];
};

// ---------------------------------------------------------------- Kugeln
export const TUBE_X = [29.32, 30.68];
export const TUBE_R = 0.5;
export const BALL_R = 0.052;
const PER = 38;
const LAYER = BALL_R * 2 * 0.8;
const GV = 14;
const DROP_Y = 3.1;
export const slotPos = (tube: number, k: number) => {
  const layer = Math.floor(k / PER);
  const j = k % PER;
  const rr = (TUBE_R - BALL_R * 1.1) * Math.sqrt((j + 0.5) / PER);
  const a = j * 2.39996 + layer * 0.9;
  return [TUBE_X[tube] + rr * Math.cos(a), 0.32 + BALL_R + layer * LAYER, rr * Math.sin(a)];
};
/** Position einer Kugel (fällt mit Schwerkraft, prallt gedämpft ab) */
export const ballPos = (t: number, tg: number, tube: number, k: number): number[] | null => {
  if (t < tg) return null;
  const [x, y, z] = slotPos(tube, k);
  const dt = t - tg;
  const fallT = Math.sqrt((2 * (DROP_Y - y)) / GV);
  if (dt < fallT) return [x, DROP_Y - 0.5 * GV * dt * dt, z];
  const b = dt - fallT;
  return [x, y + 0.07 * Math.exp(-7 * b) * Math.abs(Math.sin(b * 16)), z];
};
export const countsAt = (t: number) => {
  let s = 0;
  let w = 0;
  for (const [tg, tube] of TL.balls) {
    if (tg > t) break;
    if (tube === 0) s++;
    else w++;
  }
  return {stay: s, swap: w, games: s + w};
};
export const coverY = (t: number) => {
  // Abdeckung: fällt bei "decken", hebt sich beim Aufdecken
  const down = smooth((t - ev.cover) / 0.5);
  const up = smooth((t - ev.uncover) / 0.9);
  const yUp = 7;
  const yDown = 1.3;
  return yUp + (yDown - yUp) * down + (yUp - yDown) * up;
};

// ---------------------------------------------------------------- Kamera
type Cam = {pos: number[]; look: number[]; fov: number};
const L = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k),
  look: a.look.map((v, i) => v + (b.look[i] - v) * k),
  fov: a.fov + (b.fov - a.fov) * k,
});
const shots: {at: number; blend: number; cam: (t: number) => Cam}[] = [
  {at: 0, blend: 0, cam: (t) => ({pos: [0.4 - t * 0.04, 1.8, 11.2 - t * 0.12], look: [0, 1.3, 0], fov: 42})},
  {at: line('g1').start - 0.2, blend: 1.0, cam: (t) => ({pos: [-0.9, 1.5, 4.8 - (t - line('g1').start) * 0.05], look: [-1.5, 1.2, 0], fov: 42})},
  {at: line('g2').start + 0.4, blend: 1.2, cam: (t) => ({pos: [0.9 + (t - line('g2').start) * 0.03, 1.55, 5.2], look: [0.9, 1.1, -0.6], fov: 42})},
  {at: line('g3').start, blend: 1.0, cam: (t) => ({pos: [0, 1.75, 10.2 - (t - line('g3').start) * 0.06], look: [0, 1.25, 0], fov: 42})},
  {at: line('q1').start, blend: 1.0, cam: (t) => ({pos: [Math.sin((t - line('q1').start) * 0.12) * 2, 2.2, 10.6], look: [0, 1.2, 0], fov: 42})},
  {at: wordAt('q2', 'testen'), blend: 0, cam: (t) => ({pos: [30, 2.3, 7.6 - (t - wordAt('q2', 'testen')) * 0.05], look: [30, 1.35, 0], fov: 42})},
  {at: ev.simStart, blend: 1.0, cam: (t) => ({pos: [30 + Math.sin((t - ev.simStart) * 0.2) * 0.5, 2.0, 6.6], look: [30, 1.3, 0], fov: 42})},
  {at: ev.fastStart, blend: 1.0, cam: (t) => ({pos: [30.4 - (t - ev.fastStart) * 0.07, 2.5, 7.0], look: [30, 1.45, 0], fov: 42})},
  {at: ev.uncover - 0.3, blend: 1.4, cam: (t) => ({pos: [30, 1.7, 6.4 - (t - ev.uncover) * 0.05], look: [30, 1.2, 0], fov: 42})},
  {at: scene('explain').start, blend: 0, cam: (t) => ({pos: [0, 1.8, 10.6 - (t - scene('explain').start) * 0.06], look: [0, 1.15, -0.3], fov: 42})},
  {at: scene('twist').start, blend: 1.4, cam: (t) => {
    const k = (t - scene('twist').start) * 0.12;
    return {pos: [Math.sin(k) * 2.2, 2.3, 10.2 - k * 2], look: [0, 1.2, -0.3], fov: 42};
  }},
];
export const camAt = (t: number): Cam => {
  let i = 0;
  while (i + 1 < shots.length && t >= shots[i + 1].at) i++;
  const cur = shots[i].cam(t);
  if (i > 0 && shots[i].blend > 0 && t < shots[i].at + shots[i].blend) return L(shots[i - 1].cam(t), cur, smooth((t - shots[i].at) / shots[i].blend));
  return cur;
};
