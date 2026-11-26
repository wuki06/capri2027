import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3D} from './Scene3D';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {depthAt, ev, line, pressureAt, scene, tempAt, wordAt, zoneAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const de = (n: number) => Math.round(n).toLocaleString('de-DE');

const Hud: React.FC = () => {
  const t = useT();
  if (t < line('h2').start) return null;
  const d = depthAt(t);
  const light = 100 * Math.exp(-d / 45);
  const op = lerp(t, line('h2').start, line('h2').start + 0.4, 0, 1);
  return (
    <div style={{position: 'absolute', top: 140, left: 50, right: 50, fontFamily: FONT, opacity: op, fontVariantNumeric: 'tabular-nums'}}>
      <div style={{textAlign: 'center', background: 'rgba(0,10,20,0.5)', border: '2px solid rgba(120,220,255,0.25)', borderRadius: 28, padding: '12px 0 16px'}}>
        <div style={{fontSize: 26, fontWeight: 800, letterSpacing: 8, color: 'rgba(200,240,255,0.75)'}}>TIEFE</div>
        <div style={{fontSize: 112, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: glow(C.cyan, 0.8)}}>{de(d)} m</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 34, marginTop: 10, fontSize: 30, fontWeight: 800}}>
          <span style={{color: C.yellow}}>{de(pressureAt(d))} bar</span>
          <span style={{color: '#9fd8ff'}}>{tempAt(d).toFixed(1).replace('.', ',')} °C</span>
          <span style={{color: light > 1 ? '#fff6c0' : 'rgba(255,255,255,0.45)'}}>LICHT {light >= 1 ? `${Math.round(light)} %` : '0 %'}</span>
        </div>
      </div>
      <div style={{textAlign: 'center', marginTop: 10, fontSize: 30, fontWeight: 900, letterSpacing: 6, color: d >= 6000 ? C.red : C.cyan, textShadow: glow(d >= 6000 ? C.red : C.cyan, 0.4)}}>{zoneAt(d)}</div>
    </div>
  );
};

const MARKS: [number, string][] = [
  [332, 'Taucher-Rekord'],
  [1000, 'Dunkelheit'],
  [3800, 'Titanic'],
  [6000, 'Hadal-Zone'],
  [8336, 'tiefster Fisch'],
  [10898, '???'],
];
const Gauge: React.FC = () => {
  const t = useT();
  if (t < line('h2').start || t > line('d9').start - 0.2) return null;
  const d = depthAt(t);
  const top = 560;
  const h = 720;
  const y = (x: number) => top + (x / 11000) * h;
  const op = lerp(t, line('h2').start, line('h2').start + 0.4, 0, 1) * lerp(t, line('d9').start - 0.5, line('d9').start - 0.2, 1, 0);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: op, fontFamily: FONT}}>
      <div style={{position: 'absolute', right: 70, top, width: 10, height: h, borderRadius: 5, background: 'linear-gradient(#5fd0ff, #0a3a6a 15%, #02101c 40%, #000)'}} />
      {MARKS.map(([m, lbl]) => (
        <div key={m} style={{position: 'absolute', right: 92, top: y(m) - 14, fontSize: 22, fontWeight: 800, color: d >= m - 5 ? '#fff' : 'rgba(255,255,255,0.45)', textAlign: 'right', whiteSpace: 'nowrap'}}>
          {lbl === '???' && t < ev.reveal ? '???' : lbl} <span style={{color: 'rgba(160,220,255,0.8)'}}>{de(m)} m</span> —
        </div>
      ))}
      <div style={{position: 'absolute', right: 58, top: y(d) - 17, width: 34, height: 34, borderRadius: 17, background: C.yellow, boxShadow: `0 0 20px ${C.yellow}`}} />
    </div>
  );
};

