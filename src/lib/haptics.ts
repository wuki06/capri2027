import { wedding } from '../data/wedding';

/** Sehr kurzer Haptik-Impuls (nur wo unterstützt, z. B. Android Chrome). */
export function tick(ms = 8) {
  if (!wedding.effects.haptics) return;
  try { (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(ms); } catch { /* ignore */ }
}
