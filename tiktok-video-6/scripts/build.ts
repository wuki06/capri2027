// Timeline: Sprache + Tiefen-Keyframes für den Tauchgang
import {readFileSync, writeFileSync} from 'node:fs';
const ROOT = new URL('..', import.meta.url).pathname;
const FPS = 30;
const narration = JSON.parse(readFileSync(ROOT + 'narration.json', 'utf8'));
const durations: Record<string, number> = JSON.parse(readFileSync(ROOT + 'build/durations.json', 'utf8'));
const weights = (show: string) =>
  show.split(/\s+/).map((w) => {
    let x = w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5;
    if (/^\d/.test(w)) x += 9;
    if (/[.!?…]$/.test(w)) x += 5;
    else if (/[,:]$/.test(w)) x += 3;
    return x;
  });
type Word = {w: string; s: number; e: number};
const lines: any[] = [];
const sceneStart: Record<string, number> = {};
const sceneEnd: Record<string, number> = {};
const ev: Record<string, any> = {};
let t = 0.4;
let prev = '';
const keys: [number, number][] = [[0, 2]];
for (const l of narration.lines) {
  const d = durations[l.id];
  if (l.scene !== prev) {
    if (prev) {
      sceneEnd[prev] = t + 0.3;
      t += 0.6;
    }
    sceneStart[l.scene] = prev ? t - 0.3 : 0;
    prev = l.scene;
  }
  // Abstieg vor jeder Station: Zeit proportional zur log-Tiefendifferenz
  const last = keys[keys.length - 1][1];
  if (l.depth > last + 5 && l.scene !== 'hook') {
    const travel = l.id === 'r1' ? 2.4 : Math.min(2.2, 0.7 + 0.35 * Math.log10(1 + (l.depth - last) / 50));
    t += travel;
  } else t += 0.35;
  if (l.id === 'r1') ev.reveal = t;
  keys.push([t + 0.2, l.depth]);
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
  lines.push({id: l.id, scene: l.scene, show: l.show, start: t, end: t + d, words, depth: l.depth});
  t += d;
}
sceneEnd[prev] = t + 2.4;
const total = sceneEnd[prev];
// während der Sprache langsam weiter sinken (bis kurz vor die nächste Station)
const depthKeys: [number, number][] = [];
for (let i = 0; i < keys.length; i++) {
  depthKeys.push(keys[i]);
  const ln = lines[i - 1];
  if (i > 0 && i < keys.length - 1 && ln.scene === 'dive') {
    const drift = Math.min(2.5, (keys[i + 1][1] - keys[i][1]) * 0.01);
    depthKeys.push([ln.end, keys[i][1] + drift]);
  }
}
ev.depthKeys = depthKeys;
ev.lightsFlicker = lines.find((l) => l.id === 's1').start;
const scenes = Object.keys(sceneStart).map((k) => ({id: k, start: sceneStart[k], end: sceneEnd[k]}));
const timeline = {fps: FPS, durationInFrames: Math.ceil(total * FPS), total, lines, scenes, events: ev};
writeFileSync(ROOT + 'src/timeline.json', JSON.stringify(timeline));
writeFileSync(ROOT + 'build/timeline.json', JSON.stringify(timeline, null, 1));
console.log('Gesamtdauer', total.toFixed(2), 's');
console.log(lines.map((l) => `${l.id}@${l.start.toFixed(1)} ${l.depth}m`).join(' | '));
