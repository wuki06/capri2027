import raw from './timeline.json';

export type Word = {w: string; s: number; e: number};
export type Line = {id: string; scene: string; show: string; start: number; end: number; words: Word[]; depth: number};
export const TL = raw as unknown as {
  fps: number;
  durationInFrames: number;
  total: number;
  lines: Line[];
  scenes: {id: string; start: number; end: number}[];
  events: {depthKeys: [number, number][]; reveal: number; lightsFlicker: number};
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

/** Tiefe (m) zur Videozeit – sanft beschleunigt/abgebremst zwischen den Stationen */
export const depthAt = (t: number) => {
  const k = ev.depthKeys;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++)
    if (t <= k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * smooth(u);
    }
  return k[k.length - 1][1];
};
export const speedAt = (t: number) => (depthAt(t + 1 / 30) - depthAt(t)) * 30;

const lerpTable = (tab: [number, number][], x: number) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++)
    if (x <= tab[i][0]) return tab[i - 1][1] + ((x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0])) * (tab[i][1] - tab[i - 1][1]);
  return tab[tab.length - 1][1];
};
export const tempAt = (d: number) => lerpTable([[0, 27], [200, 20], [600, 8], [1000, 4], [4000, 1.5], [10898, 2.5]], d);
export const pressureAt = (d: number) => 1 + d / 10.05;
export const zoneAt = (d: number) =>
  d < 200 ? 'SONNENLICHT-ZONE' : d < 1000 ? 'DÄMMERUNGS-ZONE' : d < 4000 ? 'MITTERNACHTS-ZONE' : d < 6000 ? 'ABYSSAL-ZONE' : 'HADAL-ZONE';

const hex = (c: number[]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const WATER: [number, number[]][] = [
  [0, [52, 160, 205]],
  [150, [14, 92, 140]],
  [450, [6, 40, 78]],
  [900, [2, 10, 24]],
  [2000, [0, 3, 8]],
  [11000, [0, 2, 5]],
];
export const waterColor = (d: number) => {
  for (let i = 1; i < WATER.length; i++)
    if (d <= WATER[i][0]) {
      const u = (d - WATER[i - 1][0]) / (WATER[i][0] - WATER[i - 1][0]);
      return hex(WATER[i - 1][1].map((v, j) => v + (WATER[i][1][j] - v) * u));
    }
  return hex(WATER[WATER.length - 1][1]);
};
export const sunAt = (d: number) => Math.exp(-d / 140);
export const headlightsAt = (t: number, d: number) => {
  let k = smooth((d - 250) / 500);
  const f = ev.lightsFlicker;
  if (t > f + 1.2 && t < ev.reveal - 0.4) {
    // Flackern in der Spannungsphase
    const x = Math.sin(t * 37) + Math.sin(t * 23.3) + Math.sin(t * 61.7);
    k *= x > 1.4 ? 0.15 : 0.75;
  }
  return k;
};
