import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3D} from './Scene3D';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {DOM, activeIdx, ev, line, scene, simAt, speedAt, wordAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const fmtH = (m: number) =>
  m < 0.01 ? `${(m * 1000).toFixed(1).replace('.', ',')} mm` : m < 1 ? `${(m * 100).toFixed(1).replace('.', ',')} cm` : `${m.toFixed(m < 10 ? 2 : m < 100 ? 1 : 0).replace('.', ',')} m`;

const Hud: React.FC = () => {
  const t = useT();
  if (t < ev.chainStart - 0.2 || t > ev.impact + 0.4) return null;
  const sim = simAt(t);
  const idx = activeIdx(sim);
  const h = DOM[idx - 1].h;
  const sp = speedAt(t);
  const frozen = t >= ev.freeze && t < ev.finalStart;
  const spTxt = frozen ? '❚❚ PAUSE' : sp < 0.95 ? `ZEITLUPE ×${Math.max(2, Math.round(1 / Math.max(sp, 0.001)))}` : sp < 1.6 ? 'ECHTZEIT' : `ZEITRAFFER ×${Math.round(sp)}`;
  return (
    <div style={{position: 'absolute', top: 140, left: 60, right: 60, fontFamily: FONT, fontVariantNumeric: 'tabular-nums'}}>
      <div style={{display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.5)', borderRadius: 28, padding: '18px 10px', border: '2px solid rgba(255,255,255,0.14)'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: 26, fontWeight: 800, letterSpacing: 6, color: 'rgba(255,255,255,0.7)'}}>STEIN NR.</div>
          <div style={{fontSize: 76, fontWeight: 900, color: C.yellow, textShadow: glow(C.yellow, 0.7)}}>??</div>
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: 26, fontWeight: 800, letterSpacing: 6, color: 'rgba(255,255,255,0.7)'}}>HÖHE</div>
          <div style={{fontSize: 76, fontWeight: 900, color: '#fff', textShadow: glow(C.cyan, 0.7), minWidth: 380}}>{fmtH(h)}</div>
        </div>
      </div>
      <div style={{textAlign: 'center', marginTop: 12, fontSize: 28, fontWeight: 800, letterSpacing: 5, color: frozen ? C.red : 'rgba(255,255,255,0.75)'}}>
        <span style={{color: C.red, opacity: Math.floor(t * 2) % 2 ? 1 : 0.3}}>●</span> {spTxt}
      </div>
    </div>
  );
};

const Compare: React.FC = () => {
  const t = useT();
  const items = [
    {at: wordAt('c1', 'Münze'), until: line('c2').start - 0.1, txt: '≈ MÜNZE · 2,3 cm', col: C.cyan},
    {at: wordAt('c2', 'Mensch'), until: line('c3').start - 0.1, txt: '≈ MENSCH · 1,8 m', col: C.lime},
    {at: wordAt('c3', 'Haus'), until: line('c4').start - 0.1, txt: '≈ HAUS · 10 m', col: C.orange},
    {at: wordAt('c4', 'Kirchturm'), until: ev.freeze, txt: '> KIRCHTURM · 80 m', col: C.magenta},
  ];
  const cur = items.find((i) => t >= i.at && t < i.until);
  if (!cur) return null;
  return <Pill color={cur.col} at={cur.at} until={cur.until} top={1170} size={44}>{cur.txt}</Pill>;
};

const Stopp: React.FC = () => {
  const t = useT();
  const p = usePop(ev.freeze, 7);
  if (t < ev.freeze || t > line('s2').start) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 170, color: C.red, border: `12px solid ${C.red}`, borderRadius: 30, padding: '0 40px', transform: `rotate(-8deg) scale(${interpolate(p, [0, 1], [2.4, 1])})`, textShadow: glow(C.red, 0.8), boxShadow: `0 0 40px ${C.red}`, background: 'rgba(0,0,0,0.5)'}}>
        STOPP!
      </div>
    </div>
  );
};

