// Timeline (Sprache, Szenen, Zeitlupen-Mapping, Sound-Events) + Physik-Vorberechnung
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {TRACKS, run, cycloidS, W, H} from '../src/race.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FPS = 30;
const narration = JSON.parse(readFileSync(ROOT + 'narration.json', 'utf8'));
const durations: Record<string, number> = JSON.parse(readFileSync(ROOT + 'build/durations.json', 'utf8'));

// --- Physik -------------------------------------------------------------------
const SAMPLE = 0.001;
const race: Record<string, {xs: number[]; ys: number[]; finish: number; path: number[]}> = {};
for (const k of ['A', 'B', 'C', 'D'] as const) {
  const c = TRACKS[k]();
  const r = run(c, 0, SAMPLE, 1.0);
  const path: number[] = [];
  const step = Math.max(1, Math.floor(c.x.length / 500));
  for (let i = 0; i < c.x.length; i += step) path.push(+c.x[i].toFixed(5), +c.y[i].toFixed(5));
  path.push(c.x[c.x.length - 1], c.y[c.y.length - 1]);
  race[k] = {xs: r.xs.map((v) => +v.toFixed(5)), ys: r.ys.map((v) => +v.toFixed(5)), finish: r.finish, path};
  console.log(k, 'Ziel nach', r.finish.toFixed(4), 's');
}
const cyc = TRACKS.C();
const TAUTO_TH = [0.02, 0.9, 1.55, 2.1, 2.55];
const tauto = TAUTO_TH.map((th) => {
  const r = run(cyc, cycloidS(th), SAMPLE, 1.0);
  return {xs: r.xs.map((v) => +v.toFixed(5)), ys: r.ys.map((v) => +v.toFixed(5)), finish: r.finish};
});
console.log('Tautochrone:', tauto.map((x) => x.finish.toFixed(4)).join(' '));

// --- Sprach-Layout ------------------------------------------------------------
type Word = {w: string; s: number; e: number};
const lines: {id: string; scene: string; show: string; start: number; end: number; words: Word[]}[] = [];
const sceneStart: Record<string, number> = {};
const sceneEnd: Record<string, number> = {};
const ev: Record<string, number> = {};
const FREEZE_SIM = 0.55;
const TAUTO_SLOW = 4;

const wordWeights = (show: string) =>
  show.split(/\s+/).map((w) => {
    let x = w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5;
    if (/[.!?…]$/.test(w)) x += 5;
    else if (/[,:]$/.test(w)) x += 3;
    return x;
  });
const wordOffset = (id: string, match: string) => {
  const l = narration.lines.find((x: any) => x.id === id);
  const ws = l.show.split(/\s+/);
  const wt = wordWeights(l.show);
  const tot = wt.reduce((a: number, b: number) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < ws.length; i++) {
    if (ws[i].toLowerCase().includes(match.toLowerCase())) return (acc / tot) * durations[id];
    acc += wt[i];
  }
  return 0;
};

let t = 0.3;
let prev = '';
for (const l of narration.lines) {
  const d = durations[l.id];
  if (l.scene !== prev) {
    if (prev) {
      sceneEnd[prev] = t + 0.35;
      t += 0.9;
    }
    sceneStart[l.scene] = prev ? t - 0.45 : 0;
    prev = l.scene;
  } else t += 0.28;

  // Sonderregeln für Spannung & Synchronität
  if (l.id === 'p1') t += 0.3;
  if (l.id === 'r2') {
    ev.raceStart = lines[lines.length - 1].end + 0.02; // nach "Los!"
    t = ev.raceStart + 0.35;
  }
  if (l.id === 'r4') {
    t = Math.max(t, ev.raceStart + 4.2);
    ev.freeze = t;
    ev.raceSlow = (ev.freeze - ev.raceStart) / FREEZE_SIM;
  }
  if (l.id === 'x1') {
    // Super-Zeitlupe: Ergebnis-Szene beginnt mit dem Weiterlaufen ab Freeze
    ev.resultStart = sceneStart.result + 0.5;
    t = -1; // wird unten gesetzt
  }
  if (l.id === 't3') {
    const want = ev.tautoRelease + race.C.finish * TAUTO_SLOW - wordOffset('t3', 'gleichzeitig');
    t = Math.max(t, want);
  }

  if (t < 0) {
    // Zeitlupen-Abschnitte (Sim-Zeit → Echtzeit-Faktor)
    const segs: [number, number, number][] = [
      [FREEZE_SIM, 0.665, 10],
      [0.665, 0.73, 45],
      [0.73, 0.86, 9],
    ];
    let rt = ev.resultStart;
    const map: [number, number][] = [[rt, FREEZE_SIM]];
    for (const [a, b, f] of segs) {
      rt += (b - a) * f;
      map.push([rt, b]);
    }
    ev.slowMap = map as any;
    const toReal = (sim: number) => {
      for (let i = 1; i < map.length; i++)
        if (sim <= map[i][1]) return map[i - 1][0] + ((sim - map[i - 1][1]) / (map[i][1] - map[i - 1][1])) * (map[i][0] - map[i - 1][0]);
      return map[map.length - 1][0];
    };
    for (const k of ['A', 'B', 'C', 'D']) ev['finish' + k] = toReal(race[k].finish);
    t = ev.finishB + 0.45;
  }

  const words: Word[] = [];
  const ws = l.show.split(/\s+/);
  const wt = wordWeights(l.show);
  const tot = wt.reduce((a: number, b: number) => a + b, 0);
  let acc = t;
  ws.forEach((w: string, i: number) => {
    const span = (wt[i] / tot) * d;
    words.push({w, s: acc, e: acc + span});
    acc += span;
  });
  lines.push({id: l.id, scene: l.scene, show: l.show, start: t, end: t + d, words});
  if (l.id === 't2') ev.tautoRelease = t + wordOffset('t2', 'los') + 0.1;
  t += d;
}
sceneEnd[prev] = t + 2.4;
const total = sceneEnd[prev];
ev.tautoArrive = ev.tautoRelease + race.C.finish * TAUTO_SLOW;

const scenes = Object.keys(sceneStart).map((k) => ({id: k, start: sceneStart[k], end: sceneEnd[k]}));
const timeline = {
  fps: FPS,
  durationInFrames: Math.ceil(total * FPS),
  total,
  lines,
  scenes,
  events: ev,
  geo: {W, H, sample: SAMPLE, freezeSim: FREEZE_SIM, tautoSlow: TAUTO_SLOW},
  race,
  tauto,
};
mkdirSync(ROOT + 'build', {recursive: true});
writeFileSync(ROOT + 'src/timeline.json', JSON.stringify(timeline));
writeFileSync(ROOT + 'build/timeline.json', JSON.stringify({...timeline, race: undefined, tauto: undefined}, null, 1));
console.log('Gesamtdauer', total.toFixed(2), 's |', scenes.map((s) => `${s.id} ${s.start.toFixed(1)}-${s.end.toFixed(1)}`).join(' | '));
console.log(ev);
