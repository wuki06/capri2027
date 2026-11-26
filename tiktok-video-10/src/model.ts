import raw from './timeline.json';
import {PEOPLE, series} from '../scripts/money';

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
export {PEOPLE};
export const SERIES = PEOPLE.map(series);

const KEYS: [number, number][] = [
  [line('c1').start + 0.3, 20],
  [wordAt('c2', '30'), 30],
  [wordAt('c3', '55'), 55],
  [line('s1').start, 60],
  [line('s1').end + 0.25, 60],
  [line('r1').start + 0.2, 65],
];
export const EV = {raceStart: KEYS[0][0], freeze: line('s1').start, runOn: KEYS[4][0], end: KEYS[5][0]};
export const ageAt = (t: number) => {
  if (t <= KEYS[0][0]) return 20;
  for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i][0]) return KEYS[i - 1][1] + ((t - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0])) * (KEYS[i][1] - KEYS[i - 1][1]);
  return 65;
};
/** Videozeit, zu der ein bestimmtes Alter erreicht wird */
export const timeOfAge = (age: number) => {
  for (let i = 1; i < KEYS.length; i++) if (age <= KEYS[i][1] && KEYS[i][1] > KEYS[i - 1][1]) return KEYS[i - 1][0] + ((age - KEYS[i - 1][1]) / (KEYS[i][1] - KEYS[i - 1][1])) * (KEYS[i][0] - KEYS[i - 1][0]);
  return KEYS[KEYS.length - 1][0];
};
export const at = (p: number, age: number) => {
  const s = SERIES[p];
  const m = clamp((age - 20) * 12, 0, s.length - 1);
  const i = Math.floor(m);
  const j = Math.min(s.length - 1, i + 1);
  const f = m - i;
  return {value: s[i].value + (s[j].value - s[i].value) * f, paid: s[i].paid + (s[j].paid - s[i].paid) * f};
};
/** Erscheinungszeit jeder Münze (1 Münze = 1.000 €) */
export const COIN = 1000;
export const COINS = SERIES.map((s) => {
  const times: number[] = [];
  let k = 0;
  for (const pt of s) while (pt.value >= (k + 1) * COIN) {
    times.push(timeOfAge(pt.age));
    k++;
  }
  return times;
});
