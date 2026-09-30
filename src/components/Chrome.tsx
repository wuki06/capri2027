/* Globale, dezente Bedienelemente: Fortschrittsfaden & Scroll-Hinweis */
import { useEffect, useRef } from 'react';
import { engine } from '../lib/scroll';

/** Feiner goldener Faden am rechten Rand, zeigt den Fortschritt der Einladung */
export function ProgressThread({ visible }: { visible: boolean }) {
  const fill = useRef<HTMLSpanElement>(null);
  const bead = useRef<HTMLSpanElement>(null);
  useEffect(() => engine.onGlobal((p) => {
    if (fill.current) fill.current.style.transform = `scaleY(${p.toFixed(4)})`;
    if (bead.current) bead.current.style.transform = `translate3d(-50%, ${(p * 100).toFixed(2)}cqh, 0) rotate(45deg)`;
  }), []);
  return (
    <div className={`thread${visible ? ' is-visible' : ''}`} aria-hidden="true">
      <span ref={fill} className="thread-fill" />
      <span ref={bead} className="thread-bead" />
    </div>
  );
}

/** „Scroll to discover“ — reagiert auf Scroll-Bewegung und verschwindet sanft */
export function ScrollCue({ label, active }: { label: string; active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  useEffect(() => engine.onGlobal((_p, v, y) => {
    const el = root.current;
    if (!el) return;
    const fade = Math.max(0, 1 - y / (window.innerHeight * 0.35));
    el.style.setProperty('--cue', fade.toFixed(3));
    const stretch = 1 + Math.min(1.4, Math.abs(v) * 0.05);
    if (line.current) line.current.style.transform = `scaleY(${stretch.toFixed(3)})`;
  }), []);
  return (
    <div ref={root} className={`cue${active ? ' is-active' : ''}`} aria-hidden="true">
      <p>{label}</p>
      <span ref={line} className="cue-line"><i /></span>
    </div>
  );
}
