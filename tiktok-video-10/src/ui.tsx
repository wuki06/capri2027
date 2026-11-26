import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {FPS} from './timeline';

export const FONT = "'Inter Display', 'Inter', sans-serif";
export const C = {
  cyan: '#19F7FF',
  magenta: '#FF2BD6',
  yellow: '#FFE14D',
  lime: '#7CFF4F',
  red: '#FF3B5C',
  violet: '#9B5CFF',
  orange: '#FF8A1F',
};

export const useT = () => useCurrentFrame() / FPS;

/** Federnde Einblendung ab Zeitpunkt `at` (Sekunden, absolut) */
export const usePop = (at: number, damping = 12) => {
  const frame = useCurrentFrame();
  return spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 170, mass: 0.7}});
};

export const glow = (color: string, k = 1) =>
  `0 0 ${8 * k}px ${color}, 0 0 ${22 * k}px ${color}, 0 0 ${48 * k}px ${color}99`;

export const NeonText: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  at: number;
  until?: number;
  top: number;
  weight?: number;
  spacing?: number;
  style?: React.CSSProperties;
}> = ({children, color = C.cyan, size = 90, at, until, top, weight = 900, spacing = 2, style}) => {
  const t = useT();
  const p = usePop(at);
  const out = until !== undefined ? interpolate(t, [until - 0.25, until], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  if (t < at - 0.05 || (until !== undefined && t > until)) return null;
  // leichtes Neon-Flackern beim Einschalten
  const flick = t - at < 0.25 ? (Math.floor((t - at) * 40) % 3 === 0 ? 0.45 : 1) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: spacing,
        color: '#fff',
        textShadow: glow(color),
        opacity: Math.min(p, 1) * out * flick,
        transform: `scale(${interpolate(p, [0, 1], [0.6, 1])}) translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
        lineHeight: 1.05,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{children: React.ReactNode; color: string; at: number; until?: number; top: number; size?: number}> = ({
  children,
  color,
  at,
  until,
  top,
  size = 38,
}) => {
  const t = useT();
  const p = usePop(at, 14);
  if (t < at || (until !== undefined && t > until)) return null;
  const out = until !== undefined ? interpolate(t, [until - 0.2, until], [1, 0], {extrapolateLeft: 'clamp'}) : 1;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(1, p) * out}}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: 4,
          color,
          padding: '14px 30px',
          border: `3px solid ${color}`,
          borderRadius: 999,
          background: 'rgba(0,0,0,0.55)',
          boxShadow: `0 0 24px ${color}88, inset 0 0 18px ${color}55`,
          textShadow: `0 0 12px ${color}`,
          transform: `scale(${interpolate(p, [0, 1], [0.5, 1])})`,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Deterministische Pseudo-Zufallszahlen
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Background: React.FC = () => {
  const t = useT();
  const dots = Array.from({length: 70}, (_, i) => {
    const x = rand(i) * 1080;
    const y = (rand(i + 99) * 1920 - t * (8 + rand(i + 7) * 22)) % 1920;
    const r = 1 + rand(i + 3) * 2.2;
    const a = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * (0.6 + rand(i + 5)) + i));
    return <div key={i} style={{position: 'absolute', left: x, top: (y + 1920) % 1920, width: r * 2, height: r * 2, borderRadius: '50%', background: i % 3 ? '#7fdcff' : '#ff8bf0', opacity: a, boxShadow: '0 0 8px #7fdcff'}} />;
  });
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(60,140,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(60,140,255,0.07) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          backgroundPosition: `0px ${(t * 12) % 90}px`,
          maskImage: 'radial-gradient(ellipse at 50% 42%, black 15%, transparent 72%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(40,20,90,0.35), transparent 60%)'}} />
      {dots}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.75) 100%)', pointerEvents: 'none'}} />
);

/** Hochgestellte Zehnerpotenz, z. B. 10⁻⁹ */
export const sup = (n: number) =>
  String(n)
    .split('')
    .map((c) => ({'-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'})[c] ?? c)
    .join('');

export const sci = (x: number, digits = 2) => {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 3) return x.toFixed(Math.max(0, 2 - e)).replace('.', ',');
  const m = x / Math.pow(10, e);
  return `${m.toFixed(digits - 1).replace('.', ',')} · 10${sup(e)}`;
};
