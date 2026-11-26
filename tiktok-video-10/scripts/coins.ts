// Exportiert die Erscheinungszeiten der Münzen (für das Sound-Design)
import {readFileSync, writeFileSync} from 'node:fs';
import {PEOPLE, series} from './money.ts';
const ROOT = new URL('..', import.meta.url).pathname;
const TL = JSON.parse(readFileSync(ROOT + 'src/timeline.json', 'utf8'));
const line = (id: string) => TL.lines.find((l: any) => l.id === id);
const wordAt = (id: string, m: string) => line(id).words.find((w: any) => w.w.toLowerCase().includes(m.toLowerCase())).s;
const KEYS: [number, number][] = [[line('c1').start + 0.3, 20], [wordAt('c2', '30'), 30], [wordAt('c3', '55'), 55], [line('s1').start, 60], [line('s1').end + 0.25, 60], [line('r1').start + 0.2, 65]];
const timeOfAge = (age: number) => {
  for (let i = 1; i < KEYS.length; i++) if (age <= KEYS[i][1] && KEYS[i][1] > KEYS[i - 1][1]) return KEYS[i - 1][0] + ((age - KEYS[i - 1][1]) / (KEYS[i][1] - KEYS[i - 1][1])) * (KEYS[i][0] - KEYS[i - 1][0]);
  return KEYS[KEYS.length - 1][0];
};
const coins = PEOPLE.map((p) => {
  const times: number[] = [];
  let k = 0;
  for (const pt of series(p)) while (pt.value >= (k + 1) * 1000) {
    times.push(+timeOfAge(pt.age).toFixed(3));
    k++;
  }
  return times;
});
writeFileSync(ROOT + 'build/coins.json', JSON.stringify(coins));
console.log('Münzen:', coins.map((c) => c.length).join(' / '));
