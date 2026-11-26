import raw from './timeline.json';
import {METHODS, tempAt, timeTo} from '../scripts/cooling';

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
export {METHODS, tempAt, timeTo};

export const EV = {
  raceStart: line('c1').start + 0.5,
  freeze: line('s1').start,
  runOn: line('s1').end + 0.15,
  saltDone: line('r1').start + 0.6,
};
/** Simulationszeit (s) zur Videozeit */
export const simAt = (t: number) => {
  if (t < EV.raceStart) return 0;
  if (t < EV.freeze) return 60 * smooth((t - EV.raceStart) / (EV.freeze - EV.raceStart)) ** 0.85;
  if (t < EV.runOn) return 60;
  return 60 + (timeTo(METHODS[3]) - 60) * clamp((t - EV.runOn) / (EV.saltDone - EV.runOn));
};
export const speedAt = (t: number) => (simAt(t + 1 / 30) - simAt(t)) * 30;

// Positionen der Stationen (Meter, Arbeitsplatte bei y = 0)
export const ST = {
  fridge: [-0.17, 0, -0.32],
  freezer: [0.17, 0, -0.32],
  ice: [-0.16, 0, 0.14],
  salt: [0.16, 0, 0.14],
} as const;

type Cam = {pos: number[]; look: number[]; fov: number};
const add = (a: readonly number[], b: number[]) => a.map((v, i) => v + b[i]);
const L = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k),
  look: a.look.map((v, i) => v + (b.look[i] - v) * k),
  fov: a.fov + (b.fov - a.fov) * k,
});
const overview = (t: number, k = 0): Cam => ({pos: [Math.sin(t * 0.08) * 0.12, 1.15 - k * 0.05, 1.05], look: [0, 0.02, -0.08], fov: 40});
const shots: {at: number; blend: number; cam: (t: number) => Cam}[] = [
  // Einstieg: Nahaufnahme der Salz-Dose, die sich dreht
  {at: 0, blend: 0, cam: (t) => ({pos: add(ST.salt, [0.05 - t * 0.01, 0.2 + t * 0.01, 0.32 - t * 0.008]), look: add(ST.salt, [0, 0.03, 0]), fov: 38})},
  {at: line('h2').start, blend: 1.6, cam: (t) => overview(t)},
  {at: line('p2').start, blend: 1.2, cam: (t) => ({pos: [0, 0.42, 1.0 - (t - line('p2').start) * 0.03], look: [0, 0.17, -0.32], fov: 40})},
  {at: line('p3').start, blend: 1.2, cam: (t) => ({pos: [0.02, 0.45, 0.72 - (t - line('p3').start) * 0.02], look: [0, 0.0, 0.14], fov: 40})},
  {at: wordAt('p3', 'drehen') - 0.2, blend: 1.0, cam: (t) => ({pos: add(ST.salt, [-0.06, 0.24, 0.3]), look: add(ST.salt, [0, 0.02, 0]), fov: 38})},
  {at: line('c1').start - 0.3, blend: 1.0, cam: (t) => overview(t)},
  {at: line('r1').start - 0.2, blend: 1.0, cam: (t) => ({pos: add(ST.salt, [-0.05, 0.26, 0.34]), look: add(ST.salt, [0, 0.02, 0]), fov: 38})},
  {at: line('r2').start, blend: 1.2, cam: (t) => overview(t, 1)},
  {at: line('e1').start, blend: 1.2, cam: (t) => ({pos: add(ST.salt, [0.1, 0.32 - (t - line('e1').start) * 0.01, 0.36]), look: add(ST.salt, [0, 0.0, 0]), fov: 38})},
  {at: line('e2').start, blend: 1.2, cam: (t) => ({pos: add(ST.salt, [-0.12, 0.18, 0.22]), look: add(ST.salt, [0, 0.03, 0]), fov: 36})},
  {at: scene('outro').start, blend: 1.4, cam: (t) => overview(t)},
];
export const camAt = (t: number): Cam => {
  let i = 0;
  while (i + 1 < shots.length && t >= shots[i + 1].at) i++;
  const cur = shots[i].cam(t);
  if (i > 0 && shots[i].blend > 0 && t < shots[i].at + shots[i].blend) return L(shots[i - 1].cam(t), cur, smooth((t - shots[i].at) / shots[i].blend));
  return cur;
};
