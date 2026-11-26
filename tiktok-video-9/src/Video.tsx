import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3D} from './Scene3D';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {EV, METHODS, line, scene, simAt, speedAt, tempAt, timeTo, wordAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const COLS = ['#ff4a50', '#2fd07a', '#4a8cff', '#ffc61a'];
const ICON = ['KÜHLSCHRANK', 'GEFRIERFACH', 'EISWASSER', 'EIS + SALZ'];
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const tempCol = (T: number) => `hsl(${interpolate(T, [4, 25], [200, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}, 95%, 60%)`;

const Thermos: React.FC = () => {
  const t = useT();
  if (t < line('p1').start || t > line('r2').start + 0.2) return null;
  const sim = simAt(t);
  const sp = speedAt(t);
  const op = lerp(t, line('p1').start, line('p1').start + 0.4, 0, 1);
  const frozen = t >= EV.freeze && t < EV.runOn;
  return (
    <div style={{position: 'absolute', top: 130, left: 30, right: 30, fontFamily: FONT, opacity: op}}>
      <div style={{textAlign: 'center', marginBottom: 12}}>
        <span style={{fontSize: 70, fontWeight: 900, color: '#fff', textShadow: glow(C.cyan, 0.6), fontVariantNumeric: 'tabular-nums'}}>⏱ {clock(sim)}</span>
        <div style={{fontSize: 26, fontWeight: 800, letterSpacing: 4, color: frozen ? C.red : 'rgba(255,255,255,0.75)'}}>
          {frozen ? '❚❚ PAUSE' : sp > 1.5 ? `ZEITRAFFER ×${Math.round(sp)}` : 'ZIEL: 6 °C'}
        </div>
      </div>
      <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
        {METHODS.map((m, i) => {
          const T = tempAt(m, sim);
          const fill = interpolate(T, [-5, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const done = T <= 6.05;
          return (
            <div key={m.id} style={{width: 238, padding: '12px 0 14px', textAlign: 'center', background: 'rgba(0,0,0,0.6)', border: `3px solid ${done ? C.lime : COLS[i]}`, borderRadius: 22, boxShadow: done ? `0 0 26px ${C.lime}` : undefined}}>
              <div style={{fontSize: 22, fontWeight: 900, color: COLS[i], letterSpacing: 1}}>{i + 1} · {ICON[i]}</div>
              <div style={{fontSize: 54, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: glow(tempCol(T), 0.5)}}>{T.toFixed(1).replace('.', ',')}°</div>
              <div style={{margin: '4px auto 0', width: 170, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.15)'}}>
                <div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 6, background: tempCol(T)}} />
              </div>
              {done && <div style={{fontSize: 22, fontWeight: 900, color: C.lime, marginTop: 4}}>✓ KALT!</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Ranking: React.FC = () => {
  const t = useT();
  const r2 = line('r2');
  if (t < r2.start || t > scene('reveal').end) return null;
  const rows = [
    {i: 3, time: '≈ 2 Min', at: r2.start},
    {i: 2, time: '≈ 11 Min', at: wordAt('r2', 'Eiswasser')},
    {i: 1, time: '≈ 40 Min', at: wordAt('r2', 'Gefrierfach')},
    {i: 0, time: '> 4 Std', at: wordAt('r3', 'Kühlschrank')},
  ];
  return (
    <div style={{position: 'absolute', top: 170, left: 80, right: 80, fontFamily: FONT}}>
      <div style={{textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: 6, color: '#fff', marginBottom: 14}}>BIS 6 °C BRAUCHT …</div>
      {rows.map((r, k) => {
        const q = lerp(t, r.at, r.at + 0.25, 0, 1);
        return (
          <div key={r.i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 26px', marginBottom: 12, background: 'rgba(0,0,0,0.65)', border: `3px solid ${COLS[r.i]}`, borderRadius: 22, opacity: q, transform: `translateX(${(1 - q) * 80}px) scale(${k === 0 ? 1.06 : 1})`}}>
            <span style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>
              {k === 0 ? '🥇 ' : `${k + 1}. `}
              <span style={{color: COLS[r.i]}}>{ICON[r.i]}</span>
            </span>
            <span style={{fontSize: 48, fontWeight: 900, color: k === 0 ? C.lime : k === 3 ? C.red : '#fff', textShadow: k === 0 ? glow(C.lime, 0.6) : undefined}}>{r.time}</span>
          </div>
        );
      })}
    </div>
  );
};

const Explain: React.FC = () => {
  const t = useT();
  const e1 = line('e1');
  const e2 = line('e2');
  if (t < e1.start || t > scene('explain').end) return null;
  const melt = lerp(t, wordAt('e1', 'kälter') - 0.3, wordAt('e1', 'kälter') + 0.8, 0, -10);
  return (
    <div style={{position: 'absolute', top: 160, left: 70, right: 70, fontFamily: FONT}}>
      {t < e2.start ? (
        <div style={{textAlign: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: 28, padding: '22px 10px', border: `3px solid ${C.cyan}`}}>
          <div style={{fontSize: 34, fontWeight: 900, color: C.cyan, letterSpacing: 3}}>SALZ + EIS</div>
          <div style={{fontSize: 120, fontWeight: 900, color: '#fff', textShadow: glow(C.cyan, 0.8), fontVariantNumeric: 'tabular-nums'}}>{melt.toFixed(0).replace('-', '−')} °C</div>
          <div style={{fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.8)'}}>statt 0 °C bei normalem Eiswasser</div>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div style={{textAlign: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: 26, padding: '16px 10px', border: `3px solid ${C.yellow}`, opacity: lerp(t, e2.start, e2.start + 0.3, 0, 1)}}>
            <div style={{fontSize: 30, fontWeight: 900, color: C.yellow}}>WÄRMELEITUNG</div>
            <div style={{fontSize: 64, fontWeight: 900, color: '#fff'}}>Wasser ≈ 23 × Luft</div>
          </div>
          <div style={{textAlign: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: 26, padding: '16px 10px', border: `3px solid ${C.lime}`, opacity: lerp(t, wordAt('e2', 'Drehen'), wordAt('e2', 'Drehen') + 0.3, 0, 1)}}>
            <div style={{fontSize: 30, fontWeight: 900, color: C.lime}}>DREHEN</div>
            <div style={{fontSize: 56, fontWeight: 900, color: '#fff'}}>⟳ kalte Wand, immer neu</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const hook = scene('hook');
  const p = usePop(EV.freeze, 7);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 40, near: 0.01, far: 20, position: [0, 1, 1]}} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}} shadows>
        <Scene3D />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      <NeonText at={0.3} until={line('h2').start} top={200} size={84} color={C.cyan}>
        WUSSTEST DU …
        <div style={{fontSize: 46, fontWeight: 800, marginTop: 10, color: '#fff'}}>eiskalt in 2 Minuten?</div>
      </NeonText>
      <NeonText at={line('h2').start} until={hook.end} top={200} size={72} color={C.yellow}>
        4 METHODEN
        <br />
        1 GEWINNER
      </NeonText>
      <Pill color={C.magenta} at={wordAt('h2', 'Rate')} until={hook.end} top={1170} size={40}>RATE MIT! 👇</Pill>
      <Thermos />
      {t >= EV.freeze && t < EV.runOn && (
        <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 150, color: C.red, border: `12px solid ${C.red}`, borderRadius: 30, padding: '0 40px', transform: `rotate(-7deg) scale(${interpolate(p, [0, 1], [2.4, 1])})`, background: 'rgba(0,0,0,0.5)', textShadow: glow(C.red, 0.6), opacity: lerp(t, wordAt('s1', 'wie'), wordAt('s1', 'wie') + 0.3, 1, 0)}}>
            STOPP!
          </div>
        </div>
      )}
      {t >= wordAt('s1', 'wie') && t < EV.runOn && (
        <NeonText at={wordAt('s1', 'wie')} until={EV.runOn} top={700} size={66} color={C.yellow}>
          WIE LANGE
          <br />
          BRAUCHEN DIE ANDEREN?
        </NeonText>
      )}
      <Ranking />
      <Explain />
      <NeonText at={scene('outro').start + 0.1} top={200} size={70} color={C.lime}>
        🔖 SPEICHERN
        <div style={{fontSize: 40, fontWeight: 800, marginTop: 10, color: '#fff'}}>für den nächsten Sommer</div>
      </NeonText>
      <Pill color={C.magenta} at={scene('outro').end - 2.4} top={1170} size={40}>FOLGE FÜR MEHR TRICKS</Pill>
      <AbsoluteFill style={{background: '#fff', opacity: t > EV.saltDone - 0.05 ? lerp(t, EV.saltDone - 0.05, EV.saltDone + 0.35, 0.45, 0) : 0, mixBlendMode: 'screen'}} />
      <Subtitles />
    </AbsoluteFill>
  );
};

export const _x = timeTo;
