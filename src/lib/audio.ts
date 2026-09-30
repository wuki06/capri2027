/* ─────────────────────────────────────────────────────────────────────
   Audio
   • Musik: EIN globales <audio>-Element → startet beim Scrollen nie neu
   • startet ausschließlich nach Antippen (kein Autoplay)
   • Quelle zentral: wedding.music.src
   • Umschlag-Klang: wird live synthetisiert (keine Datei, keine fremde Musik)
   ───────────────────────────────────────────────────────────────────── */
import { wedding } from '../data/wedding';
import { asset } from './assets';

const SRC = asset(wedding.music.src);

type Listener = (playing: boolean) => void;

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch { ctx = null; }
  return ctx;
}

class Music {
  private el: HTMLAudioElement | null = null;
  private gain: GainNode | null = null;
  private listeners = new Set<Listener>();
  private fadeRaf = 0;
  private resumeOnVisible = false;
  playing = false;

  get hasFile() { return Boolean(SRC); }
  get available() { return this.hasFile || wedding.music.showWithoutFile; }

  subscribe(fn: Listener) { this.listeners.add(fn); fn(this.playing); return () => { this.listeners.delete(fn); }; }
  private emit() { this.listeners.forEach((l) => l(this.playing)); }

  private ensure() {
    if (this.el || !this.hasFile) return;
    const el = new Audio();
    el.src = SRC;
    el.loop = true;
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    el.addEventListener('ended', () => { this.playing = false; this.emit(); });
    // Nur gleiche Herkunft über WebAudio leiten (sanftes Einblenden auch auf iOS)
    const sameOrigin = SRC.startsWith('/') || SRC.startsWith(location.origin);
    const c = sameOrigin ? getCtx() : null;
    if (c) {
      try {
        const src = c.createMediaElementSource(el);
        this.gain = c.createGain();
        this.gain.gain.value = 0;
        src.connect(this.gain).connect(c.destination);
      } catch { this.gain = null; }
    }
    this.el = el;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.playing) { this.resumeOnVisible = true; this.pause(false); }
      else if (!document.hidden && this.resumeOnVisible) { this.resumeOnVisible = false; void this.play(); }
    });
  }

  private fadeTo(target: number, ms: number, done?: () => void) {
    cancelAnimationFrame(this.fadeRaf);
    const read = () => (this.gain ? this.gain.gain.value : this.el ? this.el.volume : 0);
    const write = (v: number) => {
      if (this.gain) this.gain.gain.value = v;
      else if (this.el) { try { this.el.volume = v; } catch { /* iOS: read-only */ } }
    };
    const from = read();
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / Math.max(1, ms));
      write(from + (target - from) * (k * k * (3 - 2 * k)));
      if (k < 1) this.fadeRaf = requestAnimationFrame(step);
      else done?.();
    };
    this.fadeRaf = requestAnimationFrame(step);
  }

  async play() {
    this.playing = true;
    this.emit();
    if (!this.hasFile) {
      // Platzhalter-Modus: noch keine Audiodatei in wedding.ts eingetragen
      console.info('[Music] Noch keine Audiodatei in public/assets/music/ — nur Vorschau des Buttons.');
      return;
    }
    this.ensure();
    const c = getCtx();
    if (c && c.state === 'suspended') { try { await c.resume(); } catch { /* ignore */ } }
    if (!this.el) return;
    if (!this.gain) { try { this.el.volume = 0; } catch { /* ignore */ } }
    try {
      await this.el.play();
      this.fadeTo(wedding.music.volume, wedding.music.fadeInMs);
    } catch {
      this.playing = false;
      this.emit();
    }
  }

  pause(emit = true) {
    if (emit) { this.playing = false; this.emit(); }
    if (!this.el) return;
    const el = this.el;
    this.fadeTo(0, 600, () => el.pause());
  }

  toggle() { return this.playing ? this.pause() : this.play(); }
}

export const music = new Music();

/* ── Sehr dezenter Umschlag-Klang (synthetisiert) ───────────────────── */
function noiseBuffer(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Wachs bricht: kurzer, gedämpfter Knack */
export function sealCrack() {
  if (!wedding.effects.envelopeSound) return;
  const c = getCtx();
  if (!c) return;
  void c.resume?.();
  const t = c.currentTime;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, 0.12);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  n.connect(bp).connect(g).connect(c.destination);
  n.start(t); n.stop(t + 0.12);

  const o = c.createOscillator();
  o.type = 'sine'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.06, t + 0.008);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(og).connect(c.destination);
  o.start(t); o.stop(t + 0.14);
}

/** Papier gleitet: weiches Rascheln */
export function paperSlide(duration = 0.9, delay = 0) {
  if (!wedding.effects.envelopeSound) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, duration + 0.1);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 0.6;
  bp.frequency.setValueAtTime(900, t);
  bp.frequency.linearRampToValueAtTime(2600, t + duration);
  const hp = c.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 500;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.028, t + duration * 0.25);
  g.gain.linearRampToValueAtTime(0.018, t + duration * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, t + duration);
  n.connect(hp).connect(bp).connect(g).connect(c.destination);
  n.start(t); n.stop(t + duration + 0.05);
}