const Station: React.FC = () => {
  const t = useT();
  const st = [
    {id: 'd1', txt: 'REKORD-TAUCHGANG · 332 m', col: C.cyan},
    {id: 'd3', txt: 'ANGLERFISCH', col: C.lime},
    {id: 'd4', txt: 'POTTWAL vs. RIESENKALMAR', col: C.lime},
    {id: 'd5', txt: 'TITANIC · 3.800 m', col: C.orange},
    {id: 'd6', txt: 'DUMBO-OKTOPUS', col: C.magenta},
    {id: 'd7', txt: 'TIEFSTER FISCH · 8.336 m', col: C.cyan},
  ];
  const cur = st.find((s) => t >= line(s.id).start + 0.2 && t < line(s.id).end + 0.3);
  if (!cur) return null;
  return (
    <Pill color={cur.col} at={line(cur.id).start + 0.2} until={line(cur.id).end + 0.3} top={1170} size={40}>
      {cur.txt}
    </Pill>
  );
};

const Pressure: React.FC = () => {
  const t = useT();
  const l = line('d8');
  if (t < wordAt('d8', 'Auto') - 0.1 || t > l.end + 0.3) return null;
  const p = lerp(t, wordAt('d8', 'Auto') - 0.1, wordAt('d8', 'Auto') + 0.3, 0, 1);
  return (
    <div style={{position: 'absolute', top: 600, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: p, transform: `scale(${0.7 + 0.3 * p})`}}>
      <svg width={420} height={300} viewBox="0 0 420 300">
        <rect x={60} y={40} width={300} height={110} rx={30} fill="#d4141c" />
        <rect x={120} y={0} width={180} height={70} rx={20} fill="#9a0e14" />
        <circle cx={120} cy={150} r={34} fill="#111" />
        <circle cx={300} cy={150} r={34} fill="#111" />
        <path d="M180 190 Q210 175 240 190 L250 300 L170 300 Z" fill="#e8b898" />
        <ellipse cx={210} cy={195} rx={30} ry={14} fill="#f4d0b8" />
      </svg>
      <div style={{fontSize: 64, fontWeight: 900, color: '#fff', textShadow: glow(C.yellow, 0.7)}}>≈ 1 TONNE pro cm²</div>
    </div>
  );
};

const Everest: React.FC = () => {
  const t = useT();
  const l = line('d9');
  if (t < wordAt('d9', 'Everest') - 0.1 || t > l.end + 0.4) return null;
  const p = lerp(t, wordAt('d9', 'Everest') - 0.1, wordAt('d9', 'Everest') + 0.5, 0, 1);
  const sink = lerp(t, wordAt('d9', 'versenken'), wordAt('d9', 'versenken') + 1.2, 0, 1);
  const W = 640;
  const H = 520;
  const sy = (m: number) => 40 + (m / 11000) * (H - 60);
  const peakY = sy(10935 - 8849) * sink + (1 - sink) * (sy(0) - 120);
  const baseY = peakY + (sy(8849) - sy(0));
  return (
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p, fontFamily: FONT}}>
      <svg width={W} height={H + 40} viewBox={`0 0 ${W} ${H + 40}`}>
        <rect x={0} y={sy(0)} width={W} height={H} fill="rgba(10,60,110,0.55)" />
        <path d={`M0 ${sy(0)} L0 ${sy(3000)} L180 ${sy(6000)} L260 ${sy(10935)} L380 ${sy(10935)} L460 ${sy(6000)} L${W} ${sy(3000)} L${W} ${sy(0)} Z`} fill="none" />
        <path d={`M0 ${sy(3000)} L180 ${sy(6000)} L260 ${sy(10935)} L380 ${sy(10935)} L460 ${sy(6000)} L${W} ${sy(3000)} L${W} ${H + 40} L0 ${H + 40} Z`} fill="#2a2620" />
        <path d={`M200 ${baseY} L320 ${peakY} L440 ${baseY} Z`} fill="#c9ced8" stroke="#fff" strokeWidth={3} />
        <path d={`M300 ${peakY + 30} L320 ${peakY} L340 ${peakY + 30} Z`} fill="#fff" />
        <line x1={320} y1={sy(0)} x2={320} y2={peakY} stroke={C.yellow} strokeWidth={4} strokeDasharray="10 8" opacity={sink} />
        <text x={340} y={(sy(0) + peakY) / 2} fill={C.yellow} fontSize={34} fontWeight={900} opacity={sink}>2,1 km Wasser</text>
        <text x={W / 2} y={30} textAnchor="middle" fill="#fff" fontSize={30} fontWeight={900}>MOUNT EVEREST · 8.849 m</text>
      </svg>
    </div>
  );
};

