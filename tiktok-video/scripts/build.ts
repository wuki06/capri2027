// Baut die Timeline (Sprache, Szenen, Sound-Events) und berechnet alle Simulationen vor.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {simulate} from '../src/physics.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FPS = 30;
const DEG = Math.PI / 180;
const narration = JSON.parse(readFileSync(ROOT + 'narration.json', 'utf8'));
const durations: Record<string, number> = JSON.parse(
  readFileSync(ROOT + 'build/durations.json', 'utf8'),
);

type Line = {
  id: string;
  scene: string;
  show: string;
  start: number;
  end: number;
  words: {w: string; s: number; e: number}[];
};

// --- Divergenz-Messung -------------------------------------------------------
const divergence = (
  t1: number,
  t2: number,
  deltaDeg: number,
  n: number,
  seconds: number,
) => {
  const frames = Math.ceil(seconds * FPS);
  const out = simulate({n, frames, fps: FPS, theta1: t1 * DEG, theta2: t2 * DEG, delta: deltaDeg * DEG, substeps: 16});
  let visible = -1;
  let full = -1;
  for (let f = 0; f < frames; f++) {
    const a = f * n * 2;
    const b = (f * n + n - 1) * 2;
    const d = Math.hypot(out[a] - out[b], out[a + 1] - out[b + 1]);
    if (visible < 0 && d > 0.05) visible = f / FPS;
    if (d > 1.0) {
      full = f / FPS;
      break;
    }
  }
  return {visible, full};
};

// --- Layout der Sprache ------------------------------------------------------
const lines: Line[] = [];
let t = 0.35;
let prevScene = '';
const sceneStart: Record<string, number> = {};
const sceneEnd: Record<string, number> = {};

const CHAOS_IC = {t1: 150, t2: 150, deltaDeg: 1e-9, n: 1000};
console.log('Messe Divergenz der 1000 Pendel …');
const chaosFull = divergence(CHAOS_IC.t1, CHAOS_IC.t2, CHAOS_IC.deltaDeg, CHAOS_IC.n, 20);
console.log('1000 Pendel:', chaosFull);

const events: Record<string, number> = {};

for (const l of narration.lines) {
  const d = durations[l.id];
  if (l.scene !== prevScene) {
    if (prevScene) {
      sceneEnd[prevScene] = t + 0.35;
      t += 0.95;
    }
    sceneStart[l.scene] = prevScene ? t - 0.45 : 0;
    prevScene = l.scene;
  } else {
    t += 0.32;
  }
  // Spezielle Pausen
  if (l.id === 'r3') {
    // r3 beginnt, wenn die Pendel sichtbar auseinanderfliegen
    const want = events.revealRelease + chaosFull.visible + 0.9;
    t = Math.max(t + 0.4, want);
  }
  if (l.id === 's1') t += 0.4;
  const line: Line = {id: l.id, scene: l.scene, show: l.show, start: t, end: t + d, words: []};
  // Wortzeiten proportional zu Zeichenlänge + Pausengewicht der Satzzeichen
  const words = l.show.split(/\s+/);
  const weights = words.map((w: string) => {
    let x = w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5;
    if (/[.!?]$/.test(w)) x += 5;
    else if (/[,:]$/.test(w)) x += 3;
    return x;
  });
  const total = weights.reduce((a: number, b: number) => a + b, 0);
  let acc = t;
  words.forEach((w: string, i: number) => {
    const span = (weights[i] / total) * d;
    line.words.push({w, s: acc, e: acc + span});
    acc += span;
  });
  lines.push(line);
  if (l.id === 'h1') events.hookRelease = t + 0.55; // auf "starten"
  if (l.id === 'h3') events.glitch = t + 0.95;
  if (l.id === 'r1') events.revealRelease = t + 0.2;
  t += d;
}
sceneEnd[prevScene] = t + 3.2;
const total = sceneEnd[prevScene];
events.revealBoom = events.revealRelease + chaosFull.visible + 0.15;
events.revealRiser = events.revealBoom - 4.5;

