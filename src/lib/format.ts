import { wedding } from '../data/wedding';
import type { Lang } from './i18n';

const MONTHS: Record<Lang, string[]> = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
};

export function parts(iso: string, lang: Lang = 'de') {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d, dd: String(d).padStart(2, '0'), mm: String(m).padStart(2, '0'), month: MONTHS[lang][m - 1], yyyy: String(y) };
}
/** 10 · 07 · 2027 */
export const dots = (iso: string) => { const p = parts(iso); return `${p.dd} · ${p.mm} · ${p.yyyy}`; };
/** DE: 10. Juli 2027 · TR: 10 Temmuz 2027 */
export const long = (iso: string, lang: Lang) => {
  const p = parts(iso, lang);
  return lang === 'de' ? `${p.d}. ${p.month} ${p.yyyy}` : `${p.d} ${p.month} ${p.yyyy}`;
};

export const W = wedding;
export const PLACE = `${wedding.place.city} · ${wedding.place.country}`;

/** Zeitpunkt, auf den der Countdown zählt (Programmpunkt am Hochzeitstag). */
export function countdownTarget(): number {
  const item = wedding.timeline.find((t) => t.id === wedding.countdownTo) ?? wedding.timeline[0];
  const time = item ? item.time : '16:00';
  return new Date(`${wedding.date}T${time}:00${wedding.utcOffset}`).getTime();
}
