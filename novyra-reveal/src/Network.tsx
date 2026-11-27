import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, FPS, clamp, easeIn, easeOut, expoOut, rand, useT} from './lib';

const T0 = 11.0;
const T1 = 14.0;
export const IMPACTS = [11.3, 12.3, 13.3];
const W = 1080;
const H = 1920;
const N = 110;
const MODULES = ['ERP', 'CRM', 'API', 'CLOUD', 'WEB', 'AUTOMATION', 'ANALYTICS', 'SHOP'];

// Fibonacci-Kugel
const NODES = Array.from({length: N}, (_, i) => {
  const y = 1 - (i / (N - 1)) * 2;
  const rr = Math.sqrt(1 - y * y);
  const a = i * 2.39996;
  return [Math.cos(a) * rr, y, Math.sin(a) * rr];
});
const EDGES: [number, number][] = [];
for (let i = 0; i < N; i++) {
  const d = NODES.map((p, j) => [j, Math.hypot(p[0] - NODES[i][0], p[1] - NODES[i][1], p[2] - NODES[i][2])] as const).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]);
  d.slice(0, 3).forEach(([j]) => EDGES.push([i, j]));
}

const project = (p: number[], rot: number, tilt: number, R: number) => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  let x = p[0] * c - p[2] * s;
  let z = p[0] * s + p[2] * c;
  const y0 = p[1];
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const y = y0 * ct - z * st;
  z = y0 * st + z * ct;
  const f = 1400 / Math.max(350, 1400 + z * R);
  return {x: W / 2 + x * R * f, y: 780 + y * R * f, z, f};
};

export const Network: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ref = useRef<HTMLCanvasElement>(null);
  const s = t - T0;
  const gather = expoOut(s / 0.9); // Elemente fliegen zusammen
  const collapse = easeIn((t - (T1 - 0.25)) / 0.35); // fällt zum Lichtpunkt zusammen
  const R = 380 * (1 - collapse) * (0.6 + 0.4 * gather) * (1 + 0.04 * Math.max(...IMPACTS.map((p) => Math.exp(-Math.max(0, t - p) * 6) * (t > p ? 1 : 0))));
  const rot = t * 0.55;
  const tilt = 0.35;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const c = ref.current.getContext('2d')!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    if (t < T0 - 0.3 || t > T1 + 0.2) return;
    c.globalCompositeOperation = 'lighter';
    const P = NODES.map((p, i) => {
      // vor dem Zusammenziehen: weit verstreut
      const sc = 1 + (1 - gather) * (2 + rand(i) * 3);
      return project(p.map((v) => v * sc), rot + (1 - gather) * rand(i + 5), tilt, R);
    });
    // Verbindungen + Datenpulse
    EDGES.forEach(([a, b], k) => {
      const A = P[a];
      const B = P[b];
      const depth = (A.z + B.z) / 2;
      const al = (0.18 + 0.32 * (1 - (depth + 1) / 2)) * gather;
      c.strokeStyle = k % 4 === 0 ? `rgba(160,120,255,${al})` : `rgba(80,170,255,${al})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(A.x, A.y);
      c.lineTo(B.x, B.y);
      c.stroke();
      if (k % 3 === 0) {
        const u = (t * (0.8 + rand(k) * 1.2) + rand(k + 1)) % 1;
        const x = A.x + (B.x - A.x) * u;
        const y = A.y + (B.y - A.y) * u;
        const g = c.createRadialGradient(x, y, 0, x, y, 10);
        g.addColorStop(0, `rgba(220,240,255,${0.9 * gather})`);
        g.addColorStop(1, 'rgba(80,170,255,0)');
        c.fillStyle = g;
        c.fillRect(x - 10, y - 10, 20, 20);
      }
    });
    // Knoten
    P.forEach((p, i) => {
      const sz = Math.max(0.5, (2.5 + 4 * (1 - (p.z + 1) / 2)) * p.f);
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 4);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.3, i % 5 === 0 ? 'rgba(170,130,255,0.6)' : 'rgba(90,170,255,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(p.x - sz * 4, p.y - sz * 4, sz * 8, sz * 8);
    });
    // Leuchtender Kern
    const cg = c.createRadialGradient(W / 2, 780, 0, W / 2, 780, Math.max(1, R * 0.9 + 60));
    cg.addColorStop(0, `rgba(140,190,255,${0.35 + collapse * 0.6})`);
    cg.addColorStop(1, 'rgba(40,60,160,0)');
    c.fillStyle = cg;
    c.fillRect(0, 0, W, H);
  }, [frame, gather, collapse, R, rot, t]);
  if (t < T0 - 0.3 || t > T1 + 0.2) return null;
  const words = ['INTELLIGENT.', 'INDIVIDUELL.', 'ZUKUNFTSORIENTIERT.'];
  const shake = IMPACTS.reduce((acc, p) => acc + (t > p ? Math.exp(-(t - p) * 12) * Math.sin((t - p) * 90) * 10 : 0), 0);
  return (
    <AbsoluteFill style={{opacity: clamp((t - T0 + 0.3) / 0.3), transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
      <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
      {/* Software-Module umkreisen das Netzwerk */}
      {MODULES.map((m, i) => {
        const a = (i / MODULES.length) * Math.PI * 2;
        const p = project([Math.cos(a) * 1.25, Math.sin(a * 2) * 0.35, Math.sin(a) * 1.25], rot * 0.7, tilt, R);
        const op = gather * (0.35 + 0.65 * (1 - (p.z + 1) / 2)) * (1 - collapse);
        return (
          <div key={m} style={{position: 'absolute', left: p.x, top: p.y, transform: `translate(-50%, -50%) scale(${p.f})`, padding: '10px 18px', borderRadius: 14, fontFamily: FONT, fontSize: 20, fontWeight: 800, letterSpacing: '0.16em', color: '#dfe8ff', background: 'rgba(20,28,52,0.72)', border: '1.5px solid rgba(120,170,255,0.45)', boxShadow: '0 0 24px rgba(60,120,255,0.35)', opacity: op, zIndex: p.z < 0 ? 2 : 0}}>
            {m}
          </div>
        );
      })}
      {words.map((w, i) => {
        const at = IMPACTS[i];
        const end = i < 2 ? IMPACTS[i + 1] - 0.08 : T1 - 0.15;
        if (t < at - 0.02 || t > end + 0.25) return null;
        const k = easeOut((t - at) / 0.28);
        const ex = easeIn((t - end) / 0.25);
        const size = i === 2 ? 66 : 92;
        return (
          <div key={w} style={{position: 'absolute', top: 1330, left: 40, right: 40, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: '0.06em', whiteSpace: 'nowrap', background: i === 2 ? `linear-gradient(100deg, #9fd8ff, ${C.blue} 45%, ${C.violet})` : 'linear-gradient(180deg, #ffffff, #c9d1e0 50%, #7a8499)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', transform: `scale(${1.35 - 0.35 * k}) translateY(${-ex * 40}px)`, filter: `blur(${(1 - k) * 12 + ex * 10}px) drop-shadow(0 0 22px rgba(80,150,255,0.55))`, opacity: k * (1 - ex)}}>
            {w}
          </div>
        );
      })}
      {/* Impact-Lichtblitze */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 70%, rgba(120,170,255,0.5), transparent 60%)', opacity: IMPACTS.reduce((a, p) => a + (t > p ? Math.exp(-(t - p) * 9) : 0), 0) * 0.8, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};
