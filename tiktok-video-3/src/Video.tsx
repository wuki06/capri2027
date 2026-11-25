import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {EarthScene, useEarthTextures} from './Earth3D';
import {Subtitles} from './Subtitles';
import {TL, line, scene, wordAt} from './timeline';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {depthAt, gAt, layerAt, posKm, simAt, speedKmh, tempAt} from './model';

const ev = TL.events;
const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const de = (n: number) => Math.round(n).toLocaleString('de-DE');
const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const Stat: React.FC<{label: string; value: string; color: string; w?: number}> = ({label, value, color, w = 300}) => (
  <div style={{width: w, textAlign: 'center'}}>
    <div style={{fontSize: 24, fontWeight: 800, letterSpacing: 6, color: 'rgba(255,255,255,0.7)'}}>{label}</div>
    <div style={{fontSize: 54, fontWeight: 900, color: '#fff', textShadow: glow(color, 0.7), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{value}</div>
  </div>
);

const Hud: React.FC = () => {
  const t = useT();
  if (t < ev.jump - 0.4 || t > ev.twistStart + 0.3) return null;
  const sim = simAt(t);
  const depth = depthAt(sim);
  const v = sim <= 0 || (t >= ev.arrive && t < ev.twistStart + 0.8) ? 0 : speedKmh(sim);
  const r = Math.abs(posKm(sim));
  const g = gAt(r);
  const showClock = t >= ev.rushStart;
  const paused = t >= ev.center && t < ev.rushStart;
  const op = lerp(t, ev.jump - 0.4, ev.jump, 0, 1) * lerp(t, ev.twistStart, ev.twistStart + 0.3, 1, 0);
  const heatCol = `hsl(${lerp(depth, 0, 6371, 40, 0)}, 100%, 60%)`;
  return (
    <div style={{position: 'absolute', top: 140, left: 40, right: 40, fontFamily: FONT, opacity: op}}>
      <div style={{display: 'flex', justifyContent: 'center', gap: 10, background: 'rgba(0,0,0,0.45)', borderRadius: 28, padding: '18px 10px', border: '2px solid rgba(255,255,255,0.12)'}}>
        <Stat label="TIEFE" value={`${de(depth)} km`} color={C.cyan} />
        <Stat label="TEMPO" value={`${de(v)} km/h`} color={C.magenta} w={360} />
        <Stat label="ZEIT" value={showClock ? clock(sim) : '??:??'} color={C.yellow} w={260} />
      </div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12}}>
        <div style={{fontSize: 30, fontWeight: 800, color: heatCol, textShadow: glow(heatCol, 0.4), padding: '8px 22px', background: 'rgba(0,0,0,0.45)', borderRadius: 999}}>
          {de(tempAt(depth))} °C
        </div>
        <div style={{fontSize: 30, fontWeight: 800, color: g < 0.5 ? C.lime : '#fff', padding: '8px 22px', background: 'rgba(0,0,0,0.45)', borderRadius: 999}}>
          g = {g < 0.05 ? '0 · SCHWERELOS' : `${g.toFixed(1).replace('.', ',')} m/s²`}
        </div>
      </div>
      <div style={{textAlign: 'center', marginTop: 14, fontSize: 34, fontWeight: 900, letterSpacing: 6, color: heatCol, textShadow: glow(heatCol, 0.6)}}>
        {sim > 0 && t < ev.arrive ? layerAt(depth) : ''}
      </div>
      {paused && (
        <div style={{textAlign: 'center', marginTop: 10, fontSize: 30, fontWeight: 800, color: C.yellow, letterSpacing: 6, opacity: Math.floor(t * 2) % 2 ? 1 : 0.5}}>
          ❚❚ ZEIT ANGEHALTEN
        </div>
      )}
    </div>
  );
};

const Countdown: React.FC = () => {
  const t = useT();
  const marks: number[] = ev.countdown;
  const items = [...marks.map((m, i) => ({at: m, txt: String(3 - i)})), {at: ev.jump, txt: 'SPRING!'}];
  const cur = items.filter((x) => t >= x.at - 0.03).pop();
  if (!cur || t > ev.jump + 0.7 || t < marks[0] - 0.1) return null;
  const k = t - cur.at;
  const go = cur.txt === 'SPRING!';
  return (
    <div style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: go ? 170 : 300, color: '#fff', textShadow: glow(go ? C.lime : C.yellow, 1.5), transform: `scale(${interpolate(k, [0, 0.12, 0.6], [2, 1, 0.9], {extrapolateRight: 'clamp'})})`, opacity: interpolate(k, [0, 0.05, 0.55, 0.7], [0, 1, 1, 0], {extrapolateRight: 'clamp'})}}>
      {cur.txt}
    </div>
  );
};

