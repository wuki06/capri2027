import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {FPS, TL, Word} from './timeline';
import {C, FONT} from './ui';

type Chunk = {words: Word[]; start: number; end: number};

// Schlagwörter in Akzentfarben
const KEY: [RegExp, string][] = [
  [/spurlos|mord|erschlagen|zerstückelt|verfüttert|grausam|verurteilt|totschlag/i, '#ff2a3a'],
  [/^\d|donau|auto|steuer|gefängnis/i, C.yellow],
  [/vollständig|freigesprochen|nie|ungeklärt|unglaubliches/i, C.lime],
  [/geständnis|widerrufen|kommentare|meinung/i, C.cyan],
];

const buildChunks = (): Chunk[] => {
  const chunks: Chunk[] = [];
  for (const l of TL.lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) chunks.push({words: cur, start: cur[0].s, end: cur[cur.length - 1].e});
      cur = [];
    };
    for (const w of l.words) {
      cur.push(w);
      const chars = cur.map((x) => x.w).join(' ').length;
      if (/[.,!?:…]$/.test(w.w) || cur.length >= 3 || chars > 17) flush();
    }
    flush();
  }
  // Anzeigedauer bis zum nächsten Chunk (max. 0,45 s Nachlauf)
  for (let i = 0; i < chunks.length; i++) {
    const next = chunks[i + 1]?.start ?? Infinity;
    chunks[i].end = Math.min(next, chunks[i].end + 0.45);
  }
  return chunks;
};
const CHUNKS = buildChunks();

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunk = CHUNKS.find((c) => t >= c.start - 0.04 && t < c.end);
  if (!chunk) return null;
  const p = spring({frame: frame - Math.round(chunk.start * FPS) + 1, fps: FPS, config: {damping: 11, stiffness: 220, mass: 0.6}});
  return (
    <div
      style={{
        position: 'absolute',
        top: 1360,
        left: 60,
        right: 60,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 22px',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 84,
        lineHeight: 1.12,
        transform: `scale(${interpolate(p, [0, 1], [0.72, 1])}) translateY(${interpolate(p, [0, 1], [26, 0])}px)`,
        opacity: Math.min(1, p * 1.4),
      }}
    >
      {chunk.words.map((w, i) => {
        const active = t >= w.s && t < w.e + 0.05;
        const spoken = t >= w.s;
        const key = KEY.find(([re]) => re.test(w.w))?.[1];
        const color = key ?? (active ? C.yellow : '#ffffff');
        const wp = spring({frame: frame - Math.round(w.s * FPS), fps: FPS, config: {damping: 9, stiffness: 260, mass: 0.5}});
        return (
          <span
            key={i}
            style={{
              color: spoken ? color : 'rgba(255,255,255,0.88)',
              display: 'inline-block',
              transform: `scale(${spoken ? interpolate(wp, [0, 1], [1.07, 1]) : 1})`,
              WebkitTextStroke: '3px rgba(0,0,0,0.9)',
              paintOrder: 'stroke fill',
              textShadow: spoken && (key || active)
                ? `0 0 18px ${color}, 0 0 40px ${color}aa, 0 6px 0 rgba(0,0,0,0.9)`
                : '0 6px 0 rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.9)',
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
