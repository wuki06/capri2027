import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {NeonCanvas} from './NeonCanvas';
import {Subtitles} from './Subtitles';
import {FPS, TL, line, scene, wordAt} from './timeline';
import {Background, C, FONT, NeonText, Pill, Vignette, glow, rand, usePop, useT} from './ui';
import {COL, END, KEYS, Key, LEN, OX, OY, ballAt, drawBall, drawFinish, drawTrack, posAt, trackPoint} from './tracks';
import {shake} from './scenes/common';

const ev = TL.events;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const fmt = (x: number, d = 3) => x.toFixed(d).replace('.', ',');

/** Sim-Zeit des Rennens zur Echtzeit t */
const raceSim = (t: number) => {
  if (t < ev.raceStart) return 0;
  if (t < ev.freeze) return (t - ev.raceStart) / ev.raceSlow;
  if (t < ev.resultStart) return TL.geo.freezeSim;
  const m = ev.slowMap;
  for (let i = 1; i < m.length; i++)
    if (t <= m[i][0]) return m[i - 1][1] + ((t - m[i - 1][0]) / (m[i][0] - m[i - 1][0])) * (m[i][1] - m[i - 1][1]);
  return m[m.length - 1][1] + (t - m[m.length - 1][0]) / 9;
};
const slowFactor = (t: number) => {
  const m = ev.slowMap;
  for (let i = 1; i < m.length; i++) if (t <= m[i][0]) return (m[i][0] - m[i - 1][0]) / (m[i][1] - m[i - 1][1]);
  return 9;
};

const sceneAt = (t: number) => TL.scenes.find((s) => t >= s.start - 0.01 && t <= s.end + 0.01)?.id ?? 'outro';
const TAUTO_COLS = ['#FF2BD6', '#C04BFF', '#7A6BFF', '#3FA9FF', '#19F7FF'];

