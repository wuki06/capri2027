import raw from './timeline.json';

export type Word = {w: string; s: number; e: number};
export type Line = {id: string; scene: string; show: string; start: number; end: number; words: Word[]};
type D = {h: number; t: number; w: number; gap: number; pivot: number; trigger: number; dtS: number; free: number[]};
export const TL = raw as unknown as {
  fps: number;
  durationInFrames: number;
  total: number;
  lines: Line[];
  scenes: {id: string; start: number; end: number}[];
  events: Record<string, any>;
  dominoes: D[];
};
export const FPS = TL.fps;
export const DOM = TL.dominoes;
export const NDOM = DOM.length;
export const ev = TL.events;
export const line = (id: string) => TL.lines.find((l) => l.id === id)!;
export const scene = (id: string) => TL.scenes.find((s) => s.id === id)!;
export const wordAt = (id: string, m: string) => line(id).words.find((w) => w.w.toLowerCase().includes(m.toLowerCase()))!.s;

export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x: number) => {
  const k = clamp(x);
  return k * k * (3 - 2 * k);
};
const T: number[] = ev.T;

const interpKeys = (keys: [number, number][], t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (t <= keys[i][0]) return keys[i - 1][1] + ((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])) * (keys[i][1] - keys[i - 1][1]);
  return keys[keys.length - 1][1];
};
/** Fraktionaler Stein-Index (1-basiert) -> Simulationszeit */
const idxToSim = (f: number) => {
  const i = Math.max(1, Math.min(NDOM - 1, Math.floor(f)));
  return T[i - 1] + (f - i) * (T[i] - T[i - 1]);
};

export const simAt = (t: number) => {
  if (t < ev.chainStart) return 0;
  if (t < ev.freeze) return idxToSim(interpKeys(ev.chainKeys, t));
  if (t < ev.finalStart) return T[27];
  return Math.min(ev.END, T[27] + (t - ev.finalStart) * ev.finalSpeed);
};
/** Zeitfaktor (Sim-Sekunden pro Video-Sekunde) für die Anzeige */
export const speedAt = (t: number) => {
  const dt = 1 / 30;
  return (simAt(t + dt) - simAt(t)) / dt;
};

const freeAt = (d: D, tau: number) => {
  const k = tau / d.dtS;
  const i = Math.floor(k);
  if (i >= d.free.length - 1) return d.free[d.free.length - 1];
  return d.free[i] + (d.free[i + 1] - d.free[i]) * (k - i);
};
/** Kippwinkel aller Steine zur Simulationszeit */
export const anglesAt = (sim: number) => {
  const th = new Array(NDOM).fill(0);
  for (let i = NDOM - 1; i >= 0; i--) {
    const d = DOM[i];
    if (sim < d.trigger) th[i] = 0;
    else if (i === NDOM - 1 || sim < DOM[i + 1].trigger) th[i] = freeAt(d, sim - d.trigger);
    else {
      const phi = th[i + 1];
      th[i] = Math.min(Math.PI / 2, phi + Math.asin(clamp((d.gap * Math.cos(phi)) / d.h, -1, 1)));
    }
  }
  return th;
};
/** Index des gerade fallenden Steins (1-basiert) */
export const activeIdx = (sim: number) => {
  let a = 1;
  for (let i = 0; i < NDOM; i++) if (sim >= DOM[i].trigger) a = i + 1;
  return a;
};

// ------------------------------------------------------------ Kamera
export const hAt = (f: number) => 0.005 * Math.pow(1.5, f - 1);
export const xAt = (f: number) => {
  const i = Math.max(1, Math.min(NDOM, Math.floor(f)));
  const a = DOM[i - 1].pivot;
  const b = i < NDOM ? DOM[i].pivot : a + DOM[i - 1].h;
  return a + (b - a) * (f - i);
};
type Cam = {pos: number[]; look: number[]; fov: number};
const track = (f: number, side = 1, orbit = 0, zoom = 1): Cam => {
  const h = hAt(f);
  const x = xAt(Math.min(29, f));
  const dx = -0.9 * h * zoom;
  const dz = 4.2 * h * zoom;
  const c = Math.cos(orbit);
  const s = Math.sin(orbit);
  return {
    pos: [x + dx * c + dz * s, 1.6 * h * zoom, (-dx * s + dz * c) * side],
    look: [x + 0.35 * h, 0.5 * h, -0.25 * h],
    fov: 40,
  };
};
const XG = DOM[NDOM - 1].pivot;
const wide = (k: number): Cam => ({pos: [XG - 900 + k * 60, 330 + k * 10, 1150 - k * 40], look: [XG - 200, 170, -60], fov: 40});
const logL = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k),
  look: a.look.map((v, i) => v + (b.look[i] - v) * k),
  fov: a.fov + (b.fov - a.fov) * k,
});

export const focusF = (t: number) => {
  if (t < ev.freeze) return interpKeys(ev.chainKeys, t) + 0.5;
  if (t < ev.finalStart) return 28.5;
  const sim = simAt(t);
  return 28.5 + ((sim - T[27]) / (ev.END - T[27])) * 0.6;
};

export const camAt = (t: number): Cam => {
  const h2u = wordAt('h2', 'umwerfen');
  const h3 = line('h3');
  if (t < h2u - 0.1) return track(1.0 + t * 0.05, 1, 0.45 - t * 0.05, 0.8);
  if (t < h3.start + 1.2) return wide((t - h2u) * 0.4);
  const rule = scene('rule');
  if (t < rule.start) return track(1.2, 1, 0.3);
  const q1 = line('q1');
  if (t < q1.start) return track(1.2 + ((t - rule.start) / (q1.start - rule.start)) * 3.0, 1, 0.3 - (t - rule.start) * 0.02);
  const q2 = line('q2');
  if (t < q2.start + 0.5) {
    // Flug entlang der Kette: logarithmischer Zoom
    const k = smooth((t - q1.start) / (q2.start + 0.5 - q1.start));
    return track(4.2 + k * 25, 1, 0.1 + k * 0.4);
  }
  if (t < ev.chainStart) return logL(track(29.2, 1, 0.5), wide(2), smooth((t - q2.start - 0.5) / 1.5));
  if (t < ev.freeze) return track(focusF(t), 1, 0.15);
  if (t < ev.finalStart) return track(28.5, 1, 0.15 + (t - ev.freeze) * 0.06);
  const fs = 0.15 + (ev.finalStart - ev.freeze) * 0.06;
  if (t < ev.impact + 0.8) return track(focusF(t), 1, fs, 1.15);
  const tw = scene('twist');
  if (t < tw.start) return logL(track(29.1, 1, fs, 1.15), wide(1), smooth((t - ev.impact - 0.8) / 2.0));
  const k = t - tw.start;
  return {pos: [XG - 500 - k * 30, 900 + k * 60, 900 + k * 40], look: [XG - 300, 0, -60], fov: 42};
};
