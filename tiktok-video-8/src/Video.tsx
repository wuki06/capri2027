import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3D} from './Scene3D';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {line, scene, wordAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const RED = '#ff2a3a';

const Stamp: React.FC<{at: number; until: number; text: string; top: number; col?: string; size?: number; rot?: number}> = ({at, until, text, top, col = RED, size = 110, rot = -7}) => {
  const t = useT();
  const p = usePop(at, 7);
  if (t < at || t > until) return null;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color: col, border: `10px solid ${col}`, borderRadius: 18, padding: '4px 30px', transform: `rotate(${rot}deg) scale(${interpolate(p, [0, 1], [2.4, 1])})`, background: 'rgba(0,0,0,0.45)', textShadow: `0 0 18px ${col}`, opacity: Math.min(1, p) * lerp(t, until - 0.25, until, 1, 0), whiteSpace: 'nowrap'}}>
        {text}
      </div>
    </div>
  );
};

const Rain: React.FC<{op: number}> = ({op}) => {
  const f = useCurrentFrame();
  if (op <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: op, backgroundImage: 'repeating-linear-gradient(100deg, rgba(200,220,255,0.10) 0 2px, transparent 2px 23px)', backgroundPosition: `${(f * 7) % 400}px ${(f * 55) % 1920}px`, backgroundSize: '400px 260px', mixBlendMode: 'screen'}} />
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'overlay'}}>
      <svg width="1080" height="1920">
        <filter id="n">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 60} />
        </filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </AbsoluteFill>
  );
};


const Paper: React.FC<{at: number; until: number}> = ({at, until}) => {
  const t = useT();
  const p = usePop(at, 10);
  if (t < at || t > until) return null;
  return (
    <div style={{position: 'absolute', top: 360, left: 90, right: 90, background: '#efe9da', borderRadius: 6, padding: '34px 40px', fontFamily: "'DejaVu Serif', serif", color: '#111', transform: `rotate(-2deg) scale(${interpolate(p, [0, 1], [0.6, 1])})`, opacity: Math.min(1, p) * lerp(t, until - 0.25, until, 1, 0), boxShadow: '0 30px 80px rgba(0,0,0,0.8)'}}>
      <div style={{fontSize: 28, fontWeight: 700, borderBottom: '3px solid #111', paddingBottom: 8}}>DIE ZEITUNG · 2011</div>
      <div style={{fontFamily: FONT, fontSize: 92, fontWeight: 900, lineHeight: 1, marginTop: 18}}>FREISPRUCH</div>
      <div style={{fontFamily: FONT, fontSize: 40, fontWeight: 800, marginTop: 14}}>Bauer war nie zerstückelt – Familie unschuldig verurteilt</div>
      {Array.from({length: 6}, (_, i) => (
        <div key={i} style={{height: 12, width: `${70 + ((i * 37) % 30)}%`, background: 'rgba(0,0,0,0.35)', marginTop: 16}} />
      ))}
    </div>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const hook = scene('hook');
  const cuts = [scene('night').start, scene('interrogation').start, scene('court').start, scene('river').start, scene('epilog').start, scene('outro').start];
  const flash = Math.max(0, ...cuts.map((c) => (t >= c - 0.05 ? lerp(t, c - 0.05, c + 0.25, 0.3, 0) : 0)));
  const rainOp = t < scene('interrogation').start ? 0.75 : t >= scene('river').start && t < scene('epilog').start ? 0.25 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 44, near: 0.03, far: 120, position: [0, 1, 3]}} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}} shadows>
        <Scene3D />
      </ThreeCanvas>
      <Rain op={rainOp} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.8) 100%)'}} />
      <Grain />

      <NeonText at={0.4} until={line('h2').start} top={190} size={74} color={RED}>
        SPURLOS
        <div style={{fontSize: 36, fontWeight: 700, letterSpacing: 6, marginTop: 10, color: '#fff'}}>OKTOBER 2001 · BAYERN</div>
      </NeonText>
      <NeonText at={wordAt('h2', 'Familie')} until={hook.end} top={190} size={64} color={C.yellow}>
        DIE FAMILIE
        <br />
        GESTEHT
      </NeonText>
      <Pill color={RED} at={wordAt('h2', 'Unglaubliches')} until={hook.end} top={1170} size={38}>BLEIB BIS ZUM ENDE ↓</Pill>
      <Stamp at={line('a2').start} until={scene('night').end} text="KEINE SPUR" top={210} size={110} />
      <Stamp at={wordAt('b1', 'Geständnis')} until={line('b3').start - 0.1} text="GESTÄNDNIS" top={200} size={100} col={C.yellow} rot={-4} />
      <Stamp at={wordAt('b3', 'widerrufen')} until={scene('interrogation').end} text="WIDERRUFEN" top={200} size={100} col={C.cyan} rot={5} />
      <Stamp at={wordAt('b4', 'Verurteilt')} until={wordAt('b4', 'Beweise') - 0.1} text="VERURTEILT · 2005" top={200} size={84} />
      <Stamp at={wordAt('b4', 'Beweise')} until={scene('court').end} text="BEWEISE: 0" top={200} size={110} col={C.yellow} rot={-6} />
      <NeonText at={wordAt('s1', 'März')} until={line('s2').start} top={200} size={58} color={C.cyan}>
        10.03.2009 · DONAU
      </NeonText>
      <NeonText at={line('s2').start} until={line('r1').start - 0.2} top={190} size={74} color={C.yellow}>
        WER SITZT
        <br />
        DARIN?
      </NeonText>
      <Stamp at={line('r1').start + 0.1} until={wordAt('r1', 'vollständig') - 0.1} text="RUDI R." top={210} size={120} col={C.lime} rot={-3} />
      <Stamp at={wordAt('r1', 'vollständig')} until={scene('reveal').end} text="VOLLSTÄNDIG" top={210} size={100} col={C.lime} rot={-5} />
      <Paper at={line('r3').start} until={line('r4').start} />
      <NeonText at={wordAt('r3', 'ungeklärt')} until={line('r4').start} top={1060} size={48} color={C.yellow}>
        TODESURSACHE: UNGEKLÄRT
      </NeonText>
      <NeonText at={line('r4').start} until={scene('epilog').end} top={240} size={58} color={RED}>
        ENTSCHÄDIGUNG:
        <br />
        VERWEIGERT
      </NeonText>
      <NeonText at={scene('outro').start + 0.1} top={190} size={64} color={C.yellow}>
        EIN MORD,
        <br />
        DEN ES NIE GAB
      </NeonText>
      <Pill color={RED} at={scene('outro').end - 2.4} top={1170} size={40}>FOLGE FÜR MEHR TRUE CRIME</Pill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      <Subtitles />
    </AbsoluteFill>
  );
};

export const _g = glow;