// ------------------------------------------------------------------------------
const Stage: React.FC = () => {
  const t = useT();
  const sc = sceneAt(t);
  const sim = raceSim(t);
  const twist = scene('twist');
  const inTwist = t >= twist.start - 0.2 && t < scene('outro').start;

  // Sichtbarkeit der Bahnen
  const alpha = (k: Key) => {
    if (sc === 'tracks') {
      const order: Record<Key, string> = {A: 'p1', B: 'p2', C: 'p3', D: 'p4'};
      const active = (['p1', 'p2', 'p3', 'p4'] as const).find((id, i, arr) => t >= line(id).start - 0.15 && (i === arr.length - 1 || t < line(arr[i + 1]).start - 0.15));
      if (t >= line('p5').start - 0.2 || !active) return 1;
      return order[k] === active ? 1 : 0.18;
    }
    if (inTwist) return k === 'C' ? 1 : lerp(t, twist.start, twist.start + 0.8, 1, 0);
    if (sc === 'result' && t > line('x2').start - 0.1 && t < line('x3').start - 0.1) return k === 'C' ? 1 : 0.3;
    if (sc === 'result' && t > line('x3').start - 0.1) return k === 'A' || k === 'C' ? 1 : 0.3;
    return 1;
  };
  const drawIn = lerp(t, wordAt('h1', 'Bahnen') - 0.3, wordAt('h1', 'Bahnen') + 0.9, 0, 1);
  const ballPop = lerp(t, wordAt('h1', 'Kugeln') - 0.1, wordAt('h1', 'Kugeln') + 0.25, 0, 1);

  const draw = (ctx: CanvasRenderingContext2D) => {
    for (const k of KEYS) {
      const pulse = sc === 'result' && k === 'C' && t > line('x2').start ? 1.6 + 0.6 * Math.sin(t * 8) : 1;
      const red = sc === 'result' && k === 'A' && t > line('x3').start - 0.1;
      drawTrack(ctx, k, {alpha: alpha(k), progress: drawIn, width: 6 * pulse, color: red ? C.red : undefined});
    }
    drawFinish(ctx, drawIn);
    // Start-Markierung
    ctx.save();
    ctx.globalAlpha = drawIn;
    ctx.font = `800 30px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.fillText('START', OX - 40, OY - 50);
    ctx.restore();

    // Bahn-Beschriftungen in der Vorstellung
    if (sc === 'tracks' || sc === 'hook') {
      const la = sc === 'hook' ? lerp(t, wordAt('h2', 'Welche'), wordAt('h2', 'Welche') + 0.4, 0, 1) : 1;
      const spots: Record<Key, number> = {A: 0.5, B: 0.4, C: 0.62, D: 0.25};
      const offs: Record<Key, [number, number]> = {A: [40, -40], B: [40, -30], C: [-10, 52], D: [-50, 0]};
      for (const k of KEYS) {
        const p = trackPoint(k, spots[k]);
        ctx.save();
        ctx.globalAlpha = la * Math.max(alpha(k), 0.35);
        ctx.font = `900 46px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = COL[k];
        ctx.shadowColor = COL[k];
        ctx.shadowBlur = 18;
        ctx.fillText(k, p.x + offs[k][0], p.y + offs[k][1]);
        if (sc === 'tracks' && alpha(k) === 1 && t < line('p5').start - 0.2) {
          ctx.font = `700 30px ${FONT}`;
          ctx.fillText(LEN[k], p.x + offs[k][0], p.y + offs[k][1] + 40);
        }
        ctx.restore();
      }
    }

    if (inTwist) {
      // Tautochrone: 5 Kugeln, verschiedene Höhen, gleiche Ankunft
      const s2 = Math.max(0, (t - ev.tautoRelease) / TL.geo.tautoSlow);
      const appear = lerp(t, wordAt('t2', 'fünf') - 0.1, wordAt('t2', 'fünf') + 0.3, 0, 1);
      TL.tauto.forEach((r, i) => {
        const trail: {x: number; y: number}[] = [];
        for (let k = 12; k >= 0; k--) trail.push(posAt(r.xs, r.ys, s2 - k * 0.004));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        trail.forEach((p, j) => {
          if (j === 0 || s2 <= 0) return;
          ctx.strokeStyle = TAUTO_COLS[i];
          ctx.globalAlpha = (j / trail.length) * 0.6;
          ctx.lineWidth = 10 * (j / trail.length);
          ctx.beginPath();
          ctx.moveTo(trail[j - 1].x, trail[j - 1].y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        });
        ctx.restore();
        const p = posAt(r.xs, r.ys, s2);
        drawBall(ctx, p.x, p.y, TAUTO_COLS[i], String(i + 1), 22, appear);
      });
      // Ankunftsblitz
      const k = t - ev.tautoArrive;
      if (k > 0 && k < 1.2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 3; j++) {
          ctx.strokeStyle = TAUTO_COLS[j * 2];
          ctx.globalAlpha = Math.max(0, 1 - k / 1.2);
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(END.x, END.y, 30 + k * (380 + j * 120), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }

    // Kugeln + Bewegungsspuren
    for (const k of KEYS) {
      if (sim > 0.001 && sim < TL.race[k].finish + 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const n = 14;
        let prevP = ballAt(k, sim - 0.06);
        for (let j = 1; j <= n; j++) {
          const p = ballAt(k, sim - 0.06 + (0.06 * j) / n);
          ctx.strokeStyle = COL[k];
          ctx.globalAlpha = (j / n) * 0.55 * alpha(k);
          ctx.lineWidth = 16 * (j / n);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(prevP.x, prevP.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          prevP = p;
        }
        ctx.restore();
      }
    }
    // Reihenfolge: Sieger zuletzt zeichnen (oben)
    for (const k of ['A', 'D', 'B', 'C'] as Key[]) {
      const p = ballAt(k, sim);
      drawBall(ctx, p.x, p.y, COL[k], k, 24, ballPop * Math.max(0.4, alpha(k)));
    }
    // Zielblitze + Konfetti
    if (t >= ev.resultStart) {
      for (const k of KEYS) {
        const dt = t - ev['finish' + k];
        if (dt > 0 && dt < 0.9) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = COL[k];
          ctx.globalAlpha = 1 - dt / 0.9;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(END.x, END.y, 26 + dt * 260, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      const dc = t - ev.finishC;
      if (dc > 0 && dc < 3.2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 160; i++) {
          const a = rand(i) * Math.PI * 2;
          const v = 300 + rand(i + 50) * 700;
          const x = END.x + Math.cos(a) * v * dc * 0.6;
          const y = END.y + Math.sin(a) * v * dc * 0.6 + 260 * dc * dc;
          ctx.fillStyle = [C.magenta, C.yellow, C.cyan, C.lime][i % 4];
          ctx.globalAlpha = Math.max(0, 1 - dc / 3.2);
          ctx.fillRect(x, y, 7, 12);
        }
        ctx.restore();
      }
    }
  };

  // Kamera
  const m = ev.slowMap;
  const zoom =
    sc === 'result'
      ? interpolate(t, [ev.resultStart + 0.2, m[1][0], m[2][0] + 0.2, m[2][0] + 1.0], [1, 1.75, 1.75, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : sc === 'race'
        ? lerp(t, ev.raceStart, ev.freeze, 1, 1.08)
        : 1;
  const shk = [shake(t, ev.freeze, 20, 0.4), shake(t, ev.finishC, 26, 0.6), shake(t, ev.tautoArrive, 26, 0.6)].reduce((a, b) => ({x: a.x + b.x, y: a.y + b.y}));
  const frozen = t >= ev.freeze && t < ev.resultStart;
  const why = scene('why');
  const blur = lerp(t, why.start, why.start + 0.6, 0, 1) * lerp(t, why.end - 0.6, why.end, 1, 0);
  const startFade = t < 0.4 ? t / 0.4 : 1;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${shk.x}px, ${shk.y}px) scale(${zoom})`,
        transformOrigin: `${END.x + 40}px ${END.y - 60}px`,
        filter: `${frozen ? `grayscale(${0.75 * (1 - blur * 0.3)})` : ''} blur(${blur * 7}px) brightness(${1 - blur * 0.6})`,
        opacity: startFade,
      }}
    >
      <NeonCanvas draw={draw} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------
const Timer: React.FC = () => {
  const t = useT();
  const sc = sceneAt(t);
  if (!['race', 'result', 'twist'].includes(sc) || (sc === 'race' && t < ev.raceStart - 0.1)) return null;
  let sim = raceSim(t);
  let label = 'ZEIT';
  let slow = sc === 'race' ? ev.raceSlow : slowFactor(t);
  if (sc === 'twist') {
    if (t < ev.tautoRelease - 0.5) return null;
    sim = Math.min(TL.race.C.finish, Math.max(0, (t - ev.tautoRelease) / TL.geo.tautoSlow));
    slow = TL.geo.tautoSlow;
    label = 'ALLE 5 KUGELN';
  }
  if (sc === 'result' && t > ev.finishC - 0.02) return null;
  const rec = Math.floor(t * 2) % 2 === 0;
  return (
    <div style={{position: 'absolute', top: sc === 'result' ? 150 : 165, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontVariantNumeric: 'tabular-nums'}}>
      <div style={{fontSize: 28, fontWeight: 800, letterSpacing: 8, color: 'rgba(255,255,255,0.75)'}}>
        <span style={{color: C.red, opacity: rec ? 1 : 0.2}}>●</span> {label} · ZEITLUPE ×{Math.round(slow)}
      </div>
      <div style={{fontSize: 100, fontWeight: 900, color: '#fff', textShadow: glow(t >= ev.freeze && t < ev.resultStart ? C.red : C.violet, 1)}}>
        {fmt(Math.min(sim, sc === 'result' ? 0.8408 : 9), sc === 'race' ? 3 : 4)} s
      </div>
    </div>
  );
};

const Countdown: React.FC = () => {
  const t = useT();
  const r1 = line('r1');
  if (t < r1.start - 0.05 || t > ev.raceStart + 0.6) return null;
  const w = r1.words.filter((x) => t >= x.s - 0.03).pop();
  if (!w) return null;
  const isGo = /Los/.test(w.w);
  const k = t - w.s;
  const sc = interpolate(k, [0, 0.12, 0.6], [2.2, 1, 0.85], {extrapolateRight: 'clamp'});
  const col = isGo ? C.lime : C.yellow;
  return (
    <div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: isGo ? 230 : 330, color: '#fff', textShadow: glow(col, 1.6), transform: `scale(${sc})`, opacity: interpolate(k, [0, 0.05, 0.7, 0.85], [0, 1, 1, isGo ? 0 : 0.2], {extrapolateRight: 'clamp'})}}>
      {w.w.replace(/[.!]/g, '').toUpperCase()}
    </div>
  );
};

const Stopp: React.FC = () => {
  const t = useT();
  const p = usePop(ev.freeze, 7);
  if (t < ev.freeze || t > scene('race').end) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 170, color: C.red, border: `12px solid ${C.red}`, borderRadius: 30, padding: '0 40px', transform: `rotate(-8deg) scale(${interpolate(p, [0, 1], [2.4, 1])})`, textShadow: glow(C.red, 0.8), boxShadow: `0 0 40px ${C.red}, inset 0 0 30px ${C.red}88`, background: 'rgba(0,0,0,0.5)'}}>
        STOPP!
      </div>
    </div>
  );
};

const Moon: React.FC<{at: number; until: number}> = ({at, until}) => {
  const t = useT();
  const p = usePop(at);
  if (t < at || t > until) return null;
  return (
    <svg width={220} height={220} viewBox="0 0 100 100" style={{position: 'absolute', left: 430, top: 640, transform: `scale(${p}) rotate(${(t - at) * 8}deg)`, filter: `drop-shadow(0 0 20px ${C.yellow})`, opacity: lerp(t, until - 0.25, until, 1, 0)}}>
      <path d="M62 10 A42 42 0 1 0 90 62 A33 33 0 1 1 62 10 Z" fill={C.yellow} />
      {[[20, 20], [80, 85], [12, 70]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 6 + i)} />
      ))}
    </svg>
  );
};

const Why: React.FC = () => {
  const t = useT();
  const why = scene('why');
  if (t < why.start || t > why.end) return null;
  const w2 = line('w2');
  const w3 = line('w3');
  const w4 = line('w4');
  const w5 = line('w5');
  const w6 = line('w6');
  return (
    <>
      <NeonText at={w2.start} until={w3.start - 0.1} top={330} size={210} color={C.lime} spacing={6}>
        1696
      </NeonText>
      <NeonText at={wordAt('w2', 'Bernoulli')} until={w3.start - 0.1} top={600} size={64} color={C.cyan} spacing={4}>
        JOHANN BERNOULLI
        <div style={{fontSize: 34, fontWeight: 600, letterSpacing: 3, marginTop: 14}}>stellt Europas Genies ein Rätsel</div>
      </NeonText>
      <NeonText at={wordAt('w3', 'Newton')} until={w4.start - 0.1} top={360} size={86} color={C.yellow} spacing={4}>
        ISAAC NEWTON
      </NeonText>
      <Moon at={wordAt('w3', 'Nacht') - 0.2} until={w4.start - 0.1} />
      <NeonText at={wordAt('w3', 'Nacht')} until={w4.start - 0.1} top={900} size={70} color={C.yellow}>
        LÖSUNG IN 1 NACHT
      </NeonText>
      <NeonText at={wordAt('w4', 'kürzeste')} until={w5.start - 0.1} top={420} size={74} color={C.cyan}>
        KÜRZESTER WEG
      </NeonText>
      <NeonText at={wordAt('w4', 'nicht')} until={w5.start - 0.1} top={540} size={120} color={C.red}>
        ≠
      </NeonText>
      <NeonText at={wordAt('w4', 'schnellste')} until={w5.start - 0.1} top={700} size={74} color={C.magenta}>
        SCHNELLSTER WEG
      </NeonText>
      <Pill color={C.lime} at={wordAt('w5', 'steil')} until={w6.start - 0.1} top={480} size={52}>⚡ STEIL = TEMPO</Pill>
      <Pill color={C.red} at={wordAt('w5', 'Umweg')} until={w6.start - 0.1} top={640} size={52}>↪ UMWEG = ZEIT</Pill>
      <NeonText at={w6.start} until={why.end} top={380} size={68} color={C.violet}>
        DER PERFEKTE
        <br />
        KOMPROMISS?
      </NeonText>
      {t > wordAt('w6', 'Auflösung') && (
        <div style={{position: 'absolute', top: 720, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 34}}>
          {KEYS.map((k, i) => {
            const b = Math.abs(Math.sin((t - wordAt('w6', 'Auflösung')) * 7 + i * 0.9));
            return (
              <div key={k} style={{width: 150, height: 150, borderRadius: 75, border: `6px solid ${COL[k]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 86, color: COL[k], textShadow: glow(COL[k], 0.6), boxShadow: `0 0 30px ${COL[k]}88`, transform: `translateY(${-30 * b}px)`, background: 'rgba(0,0,0,0.6)'}}>
                {k}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

const Ranking: React.FC<{top: number; showFrom: number; until: number; compact?: boolean}> = ({top, showFrom, until, compact}) => {
  const t = useT();
  if (t < showFrom || t > until) return null;
  const order = [...KEYS].sort((a, b) => TL.race[a].finish - TL.race[b].finish);
  const best = TL.race[order[0]].finish;
  return (
    <div style={{position: 'absolute', top, left: 120, right: 120, fontFamily: FONT, fontVariantNumeric: 'tabular-nums'}}>
      {order.map((k, i) => {
        const at = Math.max(showFrom, ev['finish' + k] ?? 0);
        if (t < at) return null;
        const p = Math.min(1, (t - at) * 5);
        const win = i === 0;
        return (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 22, height: compact ? 74 : 92, opacity: p, transform: `translateX(${(1 - p) * 80}px) scale(${win ? 1.08 : 1})`, transformOrigin: 'left center'}}>
            <div style={{width: 70, fontSize: compact ? 44 : 54, fontWeight: 900, color: win ? C.yellow : '#fff', textShadow: win ? glow(C.yellow, 0.7) : undefined}}>{i + 1}.</div>
            <div style={{width: compact ? 62 : 74, height: compact ? 62 : 74, borderRadius: 40, background: COL[k], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: compact ? 38 : 46, fontWeight: 900, color: '#000', boxShadow: `0 0 24px ${COL[k]}`}}>{k}</div>
            <div style={{fontSize: compact ? 44 : 54, fontWeight: 900, color: '#fff', textShadow: glow(COL[k], 0.5)}}>{fmt(TL.race[k].finish, 4)} s</div>
            <div style={{fontSize: compact ? 30 : 36, fontWeight: 700, color: win ? C.yellow : 'rgba(255,255,255,0.6)'}}>{win ? '★ SIEGER' : `+${fmt(TL.race[k].finish - best, 4)}`}</div>
          </div>
        );
      })}
    </div>
  );
};

const Result: React.FC = () => {
  const t = useT();
  const r = scene('result');
  if (t < r.start || t > r.end) return null;
  return (
    <>
      <Ranking top={150} showFrom={ev.finishC} until={r.end} />
      <NeonText at={ev.finishC} until={line('x2').start} top={600} size={96} color={C.magenta} spacing={4}>
        C GEWINNT!
      </NeonText>
      <NeonText at={wordAt('x2', 'Zykloide')} until={line('x3').start - 0.1} top={600} size={84} color={C.magenta} spacing={4}>
        ZYKLOIDE
        <div style={{fontSize: 32, fontWeight: 600, letterSpacing: 4, marginTop: 10}}>die Brachistochrone · „kürzeste Zeit“</div>
      </NeonText>
      <NeonText at={wordAt('x3', 'Letzter')} until={r.end} top={600} size={78} color={C.red}>
        KÜRZESTER WEG = LETZTER
      </NeonText>
    </>
  );
};

const Twist: React.FC = () => {
  const t = useT();
  const tw = scene('twist');
  if (t < tw.start || t > tw.end) return null;
  const arrived = t >= ev.tautoArrive;
  return (
    <>
      <NeonText at={tw.start + 0.2} until={ev.tautoRelease - 0.3} top={190} size={84} color={C.violet}>
        BONUS-TWIST
      </NeonText>
      <NeonText at={ev.tautoArrive} until={tw.end} top={1080} size={100} color={C.cyan} spacing={4}>
        GLEICHZEITIG!
      </NeonText>
      {arrived && (
        <Pill color={C.magenta} at={ev.tautoArrive + 0.5} top={420} size={40}>
          TAUTOCHRONE · 5 × 0,7093 s
        </Pill>
      )}
      {arrived && <AbsoluteFill style={{background: '#fff', opacity: lerp(t, ev.tautoArrive, ev.tautoArrive + 0.35, 0.6, 0), mixBlendMode: 'screen'}} />}
    </>
  );
};

const Hook: React.FC = () => {
  const t = useT();
  const h = scene('hook');
  if (t > h.end) return null;
  return (
    <>
      <NeonText at={line('h2').start} until={h.end} top={165} size={74} color={C.cyan}>
        WELCHE KUGEL IST
        <br />
        ZUERST UNTEN?
      </NeonText>
      <Pill color={C.red} at={wordAt('h3', 'falsch')} until={h.end} top={1130} size={40}>
        ✕ FAST JEDER TIPPT FALSCH
      </Pill>
      <Pill color={C.yellow} at={wordAt('h3', 'Auflösung')} until={h.end} top={1225} size={34}>
        AUFLÖSUNG AM ENDE ↓
      </Pill>
    </>
  );
};

const Tracks: React.FC = () => {
  const t = useT();
  const s = scene('tracks');
  if (t < s.start || t > s.end) return null;
  return (
    <>
      <NeonText at={s.start + 0.1} until={line('p5').start - 0.1} top={165} size={62} color={C.violet} spacing={8}>
        DIE BAHNEN
      </NeonText>
      <NeonText at={line('p5').start} until={s.end} top={160} size={58} color={C.lime}>
        0 REIBUNG · 0 ANTRIEB
        <div style={{fontSize: 40, marginTop: 14, color: '#fff'}}>nur Schwerkraft g = 9,81 m/s²</div>
      </NeonText>
      <Pill color={C.magenta} at={wordAt('p3', 'seltsame')} until={line('p4').start - 0.1} top={1130} size={36}>
        LÄNGER ALS DIE GERADE!
      </Pill>
    </>
  );
};

const Outro: React.FC = () => {
  const t = useT();
  const o = scene('outro');
  const p = usePop(wordAt('c1', 'Kommentare'), 8);
  if (t < o.start) return null;
  return (
    <>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.55)', opacity: lerp(t, o.start, o.start + 0.5, 0, 1)}} />
      <NeonText at={o.start + 0.1} top={170} size={80} color={C.yellow}>
        HATTEST DU
        <br />
        RICHTIG GETIPPT?
      </NeonText>
      <Ranking top={470} showFrom={o.start + 0.3} until={o.end + 1} compact />
      {t > wordAt('c1', 'Kommentare') && (
        <svg width={190} height={170} viewBox="0 0 190 170" style={{position: 'absolute', left: 445, top: 860, transform: `scale(${p})`, filter: `drop-shadow(0 0 18px ${C.yellow})`}}>
          <path d="M20 15 H170 a12 12 0 0 1 12 12 V105 a12 12 0 0 1 -12 12 H85 L45 155 V117 H20 a12 12 0 0 1 -12 -12 V27 a12 12 0 0 1 12 -12Z" fill="rgba(0,0,0,0.6)" stroke={C.yellow} strokeWidth={7} />
          <text x={95} y={86} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={40} fill={C.yellow}>A B C D</text>
        </svg>
      )}
      <Pill color={C.magenta} at={o.end - 2.4} top={1110} size={40}>FOLGE FÜR MEHR PHYSIK-RÄTSEL</Pill>
    </>
  );
};

export const Video: React.FC = () => {
  useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Background />
      <Stage />
      <Hook />
      <Tracks />
      <Countdown />
      <Timer />
      <Stopp />
      <Why />
      <Result />
      <Twist />
      <Outro />
      <Vignette />
      <Subtitles />
    </AbsoluteFill>
  );
};

export const _unused = FPS;