const Guess: React.FC = () => {
  const t = useT();
  const s2 = line('s2');
  if (t < s2.start || t > line('s3').start) return null;
  const opts = ['50?', '100?', '1000?', '1 Mio?'];
  return (
    <div style={{position: 'absolute', top: 560, left: 70, right: 70, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', fontFamily: FONT}}>
      {opts.map((o, i) => {
        const at = s2.start + 0.3 + i * 0.45;
        const p = Math.min(1, Math.max(0, (t - at) * 5));
        return (
          <div key={o} style={{width: 420, padding: '26px 0', textAlign: 'center', fontSize: 70, fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,0.6)', border: `4px solid ${[C.cyan, C.lime, C.magenta, C.orange][i]}`, borderRadius: 30, boxShadow: `0 0 26px ${[C.cyan, C.lime, C.magenta, C.orange][i]}88`, opacity: p, transform: `scale(${0.6 + 0.4 * p}) rotate(${Math.sin(t * 3 + i) * 2}deg)`}}>
            {o}
          </div>
        );
      })}
    </div>
  );
};

const Reveal: React.FC = () => {
  const t = useT();
  const p = usePop(line('r1').start, 8);
  const r2 = line('r2');
  if (t < line('r1').start || t > scene('reveal').end) return null;
  return (
    <>
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `scale(${interpolate(p, [0, 1], [2.6, 1])})`, opacity: Math.min(1, p)}}>
        <div style={{fontSize: 300, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: glow(C.red, 1.4)}}>29</div>
        <div style={{fontSize: 74, fontWeight: 900, letterSpacing: 14, color: C.red, textShadow: glow(C.red, 0.6)}}>STEINE</div>
      </div>
      {t > wordAt('r2', 'Millimetern') && (
        <div style={{position: 'absolute', top: 820, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, opacity: lerp(t, wordAt('r2', 'Millimetern'), wordAt('r2', 'Millimetern') + 0.3, 0, 1)}}>
          <div style={{fontSize: 76, fontWeight: 900, color: '#fff', textShadow: glow(C.cyan, 0.6)}}>
            5 mm <span style={{color: C.yellow}}>→</span> 426 m
          </div>
          {t > wordAt('r2', 'Macht') && (
            <div style={{fontSize: 44, fontWeight: 800, color: C.lime, marginTop: 14, letterSpacing: 3, textShadow: glow(C.lime, 0.5)}}>
              1,5<sup>28</sup> = 85.223-mal größer
            </div>
          )}
        </div>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: lerp(t, ev.impact, ev.impact + 0.4, 0.6, 0), mixBlendMode: 'screen'}} />
      {t < r2.start + 0.1 && null}
    </>
  );
};

const Moon: React.FC = () => {
  const t = useT();
  const tw = scene('twist');
  if (t < tw.start || t > tw.end) return null;
  const k = t - tw.start;
  const p = Math.min(1, k * 2);
  const bar = lerp(t, wordAt('t1', '63'), wordAt('t1', 'Mond'), 0, 1);
  return (
    <AbsoluteFill style={{background: `rgba(0,0,0,${0.6 * p})`}}>
      <Img src={staticFile('tex/moon_1024.jpg')} style={{position: 'absolute', left: 300, top: 150, width: 480, height: 480, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 80px rgba(220,230,255,0.45)', opacity: p, transform: `scale(${0.8 + 0.2 * p})`}} />
      <div style={{position: 'absolute', left: 120, top: 700, right: 120, fontFamily: FONT, color: '#fff'}}>
        {[
          {lbl: 'MOND', v: '384.400 km', col: 'rgba(255,255,255,0.85)', w: 0.93},
          {lbl: 'STEIN NR. 63', v: '413.645 km', col: C.yellow, w: bar},
        ].map((r) => (
          <div key={r.lbl} style={{marginBottom: 26}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 40, fontWeight: 900}}>
              <span>{r.lbl}</span>
              <span style={{color: r.col, textShadow: glow(r.col, 0.4)}}>{r.v}</span>
            </div>
            <div style={{height: 26, marginTop: 8, borderRadius: 13, background: 'rgba(255,255,255,0.1)'}}>
              <div style={{width: `${r.w * 100}%`, height: '100%', borderRadius: 13, background: r.col, boxShadow: `0 0 18px ${r.col}`}} />
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const hook = scene('hook');
  const tease = wordAt('h2', 'umwerfen');
  const cutFlash = Math.max(lerp(t, tease - 0.1, tease + 0.25, 0.8, 0) * (t > tease - 0.1 ? 1 : 0), lerp(t, ev.chainStart - 0.05, ev.chainStart + 0.3, 0.6, 0) * (t > ev.chainStart - 0.05 ? 1 : 0));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 40, near: 0.001, far: 5000, position: [0, 0.01, 0.02]}} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}} shadows>
        <Scene3D />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)'}} />

      <NeonText at={0.3} until={tease - 0.1} top={170} size={86} color={C.cyan}>
        5 MILLIMETER
      </NeonText>
      <NeonText at={tease} until={hook.end} top={170} size={70} color={C.yellow}>
        KANN ER DAS
        <br />
        UMWERFEN?
      </NeonText>
      <Pill color={C.red} at={wordAt('h3', 'Ende')} until={hook.end} top={1170} size={40}>AUFLÖSUNG AM ENDE ↓</Pill>
      <NeonText at={line('u1').start} until={line('u2').start - 0.1} top={170} size={120} color={C.lime}>
        × 1,5
        <div style={{fontSize: 36, fontWeight: 700, letterSpacing: 3, marginTop: 6}}>Whitehead, 1983</div>
      </NeonText>
      <NeonText at={line('u2').start} until={scene('rule').end} top={170} size={64} color={C.cyan}>
        JEDER STEIN
        <br />
        1,5-MAL GRÖSSER
      </NeonText>
      <NeonText at={wordAt('q1', '400')} until={line('q2').start} top={170} size={78} color={C.yellow}>
        ZIEL: &gt; 400 m
      </NeonText>
      <NeonText at={line('q2').start} until={ev.chainStart - 0.1} top={170} size={80} color={C.magenta}>
        WIE VIELE
        <br />
        STEINE?
      </NeonText>
      <Hud />
      <Compare />
      <Stopp />
      <Guess />
      <Reveal />
      <Moon />
      <NeonText at={scene('outro').start + 0.1} top={170} size={76} color={C.yellow}>
        WIE VIELE HATTEST
        <br />
        DU GETIPPT?
      </NeonText>
      <Pill color={C.magenta} at={scene('outro').end - 2.4} top={1170} size={40}>FOLGE FÜR MEHR RÄTSEL</Pill>
      <AbsoluteFill style={{background: '#fff', opacity: cutFlash, mixBlendMode: 'screen'}} />
      <Subtitles />
    </AbsoluteFill>
  );
};
