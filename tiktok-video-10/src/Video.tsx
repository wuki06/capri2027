import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3D} from './Scene3D';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {EV, SERIES, ageAt, at, line, scene, wordAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const eur = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`;
const COL = [C.cyan, C.magenta];
const NAMES = ['ANNA', 'BEN'];

const Hud: React.FC = () => {
  const t = useT();
  if (t < line('p1').start || t > scene('reveal').end) return null;
  const age = ageAt(t);
  const hide = age >= 55.5 && t < EV.end;
  const op = lerp(t, line('p1').start, line('p1').start + 0.4, 0, 1);
  return (
    <div style={{position: 'absolute', top: 130, left: 40, right: 40, fontFamily: FONT, opacity: op}}>
      <div style={{textAlign: 'center', marginBottom: 12}}>
        <span style={{fontSize: 30, fontWeight: 800, letterSpacing: 8, color: 'rgba(255,255,255,0.7)'}}>ALTER </span>
        <span style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: glow(C.yellow, 0.7), fontVariantNumeric: 'tabular-nums'}}>{Math.floor(age)}</span>
      </div>
      <div style={{display: 'flex', gap: 20, justifyContent: 'center'}}>
        {[0, 1].map((p) => {
          const v = at(p, age);
          const saving = p === 0 ? age < 30 : age >= 30 && age < 65;
          return (
            <div key={p} style={{width: 470, padding: '14px 0', textAlign: 'center', background: 'rgba(0,0,0,0.6)', border: `3px solid ${COL[p]}`, borderRadius: 24}}>
              <div style={{fontSize: 32, fontWeight: 900, color: COL[p], letterSpacing: 4}}>
                {NAMES[p]} <span style={{fontSize: 22, color: saving ? C.lime : 'rgba(255,255,255,0.5)'}}>{saving ? '● spart' : '○ spart nicht'}</span>
              </div>
              <div style={{fontSize: 64, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: glow(COL[p], 0.4)}}>{hide ? '??? €' : eur(v.value)}</div>
              <div style={{fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.75)'}}>eingezahlt: {eur(v.paid)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Chart: React.FC = () => {
  const t = useT();
  const e1 = line('e1');
  if (t < e1.start || t > scene('explain').end) return null;
  const W = 900;
  const H = 520;
  const k = lerp(t, e1.start, e1.start + 2.5, 0, 1);
  const n = SERIES[0].length;
  const path = (p: number, key: 'value' | 'paid') =>
    SERIES[p]
      .slice(0, Math.max(2, Math.floor(n * k)))
      .filter((_, i) => i % 3 === 0)
      .map((pt, i) => `${i ? 'L' : 'M'}${((pt.age - 20) / 45) * W},${H - (pt[key] / 190000) * H}`)
      .join(' ');
  return (
    <div style={{position: 'absolute', top: 150, left: 90, fontFamily: FONT}}>
      <svg width={W} height={H + 70} style={{background: 'rgba(0,0,0,0.7)', borderRadius: 24}}>
        {[0, 1].map((p) => (
          <g key={p}>
            <path d={path(p, 'paid')} fill="none" stroke={COL[p]} strokeWidth={4} strokeDasharray="10 8" opacity={0.6} />
            <path d={path(p, 'value')} fill="none" stroke={COL[p]} strokeWidth={8} />
          </g>
        ))}
        {[20, 30, 40, 50, 60].map((a) => (
          <text key={a} x={((a - 20) / 45) * W + 8} y={H + 40} fill="rgba(255,255,255,0.7)" fontSize={26} fontWeight={700}>{a}</text>
        ))}
        <text x={20} y={46} fill="#fff" fontSize={30} fontWeight={900}>— Vermögen   - - eingezahlt</text>
      </svg>
    </div>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const hook = scene('hook');
  const p = usePop(EV.freeze, 7);
  const pr = usePop(line('r1').start, 8);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 40, near: 0.02, far: 30, position: [0, 1, 3]}} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}} shadows>
        <Scene3D />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.7) 100%)'}} />
      <NeonText at={0.3} until={line('h2').start} top={200} size={80} color={C.yellow}>
        WUSSTEST DU …
        <div style={{fontSize: 46, fontWeight: 800, marginTop: 12, color: '#fff'}}>10 Jahre sparen &gt; 35 Jahre?</div>
      </NeonText>
      <NeonText at={line('h2').start} until={hook.end} top={200} size={78} color={C.cyan}>
        ANNA <span style={{color: '#fff'}}>vs.</span> <span style={{color: C.magenta, textShadow: glow(C.magenta)}}>BEN</span>
      </NeonText>
      <Pill color={C.yellow} at={wordAt('h2', 'Rate')} until={hook.end} top={1170} size={40}>RATE MIT! 👇</Pill>
      <Pill color="#cfd4da" at={wordAt('p3', 'Silberne')} until={wordAt('p3', 'Goldene') + 1.2} top={1120} size={36}>⚪ SILBER = EINGEZAHLT</Pill>
      <Pill color={C.yellow} at={wordAt('p3', 'Goldene')} until={line('p3').end + 0.3} top={1200} size={36}>🟡 GOLD = ZINSEN</Pill>
      <Hud />
      {t >= EV.freeze && t < EV.runOn && (
        <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 150, color: C.red, border: `12px solid ${C.red}`, borderRadius: 30, padding: '0 40px', transform: `rotate(-7deg) scale(${interpolate(p, [0, 1], [2.4, 1])})`, background: 'rgba(0,0,0,0.5)', textShadow: glow(C.red, 0.6)}}>
            STOPP!
          </div>
        </div>
      )}
      {t >= line('r1').start && t < line('r2').end + 0.3 && (
        <div style={{position: 'absolute', top: 720, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `scale(${interpolate(pr, [0, 1], [2.2, 1])})`, opacity: Math.min(1, pr)}}>
          <div style={{fontSize: 130, fontWeight: 900, color: '#fff', textShadow: glow(C.cyan, 1.2)}}>ANNA 🥇</div>
          <div style={{fontSize: 44, fontWeight: 800, color: C.lime}}>+ 11.548 € mehr – mit 30.000 € weniger eingezahlt</div>
        </div>
      )}
      <Chart />
      <NeonText at={wordAt('e2', 'Zeit')} until={scene('explain').end} top={790} size={92} color={C.yellow}>
        ZEIT &gt; GELD
      </NeonText>
      {t >= line('b1').start && t < scene('bonus').end && (
        <div style={{position: 'absolute', top: 260, left: 90, right: 90, fontFamily: FONT, textAlign: 'center', background: 'rgba(0,0,0,0.75)', border: `4px solid ${C.red}`, borderRadius: 28, padding: '26px 20px', opacity: lerp(t, line('b1').start, line('b1').start + 0.3, 0, 1)}}>
          <div style={{fontSize: 34, fontWeight: 900, color: C.red, letterSpacing: 4}}>⚠ TRADING MIT CFDs</div>
          <div style={{fontSize: 120, fontWeight: 900, color: '#fff', textShadow: glow(C.red, 0.8)}}>&gt; 70 %</div>
          <div style={{fontSize: 36, fontWeight: 800, color: '#fff'}}>der Kleinanleger-Konten verlieren Geld</div>
          <div style={{fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 10}}>laut Pflicht-Risikohinweisen der Broker</div>
        </div>
      )}
      <NeonText at={scene('outro').start + 0.1} top={230} size={70} color={C.lime}>
        🔖 SPEICHERN
        <div style={{fontSize: 40, fontWeight: 800, marginTop: 10, color: '#fff'}}>& an jemand Junges schicken</div>
      </NeonText>
      <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.55)', opacity: t > scene('outro').start ? 1 : t > line('p3').start ? 0.8 : 0}}>
        Keine Anlageberatung · Annahme: 100 €/Monat, 7 % p. a. · Renditen schwanken, Verluste möglich
      </div>
      <Subtitles />
    </AbsoluteFill>
  );
};
