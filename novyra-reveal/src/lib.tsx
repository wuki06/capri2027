import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

export const FPS = 30;
export const C = {
  bg: '#030407',
  blue: '#2f7bff',
  cyan: '#4fd2ff',
  violet: '#8b5cff',
  silver: '#d9dee8',
  steel: '#8e97a8',
  green: '#3fae6a',
};
export const FONT = "'Inter Display', 'Inter', system-ui, sans-serif";
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x: number) => Math.pow(clamp(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
export const r = (a: number, b: number, t: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const useT = () => useCurrentFrame() / FPS;

/** Premium-Headline: Silber-Verlauf, weite Laufweite, Buchstaben blenden mit Unschärfe ein */
export const Headline: React.FC<{text: string; at: number; out?: number; size?: number; top: number; grad?: string; tracking?: number; weight?: number}> = ({
  text,
  at,
  out,
  size = 96,
  top,
  grad = `linear-gradient(180deg, #ffffff 0%, ${C.silver} 45%, #7d879a 100%)`,
  tracking = 0.08,
  weight = 800,
}) => {
  const t = useT();
  if (t < at - 0.05 || (out !== undefined && t > out + 0.4)) return null;
  const exit = out !== undefined ? easeIn((t - out) / 0.35) : 0;
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: weight, fontSize: size, letterSpacing: `${tracking}em`, lineHeight: 1.05, whiteSpace: 'pre', transform: `translateY(${-exit * 40}px)`, opacity: 1 - exit}}>
      {text.split('').map((ch, i) => {
        const k = easeOut((t - at - i * 0.025) / 0.45);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              background: grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: `blur(${(1 - k) * 14}px) drop-shadow(0 0 18px rgba(80,140,255,${0.35 * k}))`,
              opacity: k,
              transform: `translateY(${(1 - k) * 26}px) scale(${1 + (1 - k) * 0.15})`,
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
    </div>
  );
};

export const Sub: React.FC<{text: string; at: number; out?: number; top: number; size?: number; color?: string; tracking?: number; weight?: number}> = ({text, at, out, top, size = 42, color = '#c9d3e6', tracking = 0.02, weight = 300}) => {
  const t = useT();
  if (t < at - 0.05 || (out !== undefined && t > out + 0.4)) return null;
  const k = easeOut((t - at) / 0.6);
  const exit = out !== undefined ? easeIn((t - out) / 0.35) : 0;
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, fontWeight: weight, fontSize: size, letterSpacing: `${tracking}em`, color, opacity: k * (1 - exit), filter: `blur(${(1 - k) * 8}px)`, transform: `translateY(${(1 - k) * 16 - exit * 30}px)`}}>
      {text}
    </div>
  );
};

/** Glas-Panel (Glassmorphism) mit feiner Lichtkante */
export const Glass: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; glow?: number}> = ({style, children, glow = 0.35}) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: 26,
      background: 'linear-gradient(145deg, rgba(38,46,70,0.78), rgba(12,15,26,0.82))',
      border: '1.5px solid rgba(150,180,255,0.22)',
      boxShadow: `0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px rgba(60,120,255,${glow * 0.35})`,
      overflow: 'hidden',
      fontFamily: FONT,
      color: '#e8edf7',
      ...style,
    }}
  >
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 35%)', pointerEvents: 'none'}} />
    {children}
  </div>
);
