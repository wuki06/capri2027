// Timeline für das Erdtunnel-Video: Sprache, Szenen, Zeitraffer-Mapping, Sound-Events
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {simulateFall, R_EARTH} from './fall.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FPS = 30;
const narration = JSON.parse(readFileSync(ROOT + 'narration.json', 'utf8'));
const durations: Record<string, number> = JSON.parse(readFileSync(ROOT + 'build/durations.json', 'utf8'));

const fall = simulateFall(1, 4800);
console.log('Ankunft', (fall.tArrive / 60).toFixed(2), 'min · vMax', Math.round(fall.vMax * 3.6), 'km/h');
const simAtDepth = (km: number) => fall.xs.findIndex((x) => x <= R_EARTH - km * 1000);

const weights = (show: string) =>
  show.split(/\s+/).map((w) => {
    let x = w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5;
    if (/^\d/.test(w)) x += 6; // Zahlen werden lang ausgesprochen
    if (/km\/h/.test(w)) x += 14;
    if (/[.!?…]$/.test(w)) x += 5;
    else if (/[,:]$/.test(w)) x += 3;
    return x;
  });

type Word = {w: string; s: number; e: number};
const lines: {id: string; scene: string; show: string; start: number; end: number; words: Word[]}[] = [];
const sceneStart: Record<string, number> = {};
const sceneEnd: Record<string, number> = {};
const ev: Record<string, any> = {};
const at = (id: string, m: string) => {
  const l = lines.find((x) => x.id === id)!;
  return l.words.find((w) => w.w.toLowerCase().includes(m.toLowerCase()))!.s;
};

let t = 0.4;
let prev = '';
const RUSH = 3.8;
for (const l of narration.lines) {
  const d = durations[l.id];
  if (l.scene !== prev) {
    if (prev) {
      sceneEnd[prev] = t + 0.35;
      t += 0.9;
    }
    sceneStart[l.scene] = prev ? t - 0.45 : 0;
    prev = l.scene;
  } else t += 0.3;
  if (l.id === 'f1') t = ev.jump + 0.6;
  if (l.id === 'r1') {
    ev.rushStart = sceneStart.reveal + 0.3;
    ev.arrive = ev.rushStart + RUSH;
    t = ev.arrive + 0.45;
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
  if (l.id === 'd3') ev.jump = at('d3', 'Spring');
  t += d;
}
sceneEnd[prev] = t + 2.6;
const total = sceneEnd[prev];

ev.cut = at('d1', 'Erdmittelpunkt') - 0.2;
ev.center = at('f4', 'Mittelpunkt') + 0.25;
// Zeitraffer-Stützpunkte: Echtzeit -> Simulationszeit (s)
ev.fallMap = [
  [ev.jump, 0],
  [at('f1', 'Erdkruste') + 0.2, simAtDepth(35)],
  [at('f2', 'Erdmantel'), simAtDepth(700)],
  [at('f3', 'Erdkern') + 0.1, simAtDepth(2891)],
  [at('f3', 'Sonne'), simAtDepth(5150)],
  [ev.center, Math.round(fall.tCenter)],
];
ev.tCenter = fall.tCenter;
ev.tArrive = fall.tArrive;
ev.twistStart = lines.find((l) => l.id === 't1')!.start;
ev.twistEnd = sceneEnd.twist;
ev.countdown = ['3.', '2.', '1.'].map((n) => lines.find((l) => l.id === 'd3')!.words.find((w) => w.w === n)!.s);

const scenes = Object.keys(sceneStart).map((k) => ({id: k, start: sceneStart[k], end: sceneEnd[k]}));
const timeline = {
  fps: FPS,
  durationInFrames: Math.ceil(total * FPS),
  total,
  lines,
  scenes,
  events: ev,
  fall: {
    x: fall.xs.slice(0, 4700).map((v) => Math.round(v / 100) / 10), // km
    v: fall.vs.slice(0, 4700).map((v) => Math.round(Math.abs(v) * 3.6)), // km/h
    vMax: Math.round(fall.vMax * 3.6),
  },
};
mkdirSync(ROOT + 'build', {recursive: true});
writeFileSync(ROOT + 'src/timeline.json', JSON.stringify(timeline));
writeFileSync(ROOT + 'build/timeline.json', JSON.stringify({...timeline, fall: undefined}, null, 1));
console.log('Gesamtdauer', total.toFixed(2), 's |', scenes.map((s) => `${s.id} ${s.start.toFixed(1)}-${s.end.toFixed(1)}`).join(' | '));
console.log(JSON.stringify(ev));
