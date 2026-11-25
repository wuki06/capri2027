import {readFileSync, writeFileSync} from 'node:fs';
import {simulateChain, N} from './domino.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FPS = 30;
const narration = JSON.parse(readFileSync(ROOT + 'narration.json', 'utf8'));
const durations: Record<string, number> = JSON.parse(readFileSync(ROOT + 'build/durations.json', 'utf8'));
const ds = simulateChain();
const T = ds.map((d) => d.trigger);
const END = ds[N - 1].trigger + (ds[N - 1] as any).tFall;

const weights = (show: string) =>
  show.split(/\s+/).map((w) => {
    let x = w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5;
    if (/^\d/.test(w)) x += 7;
    if (/[.!?…]$/.test(w)) x += 5;
    else if (/[,:]$/.test(w)) x += 3;
    return x;
  });

type Word = {w: string; s: number; e: number};
const lines: {id: string; scene: string; show: string; start: number; end: number; words: Word[]}[] = [];
const sceneStart: Record<string, number> = {};
const sceneEnd: Record<string, number> = {};
const ev: Record<string, any> = {};
const prevEnd = () => lines[lines.length - 1].end;
const wordIn = (id: string, m: string) => lines.find((l) => l.id === id)!.words.find((w) => w.w.toLowerCase().includes(m.toLowerCase()))!.s;

let t = 0.35;
let prev = '';
const FINAL_SPEED = 3; // Zeitraffer für die letzten zwei Steine
for (const l of narration.lines) {
  const d = durations[l.id];
  if (l.scene !== prev) {
    if (prev) {
      sceneEnd[prev] = t + 0.35;
      t += 0.85;
    }
    sceneStart[l.scene] = prev ? t - 0.45 : 0;
    prev = l.scene;
  } else t += 0.3;
  if (l.id === 'c1') {
    ev.chainStart = prevEnd() + 0.3;
    t = ev.chainStart + 1.5;
  }
  if (l.id === 'c2') t = prevEnd() + 2.0;
  if (l.id === 'c3' || l.id === 'c4') t = prevEnd() + 1.3;
  if (l.id === 's1') {
    ev.freeze = prevEnd() + 1.4;
    t = ev.freeze + 0.15;
  }
  if (l.id === 'r1') {
    ev.finalStart = prevEnd() + 0.25;
    ev.impact = ev.finalStart + (END - T[27]) / FINAL_SPEED;
    t = ev.impact + 0.55;
  }
  const words: Word[] = [];
  const ws = l.show.split(/\s+/);
  const wt = weights(l.show);
  const tot = wt.reduce((a: number, b: number) => a + b, 0);
  let acc = t;
  ws.forEach((w: string, i: number) => {
    const span = (wt[i] / tot) * d;
    words.push({w, s: acc, e: acc + span});
    acc += span;
  });
  lines.push({id: l.id, scene: l.scene, show: l.show, start: t, end: t + d, words});
  t += d;
}
sceneEnd[prev] = t + 2.5;
const total = sceneEnd[prev];

// Keyframes: Videozeit -> (fraktionaler) Stein-Index während der Kette
ev.chainKeys = [
  [ev.chainStart, 1],
  [wordIn('c1', 'Münze'), 5],
  [wordIn('c2', 'Mensch'), 15],
  [wordIn('c3', 'Haus'), 20],
  [wordIn('c4', 'Kirchturm'), 25],
  [ev.freeze, 28],
];
ev.T = T;
ev.END = END;
ev.finalSpeed = FINAL_SPEED;

const scenes = Object.keys(sceneStart).map((k) => ({id: k, start: sceneStart[k], end: sceneEnd[k]}));
const timeline = {
  fps: FPS,
  durationInFrames: Math.ceil(total * FPS),
  total,
  lines,
  scenes,
  events: ev,
  dominoes: ds.map((d) => ({h: d.h, t: d.t, w: d.w, gap: d.gap, pivot: d.pivot, trigger: d.trigger, dtS: d.dtS, free: d.free.map((x) => +x.toFixed(5))})),
};
writeFileSync(ROOT + 'src/timeline.json', JSON.stringify(timeline));
writeFileSync(ROOT + 'build/timeline.json', JSON.stringify({...timeline, dominoes: undefined}, null, 1));
console.log('Gesamtdauer', total.toFixed(2), 's |', scenes.map((s) => `${s.id} ${s.start.toFixed(1)}-${s.end.toFixed(1)}`).join(' | '));
console.log(JSON.stringify({...ev, T: undefined}));
