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

export const NIGHT = [0, 0, 0];
export const ROOM = [60, 0, 0];
export const RIVER = [120, 0, 0];

/** Fahrstrecke des Autos in der Nacht (z nach hinten) */
export const carZ = (t: number) => {
  const go = line('a1').words.find((w) => w.w.startsWith('fährt'))!.s;
  if (t < 1.0) return -2 - t * 6;
  if (t < scene('hook').end) return -8 - (t - 1) * 7;
  if (t < go) return 4;
  return 4 - Math.pow(Math.max(0, t - go), 1.6) * 5;
};

/** Auto aus der Donau: Höhe über Wasser (-1.6 = unter Wasser, +1.2 = am Haken in der Luft) */
export const liftAt = (t: number) => {
  const a = wordAt('s1', 'Auto');
  const s2 = line('s2');
  const r1 = line('r1').start;
  if (t < a) return -2.2;
  if (t < s2.end) return -2.2 + 1.6 * smooth((t - a) / (s2.end - a));
  return -0.6 + 2.0 * smooth((t - r1 + 0.8) / 1.4);
};

type Cam = {pos: number[]; look: number[]; fov: number};
const add = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
const L = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k),
  look: a.look.map((v, i) => v + (b.look[i] - v) * k),
  fov: a.fov + (b.fov - a.fov) * k,
});
const shots: {at: number; blend: number; cam: (t: number) => Cam}[] = [
  // Einstieg: tief hinter dem davonfahrenden Auto
  {at: 0, blend: 0, cam: (t) => ({pos: add(NIGHT, [0.6, 0.55, 1.5 - t * 1.2]), look: add(NIGHT, [0, 0.6, -14 - t * 3]), fov: 46})},
  // Gaststätte & Abfahrt
  {at: scene('night').start, blend: 0, cam: (t) => {
    const k = t - scene('night').start;
    return {pos: add(NIGHT, [3.6 - k * 0.12, 1.7, 9.5 - k * 0.15]), look: add(NIGHT, [-0.6, 1.2, 3]), fov: 44};
  }},
  {at: line('a2').start - 0.3, blend: 1.2, cam: (t) => ({pos: add(NIGHT, [0.3, 1.1, 8 - (t - line('a2').start) * 0.4]), look: add(NIGHT, [0, 0.9, -20]), fov: 44})},
  // Verhörraum
  {at: scene('interrogation').start, blend: 0, cam: (t) => {
    const a = 0.7 - (t - scene('interrogation').start) * 0.05;
    return {pos: add(ROOM, [Math.sin(a) * 3.2, 2.0, Math.cos(a) * 3.2]), look: add(ROOM, [0, 0.95, 0]), fov: 42};
  }},
  {at: line('b2').start, blend: 1.4, cam: (t) => ({pos: add(ROOM, [0.15, 1.75, 1.25 - (t - line('b2').start) * 0.05]), look: add(ROOM, [0, 0.8, 0.0]), fov: 42})},
  {at: line('b3').start, blend: 1.0, cam: (t) => ({pos: add(ROOM, [-1.6, 1.5, 2.3]), look: add(ROOM, [0.2, 1.0, 0]), fov: 42})},
  // Gericht (Richterhammer)
  {at: scene('court').start, blend: 0, cam: (t) => {
    const k = t - scene('court').start;
    return {pos: add(ROOM, [0.9 - k * 0.04, 1.35, 1.6 - k * 0.04]), look: add(ROOM, [0.45, 0.85, -0.1]), fov: 40};
  }},
  // Donau
  {at: scene('river').start, blend: 0, cam: (t) => {
    const k = t - scene('river').start;
    return {pos: add(RIVER, [-6 + k * 0.15, 2.4, 10 - k * 0.2]), look: add(RIVER, [0, 0.4, 0]), fov: 42};
  }},
  {at: line('s2').start, blend: 1.4, cam: (t) => ({pos: add(RIVER, [-2.4, 1.2, 5.2 - (t - line('s2').start) * 0.15]), look: add(RIVER, [0, 0.0, 0]), fov: 40})},
  {at: line('r1').start - 0.6, blend: 1.6, cam: (t) => ({pos: add(RIVER, [-6.0, 3.0, 10.0 - (t - line('r1').start) * 0.15]), look: add(RIVER, [0, 1.0, 0]), fov: 40})},
  {at: line('r2').start, blend: 1.6, cam: (t) => ({pos: add(RIVER, [-4.5, 3.0, 8.5 + (t - line('r2').start) * 0.2]), look: add(RIVER, [0, 1.6, 0]), fov: 42})},
  // Epilog: leere Landstraße im Morgengrauen
  {at: scene('epilog').start, blend: 0, cam: (t) => {
    const k = t - scene('epilog').start;
    return {pos: add(NIGHT, [0.4, 1.3, 6 - k * 0.6]), look: add(NIGHT, [0, 1.0, -30]), fov: 44};
  }},
  {at: scene('outro').start, blend: 0, cam: (t) => {
    const a = (t - scene('outro').start) * 0.12;
    return {pos: add(ROOM, [Math.sin(a) * 3.4, 2.3, Math.cos(a) * 3.4]), look: add(ROOM, [0, 0.9, 0]), fov: 42};
  }},
];
export const camAt = (t: number): Cam => {
  let i = 0;
  while (i + 1 < shots.length && t >= shots[i + 1].at) i++;
  const cur = shots[i].cam(t);
  if (i > 0 && shots[i].blend > 0 && t < shots[i].at + shots[i].blend) return L(shots[i - 1].cam(t), cur, smooth((t - shots[i].at) / shots[i].blend));
  return cur;
};
