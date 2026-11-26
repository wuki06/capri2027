import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Scene3D} from './Scene3D';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {TL, countsAt, ev, line, scene, wordAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const BLUE = '#2fa4ff';
const PINK = '#ff2bd6';

const Box: React.FC<{label: string; sub: string; value: string; col: string; w?: number}> = ({label, sub, value, col, w = 440}) => (
  <div style={{width: w, textAlign: 'center', padding: '16px 0', background: 'rgba(0,0,0,0.55)', border: `3px solid ${col}`, borderRadius: 26, boxShadow: `0 0 24px ${col}66`}}>
    <div style={{fontSize: 30, fontWeight: 900, letterSpacing: 4, color: col}}>{label}</div>
    <div style={{fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.65)'}}>{sub}</div>
    <div style={{fontSize: 84, fontWeight: 900, color: '#fff', textShadow: glow(col, 0.7), fontVariantNumeric: 'tabular-nums'}}>{value}</div>
  </div>
);

const SimHud: React.FC = () => {
  const t = useT();
  if (t < ev.simStart - 0.3 || t > scene('reveal').end) return null;
  const c = countsAt(t);
  const hidden = t >= ev.cover && t < ev.uncover + 0.4;
  const k = lerp(t, ev.uncover + 0.2, ev.uncover + 1.4, 0, 1);
  const showStay = hidden ? '??' : t >= ev.uncover ? String(Math.round(TL.result.stay * k)) : String(c.stay);
  const showSwap = hidden ? '??' : t >= ev.uncover ? String(Math.round(TL.result.swap * k)) : String(c.swap);
  const pct = t >= ev.uncover + 1.4;
  return (
    <div style={{position: 'absolute', top: 140, left: 0, right: 0, fontFamily: FONT}}>
      <div style={{textAlign: 'center', fontSize: 34, fontWeight: 900, letterSpacing: 6, color: '#fff', marginBottom: 14}}>
        SPIEL <span style={{color: C.yellow, fontVariantNumeric: 'tabular-nums'}}>{c.games}</span> / 1000
      </div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 40}}>
        <Box label="BLAU · BLEIBT" sub="Siege" value={pct ? `${(TL.result.stay / 10).toFixed(1).replace('.', ',')} %` : showStay} col={BLUE} />
        <Box label="PINK · WECHSELT" sub="Siege" value={pct ? `${(TL.result.swap / 10).toFixed(1).replace('.', ',')} %` : showSwap} col={PINK} />
      </div>
    </div>
  );
};

