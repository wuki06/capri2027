import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, FPS, Sub, clamp, easeInOut, easeOut, rand} from './lib';

export const T0 = 14.0;
const W = 1080;
const H = 1920;
const LOGO_W = 900;
const LOGO_H = (LOGO_W * 648) / 2523;
const LX = (W - LOGO_W) / 2;
const LY = 700;

type Pt = {x: number; y: number; r: number; g: number; b: number};
let cache: Pt[] | null = null;
const useLogoPoints = () => {
  const [pts, setPts] = useState<Pt[] | null>(cache);
  const [h] = useState(() => (cache ? null : delayRender('Logo-Partikel')));
  useEffect(() => {
    if (cache) return;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = LOGO_W;
      cv.height = Math.round(LOGO_H);
      const c = cv.getContext('2d')!;
      c.drawImage(img, 0, 0, cv.width, cv.height);
      const d = c.getImageData(0, 0, cv.width, cv.height).data;
      const out: Pt[] = [];
      for (let y = 0; y < cv.height; y += 4)
        for (let x = 0; x < cv.width; x += 4) {
          const i = (y * cv.width + x) * 4;
          if (d[i + 3] > 140) out.push({x: LX + x, y: LY + y, r: d[i], g: d[i + 1], b: d[i + 2]});
        }
      cache = out;
      setPts(out);
      if (h !== null) continueRender(h);
    };
    img.src = staticFile('novyra-logo.png');
  }, [h]);
  return pts;
};

/** 14–18 s: Lichtimpuls, Logo baut sich aus Partikeln auf, Claim & Call-to-Action */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pts = useLogoPoints();
  const ref = useRef<HTMLCanvasElement>(null);
  const s = t - T0;
  const conv = easeInOut((s - 0.35) / 1.35); // Partikel → Logo
  const solid = easeOut((s - 1.45) / 0.5); // scharfes Logo
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv || !pts) return;
    const c = cv.getContext('2d')!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    if (s < 0.2) return;
    c.globalCompositeOperation = 'lighter';
    const fade = 1 - solid * 0.92;
    pts.forEach((p, i) => {
      const a = rand(i) * Math.PI * 2;
      const rad = 500 + rand(i + 1) * 900;
      const sx = W / 2 + Math.cos(a) * rad;
      const sy = 880 + Math.sin(a) * rad * 1.3;
      // individuelle Verzögerung -> fließender Aufbau von links nach rechts
      const d = clamp((conv - (p.x - LX) / LOGO_W * 0.25) / 0.75);
      const k = easeInOut(d);
      const swirl = (1 - k) * 160 * Math.sin(i + t * 3);
      const x = sx + (p.x - sx) * k + swirl * 0.3;
      const y = sy + (p.y - sy) * k + swirl * 0.2;
      const tint = 1 - k;
      const rr = Math.round(p.r * k + 110 * tint);
      const gg = Math.round(p.g * k + 170 * tint);
      const bb = Math.round(p.b * k + 255 * tint);
      const al = (0.25 + 0.75 * clamp((s - 0.2) / 0.4)) * fade;
      c.fillStyle = `rgba(${rr},${gg},${bb},${al})`;
      const sz = 1.6 + tint * 2.4;
      c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    });
  }, [frame, pts, s, conv, solid, t]);
  if (t < T0 - 0.2) return null;
  const pulse = clamp((s - 0.25) / 0.15) * (1 - clamp((s - 0.4) / 0.9));
  const ring = clamp((s - 0.25) / 1.2);
  const sheen = clamp((s - 1.9) / 0.8);
  const push = 0.97 + 0.05 * easeOut(s / 4);
  return (
    <AbsoluteFill style={{opacity: clamp((t - T0 + 0.2) / 0.2)}}>
      {/* Lichtimpuls & anamorpher Lens Flare */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 46%, rgba(170,200,255,${0.9 * pulse}), rgba(60,90,255,${0.35 * pulse}) 30%, transparent 65%)`}} />
      <div style={{position: 'absolute', left: -200, right: -200, top: 880 - 3, height: 6, background: `linear-gradient(90deg, transparent, rgba(120,180,255,${0.9 * pulse}), transparent)`, filter: 'blur(2px)'}} />
      <div style={{position: 'absolute', left: 540 - ring * 900, top: 880 - ring * 900, width: ring * 1800, height: ring * 1800, borderRadius: '50%', border: `3px solid rgba(140,190,255,${0.6 * (1 - ring)})`, boxShadow: `0 0 40px rgba(80,140,255,${0.5 * (1 - ring)})`}} />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
        {/* Glow unter dem Logo */}
        <div style={{position: 'absolute', left: LX - 60, top: LY - 40, width: LOGO_W + 120, height: LOGO_H + 80, background: 'radial-gradient(ellipse, rgba(70,120,255,0.28), transparent 70%)', opacity: solid, filter: 'blur(20px)'}} />
        <Img src={staticFile('novyra-logo.png')} style={{position: 'absolute', left: LX, top: LY, width: LOGO_W, opacity: solid, filter: `drop-shadow(0 0 ${18 * solid}px rgba(120,170,255,0.35))`}} />
        {/* Metallischer Glanz-Sweep über das Logo */}
        <div style={{position: 'absolute', left: LX, top: LY, width: LOGO_W, height: LOGO_H, WebkitMaskImage: `url(${staticFile('novyra-logo.png')})`, WebkitMaskSize: '100% 100%', background: `linear-gradient(105deg, transparent ${sheen * 160 - 40}%, rgba(255,255,255,0.85) ${sheen * 160 - 25}%, transparent ${sheen * 160 - 10}%)`, opacity: sheen > 0 && sheen < 1 ? 1 : 0}} />
      </AbsoluteFill>
      <Sub text="Engineering your digital future." at={T0 + 1.95} top={LY + LOGO_H + 70} size={46} color="#e6ecf8" tracking={0.04} />
      <Sub text="ERP  ·  WEB  ·  DIGITAL SOLUTIONS" at={T0 + 2.4} top={LY + LOGO_H + 150} size={28} color={C.cyan} tracking={0.32} weight={700} />
      <CTA at={T0 + 2.85} />
    </AbsoluteFill>
  );
};

const CTA: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < at) return null;
  const k = easeOut((t - at) / 0.5);
  const shine = clamp((t - at - 0.3) / 0.7);
  return (
    <div style={{position: 'absolute', top: 1360, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * 20}px) scale(${0.94 + 0.06 * k})`}}>
      <div style={{position: 'relative', overflow: 'hidden', padding: '26px 52px', borderRadius: 60, fontFamily: FONT, fontSize: 40, fontWeight: 700, letterSpacing: '0.02em', color: '#fff', background: 'linear-gradient(135deg, rgba(47,123,255,0.9), rgba(139,92,255,0.9))', boxShadow: '0 20px 60px rgba(60,110,255,0.45), inset 0 1px 0 rgba(255,255,255,0.35)'}}>
        Starte deine digitale Zukunft.
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${shine * 160 - 40}%, rgba(255,255,255,0.45) ${shine * 160 - 25}%, transparent ${shine * 160 - 10}%)`}} />
      </div>
    </div>
  );
};