const Reveal: React.FC = () => {
  const t = useT();
  const p = usePop(ev.arrive, 9);
  if (t < ev.arrive || t > ev.twistStart) return null;
  const r2 = line('r2');
  const r3 = line('r3');
  return (
    <>
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `scale(${interpolate(p, [0, 1], [2.2, 1])})`, opacity: Math.min(1, p) * lerp(t, r2.start - 0.3, r2.start, 1, 0)}}>
        <div style={{fontSize: 210, fontWeight: 900, color: '#fff', textShadow: glow(C.lime, 1.4), lineHeight: 1}}>38</div>
        <div style={{fontSize: 70, fontWeight: 900, color: C.lime, letterSpacing: 10, textShadow: glow(C.lime, 0.6)}}>MINUTEN</div>
      </div>
      {t > r2.start && t < r3.start && (
        <div style={{position: 'absolute', top: 470, left: 90, right: 90, fontFamily: FONT, opacity: lerp(t, r2.start, r2.start + 0.3, 0, 1)}}>
          {[
            {lbl: 'SCHULBUCH', sub: 'Erde überall gleich dicht', val: '42 min', col: 'rgba(255,255,255,0.75)', at: r2.start},
            {lbl: 'ECHTE ERDE', sub: 'schwerer Eisenkern (PREM)', val: '38 min', col: C.lime, at: wordAt('r2', 'Aber')},
          ].map((r) =>
            t > r.at ? (
              <div key={r.lbl} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 34px', marginBottom: 20, background: 'rgba(0,0,0,0.55)', border: `3px solid ${r.col}`, borderRadius: 26, boxShadow: `0 0 26px ${r.col}55`}}>
                <div>
                  <div style={{fontSize: 44, fontWeight: 900, color: '#fff'}}>{r.lbl}</div>
                  <div style={{fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.7)'}}>{r.sub}</div>
                </div>
                <div style={{fontSize: 70, fontWeight: 900, color: r.col, textShadow: glow(r.col, 0.5)}}>{r.val}</div>
              </div>
            ) : null,
          )}
        </div>
      )}
      <NeonText at={wordAt('r3', 'null')} until={ev.twistStart} top={500} size={150} color={C.cyan}>
        0 km/h
        <div style={{fontSize: 40, fontWeight: 700, letterSpacing: 4, marginTop: 6}}>genau an der Oberfläche</div>
      </NeonText>
      <AbsoluteFill style={{background: '#fff', opacity: lerp(t, ev.arrive, ev.arrive + 0.4, 0.7, 0), mixBlendMode: 'screen'}} />
    </>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const tex = useEarthTextures();
  const hook = scene('hook');
  const outro = scene('outro');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tex && <ThreeCanvas
        width={1080}
        height={1920}
        camera={{fov: 32, near: 0.01, far: 200, position: [0, 0, 4]}}
        gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true}}
        style={{background: '#000'}}
      >
        <EarthScene tex={tex} />
      </ThreeCanvas>}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 60%, rgba(0,0,0,0.7) 100%)'}} />

      {/* Einstieg */}
      <NeonText at={0.3} until={line('h2').start} top={170} size={80} color={C.cyan}>
        LOCH DURCH
        <br />
        DIE ERDE?
      </NeonText>
      <NeonText at={line('h2').start} until={hook.end} top={170} size={70} color={C.yellow}>
        WIE LANGE DAUERT
        <br />
        DER FALL?
      </NeonText>
      <Pill color={C.magenta} at={wordAt('h2', 'Antwort')} until={hook.end} top={1150} size={40}>
        ⏱ ?? MINUTEN – AUFLÖSUNG AM ENDE
      </Pill>
      <Pill color={C.cyan} at={wordAt('d1', '13.000')} until={line('d2').start} top={170} size={44}>
        ↕ 12.742 km DURCH DEN KERN
      </Pill>
      <Pill color={C.orange} at={wordAt('d3', 'Luft')} until={ev.countdown[0] - 0.1} top={170} size={36}>
        VAKUUM-TUNNEL · HITZESCHILD
      </Pill>
      <Countdown />
      <Hud />
      {t > line('s2').start && t < ev.rushStart && (
        <div style={{position: 'absolute', top: 560, left: 80, right: 80, fontFamily: FONT}}>
          {[
            {lbl: '✈ FLUGZEUG', val: '≈ 24 STD', col: 'rgba(255,255,255,0.8)', at: wordAt('s2', 'Flugzeug')},
            {lbl: 'DU IM TUNNEL', val: '?? MIN', col: C.yellow, at: wordAt('s2', 'du?')},
          ].map((r) =>
            t > r.at ? (
              <div key={r.lbl} style={{display: 'flex', justifyContent: 'space-between', padding: '20px 32px', marginBottom: 18, background: 'rgba(0,0,0,0.6)', border: `3px solid ${r.col}`, borderRadius: 24, fontSize: 48, fontWeight: 900, color: r.col}}>
                <span>{r.lbl}</span>
                <span style={{textShadow: glow(r.col, 0.5)}}>{r.val}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
      <Reveal />
      <NeonText at={wordAt('t1', 'zurück')} until={scene('twist').end} top={170} size={86} color={C.magenta}>
        ∞ HIN UND HER
        <div style={{fontSize: 38, fontWeight: 700, letterSpacing: 3, marginTop: 10}}>alle 76 Minuten eine Runde</div>
      </NeonText>
      <NeonText at={outro.start + 0.1} top={170} size={76} color={C.yellow}>
        WIE LANGE HÄTTEST
        <br />
        DU GESCHÄTZT?
      </NeonText>
      <Pill color={C.magenta} at={outro.end - 2.4} top={1150} size={40}>FOLGE FÜR MEHR „WAS WÄRE WENN“</Pill>
      <Subtitles />
    </AbsoluteFill>
  );
};
