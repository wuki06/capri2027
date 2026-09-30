import { wedding } from '../data/wedding';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d, dd: String(d).padStart(2, '0'), mm: String(m).padStart(2, '0'), month: MONTHS[m - 1], yyyy: String(y) };
}
/** 10 · 07 · 2027 */
export const dots = (iso: string) => { const p = parts(iso); return `${p.dd} · ${p.mm} · ${p.yyyy}`; };
/** 10 July 2027 */
export const long = (iso: string) => { const p = parts(iso); return `${p.dd} ${p.month} ${p.yyyy}`; };

export const W = wedding;
export const D = parts(wedding.date);
export const PLACE = `${wedding.place.city} · ${wedding.place.country}`;
export const NAMES = `${wedding.couple.first} & ${wedding.couple.second}`;

/** Zeitpunkt, auf den der Countdown zählt (Programmpunkt am Hochzeitstag). */
export function countdownTarget(): number {
  const item = wedding.timeline.find((t) => t.id === wedding.countdownTo) ?? wedding.timeline[0];
  const time = item ? item.time : '16:00';
  return new Date(`${wedding.date}T${time}:00${wedding.utcOffset}`).getTime();
}
