import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS, clamp, easeIn, rand} from './lib';

const W = 1080;
const H = 1920;
const F = 900; // Brennweite
const N = 1400;
const STREAKS = 70;

/** Kameraposition (z) über die Zeit: langsamer Flug, ab 2,2 s Beschleunigung ("Eintauchen") */
const camZ = (t: number, warpAt: number) => t * 260 + easeIn((t - warpAt) / 0.8) * 5200 * clamp((t - warpAt) / 0.8 + 0.2);

/**
 * Volumetrischer Partikelraum mit Lichtlinien (Canvas, additive Mischung).
 * intensity: Gesamthelligkeit, warpAt: Beginn der Beschleunigung, hue: Farbmix blau→violett
 */
export const Space: React.FC<{intensity?: number; warpAt?: number; streak?: number; offset?: number}> = ({intensity = 1, warpAt = 99, streak = 1, offset = 0}) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const t = frame / FPS + offset;
    const c = ref.current!.getContext('2d')!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    const z0 = camZ(t, warpAt);
    const speed = (camZ(t + 1 / FPS, warpAt) - z0) * FPS;
    const DEPTH = 4000;
    // Partikel
    for (let i = 0; i < N; i++) {
      const x = (rand(i * 3) - 0.5) * 3200;
      const y = (rand(i * 3 + 1) - 0.5) * 5200;
      let z = rand(i * 3 + 2) * DEPTH - (z0 % DEPTH);
      if (z < 20) z += DEPTH;
      const px = W / 2 + (x / z) * F;
      const py = H / 2 + (y / z) * F;
      if (px < -50 || px > W + 50 || py < -50 || py > H + 50) continue;
      const near = 1 - z / DEPTH;
      const size = 0.6 + near * near * 4.2;
      const a = Math.min(1, near * 1.3) * intensity * (0.5 + 0.5 * Math.sin(t * 2 + i));
      const hue = rand(i + 9);
      const col = hue < 0.6 ? '120,180,255' : hue < 0.85 ? '160,120,255' : '235,240,255';
      // Bewegungsunschärfe: Streifen zur Bildmitte hin, abhängig von der Geschwindigkeit
      const tail = Math.min(400, (speed / 900) * near * near * 60);
      if (tail > 2) {
        const dx = px - W / 2;
        const dy = py - H / 2;
        const len = Math.hypot(dx, dy) || 1;
        c.strokeStyle = `rgba(${col},${a * 0.7})`;
        c.lineWidth = size;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px - (dx / len) * tail, py - (dy / len) * tail);
        c.stroke();
      }
      const g = c.createRadialGradient(px, py, 0, px, py, size * 3);
      g.addColorStop(0, `rgba(${col},${a})`);
      g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g;
      c.fillRect(px - size * 3, py - size * 3, size * 6, size * 6);
    }
    // Elektrische Lichtlinien, die auf die Kamera zufliegen
    for (let i = 0; i < STREAKS; i++) {
      const ang = rand(i * 7) * Math.PI * 2;
      const rad = 260 + rand(i * 7 + 1) * 1300;
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad * 1.5;
      const D2 = 6000;
      let z = rand(i * 7 + 2) * D2 - ((z0 * 1.6 + t * 900) % D2);
      if (z < 30) z += D2;
      const len = 500 + rand(i * 7 + 3) * 1400;
      const z2 = z + len;
      const p1 = [W / 2 + (x / z) * F, H / 2 + (y / z) * F];
      const p2 = [W / 2 + (x / z2) * F, H / 2 + (y / z2) * F];
      const near = 1 - z / D2;
      const a = near * 0.9 * intensity * streak;
      const lg = c.createLinearGradient(p2[0], p2[1], p1[0], p1[1]);
      const col = i % 3 === 0 ? '170,130,255' : '90,170,255';
      lg.addColorStop(0, `rgba(${col},0)`);
      lg.addColorStop(1, `rgba(${col},${a})`);
      c.strokeStyle = lg;
      c.lineWidth = 1 + near * 3;
      c.beginPath();
      c.moveTo(p2[0], p2[1]);
      c.lineTo(p1[0], p1[1]);
      c.stroke();
    }
  }, [frame, intensity, warpAt, streak, offset]);
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, width: W, height: H}} />;
};
