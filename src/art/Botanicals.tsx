/* Botanische Elemente — handgezeichnet wirkende SVGs (keine Bilddateien nötig) */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = { x: number; y: number };
const qb = (a: P, c: P, b: P, t: number): P => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
const qbd = (a: P, c: P, b: P, t: number): P => ({
  x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x),
  y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y),
});

const LEAF = 'M0 0 C 7 -5.2 24 -6 36 0 C 24 6 7 5.2 0 0 Z';
const LEAF_VEIN = 'M1 0 L 33 0';

interface BranchProps {
  className?: string;
  seed?: number;
  leaves?: number;
  olives?: number;
  palette?: string[];
  /** Blind-/Folienprägung statt Farbe */
  mono?: string;
  title?: string;
}

/** Olivenzweig (viewBox 400×240, Stiel von links nach rechts) */
export function OliveBranch({ className, seed = 7, leaves = 26, olives = 4, palette, mono, title }: BranchProps) {
  const r = rng(seed);
  const cols = palette ?? ['#66683F', '#737650', '#838A5E', '#98A07A', '#A9B091'];
  const a = { x: 4, y: 36 }, c = { x: 190, y: 40 }, b = { x: 392, y: 170 };
  const items: { x: number; y: number; rot: number; s: number; col: string; under: boolean }[] = [];
  for (let i = 0; i < leaves; i++) {
    const t = 0.06 + (i / leaves) * 0.92 + (r() - 0.5) * 0.02;
    const p = qb(a, c, b, t);
    const d = qbd(a, c, b, t);
    const ang = (Math.atan2(d.y, d.x) * 180) / Math.PI;
    const side = i % 2 === 0 ? -1 : 1;
    const rot = ang + side * (32 + r() * 28);
    const s = (0.72 + r() * 0.5) * (1 - t * 0.28);
    items.push({ x: p.x, y: p.y, rot, s, col: cols[Math.floor(r() * cols.length)], under: r() > 0.72 });
  }
  const fruit: P[] = [];
  for (let i = 0; i < olives; i++) {
    const t = 0.25 + r() * 0.6;
    const p = qb(a, c, b, t);
    fruit.push({ x: p.x + (r() - 0.5) * 18, y: p.y + 10 + r() * 12 });
  }
  const stroke = mono ?? '#6B6A45';
  return (
    <svg className={className} viewBox="0 0 400 240" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d={`M${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      {fruit.map((f, i) => (
        <g key={`o${i}`} transform={`translate(${f.x} ${f.y})`}>
          <path d="M0 -12 Q 2 -6 0 -3" stroke={stroke} strokeWidth="1.1" fill="none" />
          <ellipse cx="0" cy="3" rx="5.2" ry="7" fill={mono ?? (i % 2 ? '#4F5230' : '#5E5A3A')} />
          {!mono && <ellipse cx="-1.6" cy="0.6" rx="1.4" ry="2.4" fill="#fff" opacity="0.28" />}
        </g>
      ))}
      {items.map((l, i) => (
        <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)}) scale(${l.s.toFixed(2)})`}>
          <path d={LEAF} fill={mono ?? (l.under ? '#B8BD9F' : l.col)} />
          <path d={LEAF_VEIN} stroke={mono ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.22)'} strokeWidth="0.7" />
        </g>
      ))}
    </svg>
  );
}

/** Zitrone mit zwei Blättern (viewBox 120×120) */
export function Lemon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="lemonG" cx="38%" cy="35%" r="70%">
          <stop offset="0" stopColor="#F4E6A6" />
          <stop offset=".55" stopColor="#E3CB6E" />
          <stop offset="1" stopColor="#C9A94C" />
        </radialGradient>
      </defs>
      <path d="M58 30 C 64 18 80 10 98 12 C 90 26 76 34 58 30 Z" fill="#7C8255" />
      <path d="M56 30 C 46 16 30 12 16 18 C 26 30 42 34 56 30 Z" fill="#8E9468" />
      <path d="M58 26 L 58 36" stroke="#6B6A45" strokeWidth="2" />
      <path d="M30 70 C 30 48 46 36 62 36 C 82 36 96 52 94 72 C 92 92 76 104 60 104 C 44 104 30 92 30 70 Z" fill="url(#lemonG)" />
      <path d="M92 70 C 98 70 101 72 102 75 C 99 77 95 76 92 74 Z" fill="#C9A94C" />
      <ellipse cx="48" cy="58" rx="9" ry="5" fill="#fff" opacity=".22" transform="rotate(-30 48 58)" />
    </svg>
  );
}

