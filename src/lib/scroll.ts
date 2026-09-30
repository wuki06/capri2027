/* ─────────────────────────────────────────────────────────────────────
   Minimaler Scroll-Motor (ersetzt GSAP ScrollTrigger, ~2 KB)
   • EIN passiver Scroll-Listener + EIN requestAnimationFrame
   • Lese-Phase (alle Rects) → Schreib-Phase (alle Callbacks): kein Layout-Thrashing
   • Szenen werden nur nahe am Viewport aktualisiert, beim Verlassen auf 0/1 fixiert
   • sauberes Entfernen aller Listener (useScrollScene cleanup)
   ───────────────────────────────────────────────────────────────────── */
import { useEffect, useRef } from 'react';

export interface SceneState {
  /** 0 → 1 während eine hohe (gepinnte) Sektion durchscrollt wird */
  pin: number;
  /** 0 (Oberkante erreicht Viewport-Unterkante) → 1 (Unterkante verlässt Viewport oben) */
  view: number;
  top: number;
  height: number;
  vh: number;
}
type Cb = (s: SceneState) => void;
interface Item { el: HTMLElement; cb: Cb; last: string }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

class ScrollEngine {
  private items = new Set<Item>();
  private globals = new Set<(p: number, velocity: number, y: number) => void>();
  private raf = 0;
  private y = 0;
  private prevY = 0;
  velocity = 0;
  private started = false;

  private onScroll = () => this.schedule();
  private onResize = () => { this.items.forEach((i) => (i.last = '')); this.schedule(); };

  start() {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('orientationchange', this.onResize, { passive: true });
    this.schedule();
  }

  stop() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.started = false;
  }

  schedule() {
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  refresh() { this.items.forEach((i) => (i.last = '')); this.schedule(); }

  add(el: HTMLElement, cb: Cb) {
    const item: Item = { el, cb, last: '' };
    this.items.add(item);
    this.start();
    this.schedule();
    return () => { this.items.delete(item); };
  }

  onGlobal(fn: (p: number, velocity: number, y: number) => void) {
    this.globals.add(fn);
    this.start();
    this.schedule();
    return () => { this.globals.delete(fn); };
  }

  private tick = () => {
    this.raf = 0;
    const vh = window.innerHeight;
    this.y = window.scrollY;
    const dy = this.y - this.prevY;
    this.prevY = this.y;
    this.velocity = this.velocity * 0.82 + dy * 0.18;

    // 1) Lesen
    const reads: [Item, SceneState][] = [];
    this.items.forEach((item) => {
      const r = item.el.getBoundingClientRect();
      const pinDen = Math.max(1, r.height - vh);
      const s: SceneState = {
        pin: clamp01(-r.top / pinDen),
        view: clamp01((vh - r.top) / (vh + r.height)),
        top: r.top,
        height: r.height,
        vh,
      };
      const key = `${s.pin.toFixed(4)}|${s.view.toFixed(4)}|${vh}`;
      // weit außerhalb sind pin/view auf 0/1 fixiert → key ändert sich nicht mehr
      if (key !== item.last) { item.last = key; reads.push([item, s]); }
    });

    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - vh);
    const progress = clamp01(this.y / max);

    // 2) Schreiben
    for (const [item, s] of reads) item.cb(s);
    this.globals.forEach((g) => g(progress, this.velocity, this.y));

    // Geschwindigkeit ausklingen lassen
    if (Math.abs(this.velocity) > 0.05) this.schedule();
    else if (this.velocity !== 0) { this.velocity = 0; this.globals.forEach((g) => g(progress, 0, this.y)); }
  };
}

export const engine = new ScrollEngine();

/** Registriert eine Scroll-Szene. cb wird nur bei Änderungen aufgerufen. */
export function useScrollScene<T extends HTMLElement>(cb: Cb) {
  const ref = useRef<T | null>(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return engine.add(el, (s) => cbRef.current(s));
  }, []);
  return ref;
}

/** setzt CSS-Variablen ohne React-Render */
export function setVars(el: HTMLElement | null, vars: Record<string, number | string>) {
  if (!el) return;
  for (const k in vars) {
    const v = vars[k];
    el.style.setProperty(k, typeof v === 'number' ? v.toFixed(4) : v);
  }
}