const Question: React.FC = () => {
  const t = useT();
  const s1 = line('s1');
  if (t < wordAt('s1', 'glaubst') || t > ev.reveal - 0.1) return null;
  const p = lerp(t, wordAt('s1', 'glaubst'), wordAt('s1', 'glaubst') + 0.3, 0, 1);
  return (
    <div style={{position: 'absolute', top: 640, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', fontFamily: FONT, opacity: p}}>
      {['EIN MONSTER?', 'EIN SCHATZ?', 'GAR NICHTS?', '???'].map((o, i) => (
        <div key={o} style={{width: 440, textAlign: 'center', padding: '22px 0', fontSize: 50, fontWeight: 900, color: '#fff', border: `4px solid ${[C.cyan, C.yellow, C.lime, C.red][i]}`, borderRadius: 28, background: 'rgba(0,0,0,0.6)', transform: `rotate(${Math.sin(t * 3 + i) * 2}deg)`, opacity: lerp(t, s1.start + 1 + i * 0.35, s1.start + 1.3 + i * 0.35, 0, 1)}}>
          {o}
        </div>
      ))}
    </div>
  );
};

const Reveal: React.FC = () => {
  const t = useT();
  const p = usePop(ev.reveal + 0.3, 8);
  if (t < ev.reveal || t > scene('reveal').end) return null;
  return (
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `scale(${interpolate(p, [0, 1], [2.2, 1])})`, opacity: Math.min(1, p)}}>
      <div style={{fontSize: 104, fontWeight: 900, color: '#fff', textShadow: glow(C.red, 1.2)}}>PLASTIKTÜTE</div>
      <div style={{fontSize: 40, fontWeight: 800, color: C.red, letterSpacing: 4, marginTop: 8, textShadow: glow(C.red, 0.5)}}>10.898 m · Marianengraben · 1998</div>
    </div>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const hook = scene('hook');
  const flash = t >= ev.reveal - 0.05 ? lerp(t, ev.reveal - 0.05, ev.reveal + 0.5, 0.6, 0) : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 52, near: 0.05, far: 400, position: [0, -2, 0]}} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}}>
        <Scene3D />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.7) 100%)'}} />
      <NeonText at={0.3} until={line('h2').start - 0.1} top={190} size={104} color={C.cyan}>
        11.000 m
        <div style={{fontSize: 40, fontWeight: 800, letterSpacing: 6, marginTop: 10}}>TIEFER GEHT ES NICHT</div>
      </NeonText>
      <Pill color={C.red} at={wordAt('h2', 'Ende')} until={hook.end + 1.5} top={1170} size={40}>AUFLÖSUNG AM GRUND ↓</Pill>
      <Hud />
      <Gauge />
      <Station />
      <Pressure />
      <Everest />
      <Question />
      <Reveal />
      <NeonText at={line('r2').start + 0.2} until={scene('reveal').end} top={760} size={56} color={C.yellow}>
        UNSER MÜLL IST SCHON DA.
      </NeonText>
      <NeonText at={scene('outro').start + 0.1} top={560} size={78} color={C.yellow}>
        HÄTTEST DU DAS
        <br />
        ERWARTET?
      </NeonText>
      <Pill color={C.magenta} at={scene('outro').end - 2.4} top={1170} size={40}>FOLGE FÜR MEHR</Pill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      <Subtitles />
    </AbsoluteFill>
  );
};
