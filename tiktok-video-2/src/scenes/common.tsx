import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {scene} from '../timeline';
import {useT} from '../ui';

/** Blendet eine Szene ein/aus (mit leichtem Zoom) und rendert nur im Zeitfenster */
export const SceneFrame: React.FC<{id: string; children: React.ReactNode; zoom?: number}> = ({id, children, zoom = 0.04}) => {
  const t = useT();
  const s = scene(id);
  if (t < s.start - 0.02 || t > s.end + 0.02) return null;
  const fin = s.start === 0 ? 1 : interpolate(t, [s.start, s.start + 0.28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const isLast = id === 'outro';
  const fout = isLast ? 1 : interpolate(t, [s.end - 0.22, s.end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const prog = (t - s.start) / (s.end - s.start);
  const sc = 1 + zoom * prog + (1 - fin) * 0.08 - (1 - fout) * 0.06;
  return (
    <AbsoluteFill style={{opacity: Math.min(fin, fout), transform: `scale(${sc})`}}>{children}</AbsoluteFill>
  );
};

/** Kamera-Wackeln nach einem Impuls */
export const shake = (t: number, at: number, amp = 18, dur = 0.5) => {
  const k = t - at;
  if (k < 0 || k > dur) return {x: 0, y: 0};
  const d = Math.pow(1 - k / dur, 2) * amp;
  return {x: Math.sin(k * 90) * d, y: Math.cos(k * 73) * d};
};
