import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, clamp, easeIn, easeOut, useT} from './lib';

/** 0–3 s: "DIE ZUKUNFT IST DIGITAL." – Kamera taucht durch die Buchstaben */
export const Hook: React.FC = () => {
  const t = useT();
  if (t > 3.2) return null;
  const dive = easeIn((t - 2.2) / 0.85); // 0..1
  const scale = 1 + dive * 14;
  const blur = dive * 14;
  const op = 1 - clamp((t - 2.75) / 0.3);
  const line = (txt: string, at: number, size: number, grad: string, w = 800, moving = false) => (
    <div style={{fontFamily: FONT, fontWeight: w, fontSize: size, letterSpacing: '0.12em', lineHeight: 1.1, whiteSpace: 'nowrap'}}>
      {txt.split('').map((ch, i) => {
        const k = easeOut((t - at - i * 0.035) / 0.55);
        return (
          <span key={i} style={{display: 'inline-block', backgroundImage: grad, backgroundSize: moving ? `${txt.length * 300}% 100%` : '100% 100%', backgroundPosition: moving ? `${shPos + (i / txt.length) * 100 / 3}% 0` : '0 0', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', opacity: k, filter: `blur(${(1 - k) * 18}px)`, transform: `translateZ(0) translateY(${(1 - k) * 30}px) scale(${1.4 - 0.4 * k})`}}>
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
    </div>
  );
  const silver = `linear-gradient(180deg, #ffffff, ${C.silver} 50%, #6f7a8f)`;
  const blue = `linear-gradient(100deg, #9fd8ff 0%, ${C.blue} 30%, #ffffff 38%, ${C.blue} 46%, ${C.violet} 70%, ${C.violet} 100%)`;
  const shPos = 100 - clamp((t - 1.2) / 1.0) * 100;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: op}}>
      <div style={{transform: `scale(${scale})`, filter: `blur(${blur}px)`, textAlign: 'center', position: 'relative', marginTop: -120}}>
        {line('DIE ZUKUNFT IST', 0.55, 64, silver, 300)}
        <div style={{height: 10}} />
        {line('DIGITAL.', 0.95, 150, blue, 900, true)}
      </div>
      {/* Lichtblitz beim Eintauchen */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 46%, rgba(120,170,255,${0.9 * clamp((t - 2.7) / 0.25) * (1 - clamp((t - 2.95) / 0.25))}), transparent 70%)`}} />
    </AbsoluteFill>
  );
};