/** Bougainvillea-Ranke (viewBox 300×200) */
export function Bougainvillea({ className, seed = 3 }: { className?: string; seed?: number }) {
  const r = rng(seed);
  const petals = ['#D8A2A2', '#E3B6AE', '#CB9098', '#E8C3BB', '#D29AA0'];
  const fl: { x: number; y: number; s: number; rot: number; c: string }[] = [];
  for (let i = 0; i < 58; i++) {
    const t = r();
    const x = 10 + t * 270 + (r() - 0.5) * 30;
    const y = 30 + Math.sin(t * 3.1) * 40 + t * 90 + (r() - 0.5) * 50;
    fl.push({ x, y, s: 0.6 + r() * 0.7, rot: r() * 360, c: petals[Math.floor(r() * petals.length)] });
  }
  return (
    <svg className={className} viewBox="0 0 300 200" aria-hidden="true">
      <path d="M0 20 C 80 30 150 60 290 170" fill="none" stroke="#7D6F55" strokeWidth="1.6" />
      {fl.slice(0, 16).map((f, i) => (
        <path key={`l${i}`} d={LEAF} fill={i % 2 ? '#7F8659' : '#93996E'} transform={`translate(${f.x} ${f.y + 8}) rotate(${f.rot}) scale(.42)`} />
      ))}
      {fl.map((f, i) => (
        <g key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.rot.toFixed(0)}) scale(${f.s.toFixed(2)})`}>
          <path d="M0 0 C -5 -4 -5 -11 0 -13 C 5 -11 5 -4 0 0 Z" fill={f.c} />
          <path d="M0 0 C -5 -4 -5 -11 0 -13 C 5 -11 5 -4 0 0 Z" fill={f.c} transform="rotate(120)" opacity=".92" />
          <path d="M0 0 C -5 -4 -5 -11 0 -13 C 5 -11 5 -4 0 0 Z" fill={f.c} transform="rotate(240)" opacity=".85" />
          <circle r="1.4" fill="#F4EBD2" />
        </g>
      ))}
    </svg>
  );
}

/** Weiße Blüten (viewBox 200×120) */
export function WhiteFlowers({ className, seed = 11 }: { className?: string; seed?: number }) {
  const r = rng(seed);
  const fl = Array.from({ length: 9 }, () => ({ x: 20 + r() * 160, y: 20 + r() * 80, s: 0.7 + r() * 0.6, rot: r() * 72 }));
  return (
    <svg className={className} viewBox="0 0 200 120" aria-hidden="true">
      {fl.map((f, i) => (
        <path key={`s${i}`} d={LEAF} fill="#8E9468" transform={`translate(${f.x} ${f.y}) rotate(${f.rot * 5}) scale(.5)`} />
      ))}
      {fl.map((f, i) => (
        <g key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.rot.toFixed(0)}) scale(${f.s.toFixed(2)})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="4.2" ry="7.5" fill="#FBF7EE" stroke="#E5DAC4" strokeWidth=".5" transform={`rotate(${a})`} />
          ))}
          <circle r="2.4" fill="#E4C877" />
        </g>
      ))}
    </svg>
  );
}

/** Dünner goldener Zweig als Trenner */
export function SprigDivider({ className }: { className?: string }) {
  const leaves = [-1, 1, -1, 1, -1, 1];
  return (
    <svg className={className} viewBox="0 0 240 24" aria-hidden="true">
      <path d="M8 12 H 232" stroke="currentColor" strokeWidth=".8" />
      {leaves.map((s, i) => (
        <path key={i} d={LEAF} fill="currentColor" opacity=".85" transform={`translate(${86 + i * 12} 12) rotate(${s * 32 - 8}) scale(.34)`} />
      ))}
      <circle cx="120" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}
