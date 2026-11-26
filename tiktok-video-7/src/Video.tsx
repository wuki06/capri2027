import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Geo, Scene3D, geoUrl} from './Scene3D';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {line, scene, wordAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const RED = '#ff2a3a';

let geoCache: Geo | null = null;
const useGeo = () => {
  const [g, setG] = useState<Geo | null>(geoCache);
  const [h] = useState(() => (geoCache ? null : delayRender('Karte')));
  useEffect(() => {
    if (geoCache) return;
    Promise.all(['DEU', 'AUT', 'FRA', 'CHE'].map((c) => fetch(geoUrl(c)).then((r) => r.json()).then((j) => [c, j] as const))).then((all) => {
      const out: Geo = {};
      for (const [c, j] of all) {
        const geom = j.features[0].geometry;
        const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
        out[c] = polys.map((p: number[][][]) => p[0]);
      }
      geoCache = out;
      setG(out);
      if (h !== null) continueRender(h);
    });
  }, [h]);
  return g;
};

const Counter: React.FC = () => {
  const t = useT();
  const s = scene('map');
  if (t < line('p1').start || t > scene('heilbronn').end) return null;
  const p1 = line('p1').start + 1.2;
  const p3 = line('p3').end;
  let n = 0;
  for (let i = 0; i < 39; i++) if (t >= p1 + (i / 39) ** 1.3 * (p3 - p1)) n++;
  if (t > wordAt('p4', 'Heilbronn')) n = 40;
  const op = lerp(t, s.start, s.start + 0.4, 0, 1);
  return (
    <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: op}}>
      <div style={{fontSize: 30, fontWeight: 800, letterSpacing: 10, color: 'rgba(255,255,255,0.7)'}}>TATORTE</div>
      <div style={{fontSize: 130, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: glow(RED, 0.9), fontVariantNumeric: 'tabular-nums'}}>{n}</div>
      <div style={{fontSize: 30, fontWeight: 800, color: RED, letterSpacing: 4, marginTop: 6}}>1 DNA-SPUR · 0 GESICHTER</div>
    </div>
  );
};

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

export const Video: React.FC = () => {
  const t = useT();
  const geo = useGeo();
  const hook = scene('hook');
  const cuts = [scene('map').start, scene('board').start, scene('swab').start, scene('epilog').start];
  const flash = Math.max(0, ...cuts.map((c) => (t >= c - 0.05 ? lerp(t, c - 0.05, c + 0.25, 0.35, 0) : 0)));
  const hb = scene('heilbronn');
  const police = t > wordAt('p4', 'Heilbronn') - 0.2 && t < hb.end ? Math.sin(t * 14) : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {geo && (
        <ThreeCanvas width={1080} height={1920} camera={{fov: 45, near: 0.02, far: 60, position: [0, 0, 3]}} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}} shadows>
          <Scene3D geo={geo} />
        </ThreeCanvas>
      )}
      <Rain op={t < hook.end ? 0.8 : t > hb.start && t < hb.end ? 0.7 : 0} />
      {police !== 0 && <AbsoluteFill style={{background: police > 0 ? `rgba(30,60,255,${0.16 * police})` : `rgba(255,20,30,${-0.16 * police})`, mixBlendMode: 'screen'}} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.8) 100%)'}} />
      <Grain />

      <NeonText at={0.35} until={line('h2').start} top={190} size={70} color={RED}>
        40 TATORTE
        <br />3 LÄNDER
        <br />
        <span style={{color: C.yellow}}>1 DNA</span>
      </NeonText>
      <NeonText at={line('h2').start} until={hook.end} top={190} size={68} color={RED}>
        WER IST SIE?
      </NeonText>
      <Pill color={C.yellow} at={wordAt('h2', 'glaubt')} until={hook.end} top={1170} size={38}>AUFLÖSUNG AM ENDE ↓</Pill>
      <Counter />
      <Stamp at={wordAt('p4', 'Heilbronn') - 0.1} until={hb.end} text="25.04.2007 · HEILBRONN" top={430} size={62} col={C.yellow} rot={-3} />
      <Stamp at={wordAt('p5', 'Phantom')} until={line('p6').start - 0.1} text="DAS PHANTOM" top={170} size={96} />
      <Stamp at={wordAt('p6', 'Spur')} until={line('s1').start} text="KEINE SPUR" top={190} size={110} />
      <NeonText at={wordAt('s1', 'glaubst')} until={line('r1').start - 0.4} top={1150} size={64} color={C.yellow}>
        WAS GLAUBST DU?
      </NeonText>
      <Stamp at={wordAt('r1', 'Unmöglich')} until={line('r2').start - 0.1} text="UNMÖGLICH?!" top={200} size={100} />
      <Stamp at={wordAt('r2', 'nie')} until={scene('twist').end} text="ES GAB SIE NIE" top={200} size={96} col={C.lime} rot={-5} />
      <NeonText at={wordAt('r3', 'Wattestäbchen')} until={line('r4').start - 0.1} top={190} size={60} color={C.cyan}>
        STERIL
        <span style={{color: RED}}> ≠ </span>
        DNA-FREI
      </NeonText>
      <NeonText at={line('r4').start} until={scene('swab').end} top={170} size={58} color={RED}>
        JAHRELANG
        <br />
        DIE FALSCHE SPUR
      </NeonText>
      <NeonText at={scene('outro').start + 0.1} top={190} size={72} color={C.yellow}>
        HÄTTEST DU
        <br />
        DAS GEAHNT?
      </NeonText>
      <Pill color={RED} at={scene('outro').end - 2.4} top={1170} size={40}>FOLGE FÜR MEHR TRUE CRIME</Pill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      <Subtitles />
    </AbsoluteFill>
  );
};
