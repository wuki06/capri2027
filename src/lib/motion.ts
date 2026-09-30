import type { CSSProperties } from 'react';

export const EASE = 'cubic-bezier(0.65, 0, 0.25, 1)'; // langsam, physisch, ohne Bounce
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const EASE_IN = 'cubic-bezier(0.55, 0, 0.8, 0.2)';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** mappt v aus [a,b] auf 0…1 */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function animate(
  el: Element | null | undefined,
  frames: Keyframe[],
  opts: KeyframeAnimationOptions,
): Promise<void> {
  if (!el) return Promise.resolve();
  const a = el.animate(frames, { fill: 'forwards', easing: EASE, ...opts });
  return a.finished.then(() => undefined).catch(() => undefined);
}

/** CSS-Variablen typsicher als style übergeben */
export const cssVars = (v: Record<string, string | number>) => v as CSSProperties;