const DoorPick: React.FC = () => {
  const t = useT();
  const g1 = line('g1');
  const g3 = line('g3');
  if (t < wordAt('g1', 'Tür') || t > scene('game').end) return null;
  const p = lerp(t, wordAt('g1', 'Tür'), wordAt('g1', 'Tür') + 0.3, 0, 1);
  return (
    <>
      {t < g3.start && (
        <div style={{position: 'absolute', top: 1160, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p}}>
          <div style={{fontFamily: FONT, fontSize: 44, fontWeight: 900, color: C.cyan, padding: '10px 30px', border: `3px solid ${C.cyan}`, borderRadius: 999, background: 'rgba(0,0,0,0.5)', textShadow: glow(C.cyan, 0.4)}}>
            {t < line('g2').start ? 'DEINE WAHL: TÜR 1' : 'TÜR 3: ZIEGE'}
          </div>
        </div>
      )}
      {t >= g3.start && (
        <div style={{position: 'absolute', top: 1110, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', fontFamily: FONT}}>
          {[
            {txt: 'BLEIBEN', sub: 'bei Tür 1', col: BLUE, at: wordAt('g3', 'Bleibst')},
            {txt: 'WECHSELN', sub: 'zu Tür 2', col: PINK, at: wordAt('g3', 'wechselst')},
          ].map((b) => {
            const q = lerp(t, b.at, b.at + 0.25, 0, 1);
            return (
              <div key={b.txt} style={{width: 440, textAlign: 'center', padding: '16px 0', border: `4px solid ${b.col}`, borderRadius: 28, background: 'rgba(0,0,0,0.6)', boxShadow: `0 0 30px ${b.col}88`, opacity: q, transform: `scale(${0.6 + 0.4 * q})`}}>
                <div style={{fontSize: 56, fontWeight: 900, color: '#fff', textShadow: glow(b.col, 0.6)}}>{b.txt}</div>
                <div style={{fontSize: 28, fontWeight: 700, color: b.col}}>{b.sub}</div>
              </div>
            );
          })}
        </div>
      )}
      {t < g1.start && null}
    </>
  );
};

const Freeze: React.FC = () => {
  const t = useT();
  const s1 = line('s1');
  if (t < s1.start || t > ev.uncover) return null;
  const opts = [
    {txt: 'BLAU', col: BLUE, at: wordAt('s1', 'Blau')},
    {txt: 'PINK', col: PINK, at: wordAt('s1', 'Pink')},
  ];
  return (
    <div style={{position: 'absolute', top: 620, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 50, fontFamily: FONT}}>
      {opts.map((o, i) => {
        const q = lerp(t, o.at, o.at + 0.25, 0, 1);
        return (
          <div key={o.txt} style={{width: 330, padding: '30px 0', textAlign: 'center', fontSize: 80, fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,0.65)', border: `5px solid ${o.col}`, borderRadius: 36, boxShadow: `0 0 36px ${o.col}`, textShadow: glow(o.col, 0.6), opacity: q, transform: `scale(${0.6 + 0.4 * q}) rotate(${Math.sin(t * 4 + i * 2) * 3}deg)`}}>
            {o.txt}?
          </div>
        );
      })}
    </div>
  );
};

const Explain: React.FC = () => {
  const t = useT();
  const r2 = line('r2');
  if (t < r2.start - 0.2 || t > scene('explain').end) return null;
  const rows = [
    {pick: 'AUTO', res: 'Wechseln verliert', col: BLUE, at: wordAt('r2', 'einem')},
    {pick: 'ZIEGE A', res: 'Wechseln gewinnt', col: PINK, at: wordAt('r2', 'anderen')},
    {pick: 'ZIEGE B', res: 'Wechseln gewinnt', col: PINK, at: wordAt('r2', 'anderen') + 0.35},
  ];
  return (
    <div style={{position: 'absolute', top: 140, left: 70, right: 70, fontFamily: FONT}}>
      <div style={{textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: 6, color: 'rgba(255,255,255,0.8)', marginBottom: 12}}>DEINE ERSTE WAHL …</div>
      {rows.map((r, i) => {
        const q = lerp(t, r.at, r.at + 0.25, 0, 1);
        return (
          <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', marginBottom: 12, background: 'rgba(0,0,0,0.6)', border: `3px solid ${r.col}`, borderRadius: 22, opacity: q, transform: `translateX(${(1 - q) * 60}px)`}}>
            <span style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>
              <span style={{color: 'rgba(255,255,255,0.6)', fontSize: 30}}>⅓ · </span>
              {r.pick}
            </span>
            <span style={{fontSize: 34, fontWeight: 800, color: r.col, textShadow: glow(r.col, 0.4)}}>{r.res}</span>
          </div>
        );
      })}
      {t > wordAt('r2', 'letzten') && (
        <div style={{textAlign: 'center', marginTop: 10, fontSize: 56, fontWeight: 900, color: '#fff', textShadow: glow(PINK, 0.7)}}>
          WECHSELN = <span style={{color: PINK}}>⅔</span>
        </div>
      )}
    </div>
  );
};

const Twist: React.FC = () => {
  const t = useT();
  const tw = scene('twist');
  if (t < tw.start || t > tw.end) return null;
  const items = [
    {big: '1990', small: 'Kolumne „Ask Marilyn“', col: C.yellow, at: wordAt('t1', '1990')},
    {big: '~10.000', small: 'Protestbriefe', col: C.red, at: wordAt('t1', 'tausende')},
    {big: '~1.000', small: 'davon von Doktoren', col: C.orange, at: wordAt('t1', 'Doktoren')},
  ];
  return (
    <div style={{position: 'absolute', top: 150, left: 80, right: 80, fontFamily: FONT}}>
      {items.map((it) => {
        const q = lerp(t, it.at, it.at + 0.3, 0, 1);
        return (
          <div key={it.big} style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 30px', marginBottom: 14, background: 'rgba(0,0,0,0.6)', borderRadius: 22, border: `3px solid ${it.col}`, opacity: q, transform: `scale(${0.7 + 0.3 * q})`}}>
            <span style={{fontSize: 70, fontWeight: 900, color: '#fff', textShadow: glow(it.col, 0.6)}}>{it.big}</span>
            <span style={{fontSize: 32, fontWeight: 800, color: it.col}}>{it.small}</span>
          </div>
        );
      })}
      {t > wordAt('t1', 'recht') && (
        <div style={{textAlign: 'center', fontSize: 64, fontWeight: 900, color: C.lime, textShadow: glow(C.lime, 0.8), marginTop: 10}}>✓ SIE HATTE RECHT</div>
      )}
    </div>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const hook = scene('hook');
  const cuts = [wordAt('q2', 'testen'), scene('explain').start];
  const flash = Math.max(...cuts.map((c) => (t >= c - 0.05 ? lerp(t, c - 0.05, c + 0.3, 0.7, 0) : 0)));
  const pr = usePop(ev.uncover + 1.4, 8);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 42, near: 0.05, far: 80, position: [0, 1.7, 8]}} gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}} shadows>
        <Scene3D />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />

      <NeonText at={0.3} until={ev.peek - 0.1} top={170} size={86} color={C.yellow}>
        3 TÜREN
      </NeonText>
      <NeonText at={ev.peek} until={line('h2').start} top={170} size={64} color={C.yellow}>
        1 × AUTO
        <br />2 × ZIEGE
      </NeonText>
      <NeonText at={line('h2').start} until={hook.end} top={170} size={66} color={C.red}>
        FAST JEDER
        <br />
        LIEGT FALSCH
      </NeonText>
      <DoorPick />
      <NeonText at={wordAt('q1', '50')} until={line('q2').start - 0.1} top={190} size={170} color={C.cyan}>
        50 : 50 ?
      </NeonText>
      <NeonText at={wordAt('q2', '1000')} until={ev.simStart - 0.2} top={170} size={80} color={C.yellow}>
        1000 SPIELE
      </NeonText>
      <Pill color={C.yellow} at={wordAt('q2', 'Tipp')} until={ev.simStart - 0.2} top={1150} size={40}>MERK DIR DEINEN TIPP!</Pill>
      <SimHud />
      <Freeze />
      {t > ev.uncover + 1.4 && t < scene('reveal').end && (
        <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `scale(${interpolate(pr, [0, 1], [2.2, 1])})`, opacity: Math.min(1, pr)}}>
          <div style={{fontSize: 120, fontWeight: 900, color: '#fff', textShadow: glow(PINK, 1.3)}}>WECHSELN</div>
          <div style={{fontSize: 70, fontWeight: 900, color: PINK, letterSpacing: 8, textShadow: glow(PINK, 0.6)}}>GEWINNT!</div>
        </div>
      )}
      <Explain />
      <Twist />
      <NeonText at={scene('outro').start + 0.1} top={170} size={80} color={C.yellow}>
        HÄTTEST DU
        <br />
        GEWECHSELT?
      </NeonText>
      <Pill color={C.magenta} at={scene('outro').end - 2.4} top={1150} size={40}>FOLGE FÜR MEHR RÄTSEL</Pill>
      <AbsoluteFill style={{background: '#fff', opacity: flash, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: '#fff', opacity: lerp(t, ev.uncover + 1.35, ev.uncover + 1.7, 0.5, 0) * (t > ev.uncover + 1.35 ? 1 : 0), mixBlendMode: 'screen'}} />
      <Subtitles />
    </AbsoluteFill>
  );
};
