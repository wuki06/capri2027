import raw from './timeline.json';

export type Word = {w: string; s: number; e: number};
export type Line = {id: string; scene: string; show: string; start: number; end: number; words: Word[]};
export const TL = raw as unknown as {fps: number; durationInFrames: number; total: number; lines: Line[]; scenes: {id: string; start: number; end: number}[]};
export const FPS = TL.fps;
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

// Orte der Sets
export const HELIX = [0, 0, 0];
export const MAP = [30, 0, 0];
export const BOARD = [60, 0, 0];
export const SWAB = [90, 0, 0];

// Karte: Längen-/Breitengrad -> lokale Koordinaten
export const proj = (lon: number, lat: number): [number, number] => [(lon - 8.5) * 0.66 * 0.62, -(lat - 48.6) * 0.62];
export const HEILBRONN = proj(9.22, 49.14);

// Karten auf der Pinnwand (lokale Position x, y)
export const CARDS = {
  phantom: [0, 1.2],
  headline: [-1.9, 2.4],
  noface: [1.95, 2.45],
  reward: [-1.95, -0.35],
  dna: [1.95, -0.3],
  map: [-1.6, -2.3],
  wende: [1.6, -2.3],
  nsu: [0, -2.7],
} as const;

type Cam = {pos: number[]; look: number[]; fov: number};
const add = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
const L = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k),
  look: a.look.map((v, i) => v + (b.look[i] - v) * k),
  fov: a.fov + (b.fov - a.fov) * k,
});
const boardCam = (x: number, y: number, dist: number): Cam => ({pos: add(BOARD, [x * 0.9, y * 0.9 + 0.2, dist]), look: add(BOARD, [x, y, 0]), fov: 40});

const shots: {at: number; blend: number; cam: (t: number) => Cam}[] = [
  {at: 0, blend: 0, cam: (t) => {
    const a = t * 0.35;
    return {pos: add(HELIX, [Math.sin(a) * 2.6, 0.2 + Math.sin(t * 0.3) * 0.4, Math.cos(a) * 2.6]), look: add(HELIX, [0, 0, 0]), fov: 45};
  }},
  {at: scene('map').start, blend: 0, cam: (t) => {
    const k = t - scene('map').start;
    return {pos: add(MAP, [0.35, 8.2 + k * 0.08, 2.6 + k * 0.05]), look: add(MAP, [0.3, 0, -0.35]), fov: 44};
  }},
  {at: scene('heilbronn').start, blend: 1.4, cam: (t) => {
    const k = t - scene('heilbronn').start;
    return {pos: add(MAP, [HEILBRONN[0] + 0.5, 2.0 - k * 0.08, HEILBRONN[1] + 2.0 - k * 0.06]), look: add(MAP, [HEILBRONN[0], 0, HEILBRONN[1]]), fov: 42};
  }},
  {at: scene('board').start, blend: 0, cam: (t) => {
    const k = t - scene('board').start;
    return boardCam(CARDS.headline[0] * 0.5, 1.6, 5.6 - k * 0.12);
  }},
  {at: line('p6').start - 0.2, blend: 1.0, cam: (t) => boardCam(CARDS.reward[0] * 0.55, -0.2, 4.6 - (t - line('p6').start) * 0.08)},
  {at: line('s1').start, blend: 1.4, cam: (t) => {
    const k = t - line('s1').start;
    return boardCam(CARDS.phantom[0], CARDS.phantom[1], 4.2 - k * 0.3);
  }},
  {at: line('r1').start - 0.4, blend: 1.0, cam: (t) => boardCam(CARDS.wende[0], CARDS.wende[1], 3.0 - (t - line('r1').start) * 0.06)},
  {at: line('r2').start - 0.2, blend: 0.8, cam: (t) => boardCam(CARDS.phantom[0], CARDS.phantom[1], 3.0 - (t - line('r2').start) * 0.1)},
  {at: scene('swab').start, blend: 0, cam: (t) => {
    const k = t - scene('swab').start;
    const a = -0.5 + k * 0.12;
    return {pos: add(SWAB, [Math.sin(a) * 1.25, 0.35 + Math.sin(k * 0.4) * 0.1, Math.cos(a) * 1.25]), look: add(SWAB, [0, 0.1, 0]), fov: 38};
  }},
  {at: scene('epilog').start, blend: 0, cam: (t) => boardCam(0, -0.6, 6.8 + (t - scene('epilog').start) * 0.1)},
  {at: scene('outro').start, blend: 0, cam: (t) => {
    const a = (t - scene('outro').start) * 0.25;
    return {pos: add(HELIX, [Math.sin(a) * 3.2, 0.5, Math.cos(a) * 3.2]), look: add(HELIX, [0, 0, 0]), fov: 45};
  }},
];
export const camAt = (t: number): Cam => {
  let i = 0;
  while (i + 1 < shots.length && t >= shots[i + 1].at) i++;
  const cur = shots[i].cam(t);
  if (i > 0 && shots[i].blend > 0 && t < shots[i].at + shots[i].blend) return L(shots[i - 1].cam(t), cur, smooth((t - shots[i].at) / shots[i].blend));
  return cur;
};
