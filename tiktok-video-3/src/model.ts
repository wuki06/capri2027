import {TL, line} from './timeline';

export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x: number) => {
  const k = clamp(x);
  return k * k * (3 - 2 * k);
};
const ev = TL.events as any;
const PERIOD = 2 * ev.tArrive;

/** Simulationszeit (s seit dem Sprung) zur Videozeit t */
export const simAt = (t: number): number => {
  const m: [number, number][] = ev.fallMap;
  if (t < m[0][0]) return 0;
  for (let i = 1; i < m.length; i++)
    if (t <= m[i][0]) return m[i - 1][1] + ((t - m[i - 1][0]) / (m[i][0] - m[i - 1][0])) * (m[i][1] - m[i - 1][1]);
  if (t < ev.rushStart) return ev.tCenter;
  if (t < ev.arrive) {
    const k = (t - ev.rushStart) / (ev.arrive - ev.rushStart);
    // erst schnell, dann sanft abbremsend (wie die echte Bewegung)
    return ev.tCenter + (ev.tArrive - ev.tCenter) * Math.sin((k * Math.PI) / 2);
  }
  if (t < ev.twistStart + 0.8) return ev.tArrive;
  return ev.tArrive + (t - ev.twistStart - 0.8) * 1300;
};

const xKm = (sim: number) => {
  const s = ((sim % PERIOD) + PERIOD) % PERIOD;
  const i = Math.floor(s);
  const f = s - i;
  const X = TL.fall.x;
  const a = X[Math.min(i, X.length - 1)];
  const b = X[Math.min(i + 1, X.length - 1)];
  return a + (b - a) * f;
};
export const speedKmh = (sim: number) => {
  const s = ((sim % PERIOD) + PERIOD) % PERIOD;
  return TL.fall.v[Math.min(Math.floor(s), TL.fall.v.length - 1)];
};
export const capsuleY = (sim: number) => (sim <= 0 ? 1.012 : xKm(sim) / 6371);
export const depthAt = (sim: number) => 6371 - Math.abs(xKm(sim));
export const posKm = (sim: number) => xKm(sim);

// PREM-Schwerkraft (Anzeige)
const PREM: [number, number][] = [[0, 0], [600, 2.2], [1221.5, 4.4], [1800, 6], [2400, 7.6], [3000, 9.2], [3480, 10.68], [4000, 10.3], [4500, 10.1], [5000, 10], [5701, 10], [6000, 9.93], [6371, 9.82]];
export const gAt = (r: number) => {
  for (let i = 1; i < PREM.length; i++) if (r <= PREM[i][0]) return PREM[i - 1][1] + ((r - PREM[i - 1][0]) / (PREM[i][0] - PREM[i - 1][0])) * (PREM[i][1] - PREM[i - 1][1]);
  return 9.82;
};
// Temperaturprofil (Näherung, °C)
const TEMP: [number, number][] = [[0, 15], [35, 500], [670, 1900], [2891, 3700], [5150, 5000], [6371, 5400]];
export const tempAt = (depth: number) => {
  for (let i = 1; i < TEMP.length; i++) if (depth <= TEMP[i][0]) return TEMP[i - 1][1] + ((depth - TEMP[i - 1][0]) / (TEMP[i][0] - TEMP[i - 1][0])) * (TEMP[i][1] - TEMP[i - 1][1]);
  return 5400;
};
export const layerAt = (depth: number) =>
  depth < 35 ? 'ERDKRUSTE' : depth < 2891 ? 'ERDMANTEL' : depth < 5150 ? 'ÄUSSERER KERN · flüssig' : 'INNERER KERN · fest';

// Erdrotation nur im Intro, danach steht Berlin oben
export const earthSpin = (t: number) => {
  const end = line('d1').start;
  if (t >= end) return 0;
  return -(1 - smooth(t / end)) * 1.6;
};
export const cutAt = (t: number) => smooth((t - ev.cut) / 1.3);

// ---------------------------------------------------------------- Kamera
type Cam = {pos: [number, number, number]; look: [number, number, number]; fov: number};
const L = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as Cam['pos'],
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as Cam['look'],
  fov: a.fov + (b.fov - a.fov) * k,
});

const shots: {at: number; blend: number; cam: (t: number) => Cam}[] = [
  {
    at: 0,
    blend: 0,
    cam: (t) => {
      const a = -0.9 + t * 0.07;
      const d = 4.6 - t * 0.09;
      return {pos: [Math.sin(a) * d, 1.2 - t * 0.05, Math.cos(a) * d], look: [0, 0.1, 0], fov: 32};
    },
  },
  {at: line('d1').start - 0.3, blend: 1.6, cam: (t) => ({pos: [0.15, 1.75 - (t - line('d1').start) * 0.03, 2.3], look: [0, 0.75, 0], fov: 32})},
  {at: ev.cut + 0.2, blend: 1.5, cam: (t) => ({pos: [0.35, 0.15, 4.1 - (t - ev.cut) * 0.04], look: [0, 0, 0], fov: 34})},
  {at: line('d3').start - 0.2, blend: 1.4, cam: () => ({pos: [0.32, 1.06, 0.72], look: [0, 0.96, 0], fov: 34})},
  {
    at: ev.jump - 0.2,
    blend: 0.9,
    cam: (t) => {
      const y = capsuleY(simAt(t));
      const back = 0.55 + 0.35 * clamp((1 - Math.abs(y)) / 0.8);
      return {pos: [0.26, y + 0.07, back], look: [0, y - 0.06, 0], fov: 36};
    },
  },
  {
    at: ev.center,
    blend: 1.0,
    cam: (t) => {
      const a = Math.sin((t - ev.center) * 0.35) * 0.8;
      return {pos: [Math.sin(a) * 0.75, 0.12, Math.cos(a) * 0.75], look: [0, 0, 0], fov: 38};
    },
  },
  {at: ev.rushStart, blend: 1.2, cam: (t) => ({pos: [0.4, -0.25 - 0.2 * smooth((t - ev.rushStart) / 3), 3.4], look: [0, -0.2, 0], fov: 36})},
  {at: ev.arrive + 0.2, blend: 1.1, cam: () => ({pos: [0.3, -0.92, 0.85], look: [0, -1.0, 0], fov: 36})},
  {at: line('r2').start, blend: 1.4, cam: (t) => ({pos: [0.5, -0.1, 3.6 + (t - line('r2').start) * 0.03], look: [0, -0.1, 0], fov: 36})},
  {at: ev.twistStart, blend: 1.0, cam: (t) => ({pos: [-0.6, 0.1, 3.5 - (t - ev.twistStart) * 0.05], look: [0, 0, 0], fov: 36})},
  {
    at: line('c1').start - 0.6,
    blend: 1.5,
    cam: (t) => {
      const k = t - line('c1').start;
      return {pos: [Math.sin(k * 0.15) * 4.6, 0.6, Math.cos(k * 0.15) * 4.6], look: [0, 0.35, 0], fov: 34};
    },
  },
];

export const camAt = (t: number): Cam => {
  let i = 0;
  while (i + 1 < shots.length && t >= shots[i + 1].at) i++;
  const cur = shots[i].cam(t);
  if (i > 0 && t < shots[i].at + shots[i].blend) {
    return L(shots[i - 1].cam(t), cur, smooth((t - shots[i].at) / shots[i].blend));
  }
  return cur;
};