// Hook-Szene so schneiden, dass sie endet, wenn die Pendel gerade aufspalten
// (Hook-Pendel = identische Simulation wie im Reveal)
events.hookCutSim = sceneEnd.hook - events.hookRelease;

// --- Zwillinge: Anfangsbedingung suchen, deren Divergenz auf "plötzlich" fällt --
const twinRelease = sceneStart.twins + 1.1;
const t4 = lines.find((l) => l.id === 't4')!;
const target = t4.start + 0.55 - twinRelease;
let best = {t1: 0, t2: 0, full: 0, visible: 0, err: 1e9};
for (let a = 100; a <= 175; a += 5) {
  for (let b = 100; b <= 180; b += 5) {
    const dv = divergence(a, b, 1e-6, 2, 25);
    if (dv.full < 0) continue;
    const err = Math.abs(dv.full - target) + (dv.visible < target - 3 ? 5 : 0);
    if (err < best.err) best = {t1: a, t2: b, full: dv.full, visible: dv.visible, err};
  }
}
console.log('Zwillinge Ziel', target.toFixed(2), 's → Anfangswinkel', best);
events.twinRelease = twinRelease;
events.twinSplit = twinRelease + best.full;

// --- Simulationen schreiben ---------------------------------------------------
mkdirSync(ROOT + 'public/sim', {recursive: true});
const chaosFrames = Math.ceil((total - events.revealRelease + 1) * FPS);
const hookFrames = Math.ceil((sceneEnd.hook - events.hookRelease + 1) * FPS);
const nFrames = Math.max(chaosFrames, hookFrames);
console.log('Simuliere 1000 Pendel ×', nFrames, 'Frames …');
const chaos = simulate({
  n: CHAOS_IC.n,
  frames: nFrames,
  fps: FPS,
  theta1: CHAOS_IC.t1 * DEG,
  theta2: CHAOS_IC.t2 * DEG,
  delta: CHAOS_IC.deltaDeg * DEG,
  substeps: 24,
});
writeFileSync(ROOT + 'public/sim/chaos1000.bin', Buffer.from(chaos.buffer));

const twinFrames = Math.ceil((sceneEnd.twins - twinRelease + 1) * FPS);
const twins = simulate({n: 2, frames: twinFrames, fps: FPS, theta1: best.t1 * DEG, theta2: best.t2 * DEG, delta: 1e-6 * DEG, substeps: 24, float64: true});

const singleFrames = Math.ceil((sceneEnd.single - sceneStart.single + 1) * FPS);
const single = simulate({n: 1, frames: singleFrames, fps: FPS, theta1: 125 * DEG, theta2: 165 * DEG, delta: 0, substeps: 24});

const scenes = Object.keys(sceneStart).map((k) => ({
  id: k,
  start: sceneStart[k],
  end: sceneEnd[k],
}));

const timeline = {
  fps: FPS,
  durationInFrames: Math.ceil(total * FPS),
  total,
  lines,
  scenes,
  events,
  chaos: {n: CHAOS_IC.n, frames: nFrames, deltaDeg: CHAOS_IC.deltaDeg, ...chaosFull},
  twins: {ic: best, data: Array.from(twins, (x) => +x.toPrecision(16))},
  single: {data: Array.from(single, (x) => +x.toFixed(5))},
};
writeFileSync(ROOT + 'src/timeline.json', JSON.stringify(timeline));
writeFileSync(ROOT + 'build/timeline.json', JSON.stringify({...timeline, twins: undefined, single: undefined}, null, 1));
console.log('Gesamtdauer', total.toFixed(2), 's  Szenen:', scenes.map((s) => `${s.id} ${s.start.toFixed(1)}-${s.end.toFixed(1)}`).join(' | '));
console.log('Events', events);
