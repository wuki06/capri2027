// Ziegenproblem: 1000 echte, zufällige Spiele (Mulberry32-Zufallsgenerator) + Timeline.
import {readFileSync, writeFileSync} from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const FPS = 30;
const narration = JSON.parse(readFileSync(ROOT + 'narration.json', 'utf8'));
const durations: Record<string, number> = JSON.parse(readFileSync(ROOT + 'build/durations.json', 'utf8'));

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Ein komplettes Spiel nach den echten Regeln */
const play = (rnd: () => number) => {
  const car = Math.floor(rnd() * 3);
  const pick = Math.floor(rnd() * 3);
  // Moderator öffnet eine Ziegen-Tür, die nicht gewählt wurde
  const options = [0, 1, 2].filter((d) => d !== pick && d !== car);
  const opened = options[Math.floor(rnd() * options.length)];
  const switchTo = [0, 1, 2].find((d) => d !== pick && d !== opened)!;
  return {car, pick, opened, stayWins: pick === car, switchWins: switchTo === car};
};

// Seed suchen: Anfang knapp (realistisch zufällig), Endergebnis typisch
let seed = 1;
let games: ReturnType<typeof play>[] = [];
for (; seed < 5000; seed++) {
  const rnd = mulberry(seed);
  games = Array.from({length: 1000}, () => play(rnd));
  const s30 = games.slice(0, 30).filter((g) => g.stayWins).length;
  const s1000 = games.filter((g) => g.stayWins).length;
  if (Math.abs(s30 - 15) <= 2 && s1000 >= 325 && s1000 <= 340) break;
}
const stayWins = games.filter((g) => g.stayWins).length;
console.log('Seed', seed, '→ Bleiben gewinnt', stayWins, '· Wechseln gewinnt', 1000 - stayWins, '· nach 30 Spielen', games.slice(0, 30).filter((g) => g.stayWins).length, ':', 30 - games.slice(0, 30).filter((g) => g.stayWins).length);
if (games.some((g) => g.stayWins === g.switchWins)) throw new Error('Regelfehler');

const weights = (show: string) =>
  show.split(/\s+/).map((w) => {
    let x = w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5;
    if (/^\d/.test(w)) x += 7;
    if (/[.!?…]$/.test(w)) x += 5;
    else if (/[,:–]$/.test(w) || w === '–') x += 3;
    return x;
  });
type Word = {w: string; s: number; e: number};
const lines: {id: string; scene: string; show: string; start: number; end: number; words: Word[]}[] = [];
const sceneStart: Record<string, number> = {};
const sceneEnd: Record<string, number> = {};
const ev: Record<string, any> = {};
const prevEnd = () => lines[lines.length - 1].end;
const wIn = (id: string, m: string) => lines.find((l) => l.id === id)!.words.find((w) => w.w.toLowerCase().includes(m.toLowerCase()))!.s;

const FAST = 6.0;
let t = 0.35;
let prev = '';
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
  if (l.id === 'm1') {
    ev.simStart = sceneStart.sim + 0.5;
    t = ev.simStart + 0.6;
  }
  if (l.id === 'm2') t = prevEnd() + 1.2;
  if (l.id === 's1') {
    ev.fastEnd = ev.fastStart + FAST;
    t = ev.fastEnd + 0.9;
    sceneStart.freeze = t - 0.3;
    sceneEnd.sim = t - 0.3;
  }
  if (l.id === 'r1') {
    ev.uncover = prevEnd() + 0.9;
    t = ev.uncover + 1.3;
    sceneStart.reveal = prevEnd() + 0.3;
    sceneEnd.freeze = prevEnd() + 0.3;
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
  if (l.id === 'm2') {
    ev.cover = wIn('m2', 'decken');
    ev.slowEnd = ev.cover - 0.2;
    ev.fastStart = ev.cover + 0.9;
  }
  t += d;
}
sceneEnd[prev] = t + 2.4;
const total = sceneEnd[prev];

ev.peek = wIn('h1', 'Auto');
ev.peekEnd = lines.find((l) => l.id === 'h2')!.start + 0.4;
ev.open3 = wIn('g2', 'öffnet') + 0.35;
ev.open12 = wIn('r2', 'letzten') - 0.6;

// Spielzeiten: 30 Spiele langsam (beschleunigend), dann 970 schnell
const gameTimes: number[] = [];
for (let i = 0; i < 30; i++) gameTimes.push(ev.simStart + (ev.slowEnd - ev.simStart) * Math.pow(i / 30, 0.8));
for (let i = 30; i < 1000; i++) gameTimes.push(ev.fastStart + FAST * ((i - 30) / 970) ** 0.9);
const tubeCount = [0, 0];
const balls = games.map((g, i) => {
  const tube = g.stayWins ? 0 : 1;
  return [+gameTimes[i].toFixed(3), tube, tubeCount[tube]++];
});

const scenes = Object.keys(sceneStart).map((k) => ({id: k, start: sceneStart[k], end: sceneEnd[k]}));
const timeline = {
  fps: FPS,
  durationInFrames: Math.ceil(total * FPS),
  total,
  lines,
  scenes,
  events: ev,
  result: {stay: stayWins, swap: 1000 - stayWins, seed},
  balls,
  first: games.slice(0, 30).map((g) => (g.stayWins ? 0 : 1)),
};
writeFileSync(ROOT + 'src/timeline.json', JSON.stringify(timeline));
writeFileSync(ROOT + 'build/timeline.json', JSON.stringify({...timeline, balls: undefined}, null, 1));
console.log('Gesamtdauer', total.toFixed(2), 's |', scenes.map((s) => `${s.id} ${s.start.toFixed(1)}-${s.end.toFixed(1)}`).join(' | '));
console.log(JSON.stringify(ev));
