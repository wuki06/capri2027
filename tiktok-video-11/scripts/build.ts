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
const lines: any[] = [];
const sceneStart: Record<string, number> = {};
const sceneEnd: Record<string, number> = {};
let t = 0.5;
let prev = '';
for (const l of narration.lines) {
  const d = durations[l.id];
  if (l.scene !== prev) {
    if (prev) {
      sceneEnd[prev] = t + 0.3;
      t += 0.75;
    }
    sceneStart[l.scene] = prev ? t - 0.35 : 0;
    prev = l.scene;
  } else t += 0.32;
  if (l.id === 'r1') t += 1.6; // Spannungspause

  const words: any[] = [];
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
sceneEnd[prev] = t + 2.4;
const total = sceneEnd[prev];
const scenes = Object.keys(sceneStart).map((k) => ({id: k, start: sceneStart[k], end: sceneEnd[k]}));
writeFileSync(ROOT + 'src/timeline.json', JSON.stringify({fps: FPS, durationInFrames: Math.ceil(total * FPS), total, lines, scenes, events: {}}));
writeFileSync(ROOT + 'build/timeline.json', JSON.stringify({total, lines, scenes, events: {}}, null, 1));
console.log('Gesamtdauer', total.toFixed(2), 's |', scenes.map((s) => `${s.id} ${s.start.toFixed(1)}-${s.end.toFixed(1)}`).join(' | '));
