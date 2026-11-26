import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Subtitles} from './Subtitles';
import {C, FONT, NeonText, Pill, glow, usePop, useT} from './ui';
import {CLIPS, FPS, line, scene, wordAt} from './model';

const lerp = (t: number, a: number, b: number, x: number, y: number) =>
  interpolate(t, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const XF = 0.35; // Überblendung (s)

const Clip: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const c = CLIPS[i];
  const t = f / FPS;
  const zoom = 1.04 + 0.08 * (t / (c.dur + XF)) * (i % 2 ? 1 : -1) + (i % 2 ? 0 : 0.08);
  const op = i === 0 ? 1 : lerp(t, 0, XF, 0, 1);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <OffthreadVideo src={staticFile(c.file)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom}) translateX(${(i % 3 - 1) * 8 * (t / c.dur)}px)`}} />
    </AbsoluteFill>
  );
};

const Quiz: React.FC = () => {
  const t = useT();
  const p2 = line('p2');
  const rev = line('r1').start;
  if (t < wordAt('p2', 'Rate') || t > line('r2').start) return null;
  const opts = [
    {txt: '0 %', at: wordAt('p2', '0'), col: C.cyan},
    {txt: '10 %', at: wordAt('p2', '10'), col: C.lime},
    {txt: '50 %', at: wordAt('p2', '50'), col: C.yellow},
    {txt: '90 %', at: wordAt('p2', '90'), col: C.magenta},
  ];
  return (
    <div style={{position: 'absolute', top: 560, left: 80, right: 80, display: 'flex', flexWrap: 'wrap', gap: 26, justifyContent: 'center', fontFamily: FONT}}>
      {opts.map((o, i) => {
        const q = lerp(t, o.at, o.at + 0.25, 0, 1);
        const win = i === 3 && t >= rev;
        const lose = i !== 3 && t >= rev;
        return (
          <div key={o.txt} style={{width: 420, padding: '30px 0', textAlign: 'center', fontSize: 96, fontWeight: 900, color: '#fff', background: win ? 'rgba(124,255,79,0.35)' : 'rgba(0,0,0,0.6)', border: `5px solid ${win ? C.lime : o.col}`, borderRadius: 34, boxShadow: `0 0 ${win ? 50 : 22}px ${win ? C.lime : o.col}`, opacity: q * (lose ? 0.25 : 1), transform: `scale(${(0.6 + 0.4 * q) * (win ? 1.12 : 1)}) rotate(${t < rev ? Math.sin(t * 3 + i) * 2 : 0}deg)`, textShadow: glow(win ? C.lime : o.col, 0.5)}}>
            {o.txt}
            {win && <div style={{fontSize: 34, color: C.lime, marginTop: -6}}>✓ RICHTIG</div>}
          </div>
        );
      })}
      {t < rev && t > p2.end && <div style={{width: '100%', textAlign: 'center', fontSize: 40, fontWeight: 800, color: C.yellow, marginTop: 10}}>Schreib deinen Tipp in die Kommentare 👇</div>}
    </div>
  );
};

/** Newtons Kanonenkugel: Die ISS fällt ständig – aber an der Erde vorbei */
const Orbit: React.FC = () => {
  const t = useT();
  const e1 = line('e1');
  if (t < e1.start || t > scene('explain').end) return null;
  const k = t - e1.start;
  const W = 900;
  const cx = W / 2;
  const cy = 520;
  const R = 230;
  const r = 330;
  const ang = -Math.PI / 2 + k * 0.55;
  const ix = cx + r * Math.cos(ang);
  const iy = cy + r * Math.sin(ang);
  const tx = -Math.sin(ang);
  const ty = Math.cos(ang);
  const op = lerp(t, e1.start, e1.start + 0.4, 0, 1) * lerp(t, scene('explain').end - 0.4, scene('explain').end, 1, 0);
  const showArrows = k > 1.2;
  return (
    <div style={{position: 'absolute', top: 260, left: 90, opacity: op}}>
      <svg width={W} height={1000}>
        <defs>
          <radialGradient id="earth" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#7fc4ff" />
            <stop offset="60%" stopColor="#1d5fa8" />
            <stop offset="100%" stopColor="#0b2a55" />
          </radialGradient>
        </defs>
        <rect x={0} y={130} width={W} height={800} rx={40} fill="rgba(0,0,0,0.55)" />
        <circle cx={cx} cy={cy} r={R + 14} fill="rgba(110,190,255,0.25)" />
        <circle cx={cx} cy={cy} r={R} fill="url(#earth)" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={4} strokeDasharray="14 12" />
        {showArrows && (
          <>
            <line x1={ix} y1={iy} x2={ix + tx * 170} y2={iy + ty * 170} stroke={C.cyan} strokeWidth={8} markerEnd="url(#a1)" />
            <line x1={ix} y1={iy} x2={ix + (cx - ix) * 0.33} y2={iy + (cy - iy) * 0.33} stroke={C.red} strokeWidth={8} />
            <circle cx={ix + tx * 170} cy={iy + ty * 170} r={10} fill={C.cyan} />
            <circle cx={ix + (cx - ix) * 0.33} cy={iy + (cy - iy) * 0.33} r={10} fill={C.red} />
          </>
        )}
        <circle cx={ix} cy={iy} r={22} fill="#fff" stroke={C.yellow} strokeWidth={6} />
        <text x={ix} y={iy + 8} textAnchor="middle" fontSize={22} fontWeight={900} fill="#111" fontFamily="Inter">ISS</text>
        <text x={cx} y={185} textAnchor="middle" fontSize={42} fontWeight={900} fill="#fff" fontFamily="Inter">Die ISS „fällt“ um die Erde</text>
        {showArrows && (
          <>
            <text x={60} y={890} fontSize={34} fontWeight={800} fill={C.cyan} fontFamily="Inter">→ 28.000 km/h geradeaus</text>
            <text x={60} y={840} fontSize={34} fontWeight={800} fill={C.red} fontFamily="Inter">↓ Schwerkraft zieht zur Erde</text>
          </>
        )}
      </svg>
    </div>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const hook = scene('hook');
  const pR = usePop(line('r1').start, 8);
  const sunrises = Math.floor(lerp(t, wordAt('b1', 'Crew'), wordAt('b1', 'Sonnenaufgänge') + 0.6, 0, 16));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {CLIPS.map((c, i) => (
        <Sequence key={i} from={Math.round(c.start * FPS)} durationInFrames={Math.round((c.dur + XF) * FPS)}>
          <Clip i={i} />
        </Sequence>
      ))}
      <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.45), transparent 25%, transparent 60%, rgba(0,0,0,0.55))'}} />
      {t > line('p2').start && t < line('r1').start && <AbsoluteFill style={{background: 'rgba(0,0,0,0.25)'}} />}

      <NeonText at={0.3} until={line('h2').start} top={200} size={78} color={C.cyan}>
        WUSSTEST DU …
        <div style={{fontSize: 44, fontWeight: 800, marginTop: 12, color: '#fff'}}>Auf der ISS gibt es Schwerkraft?!</div>
      </NeonText>
      <NeonText at={line('h2').start} until={hook.end} top={200} size={70} color={C.yellow}>
        WARUM SCHWEBEN
        <br />
        SIE DANN?
      </NeonText>
      <NeonText at={wordAt('p1', '400')} until={line('p2').start} top={200} size={120} color={C.cyan}>
        400 km
        <div style={{fontSize: 40, fontWeight: 800, color: '#fff'}}>≈ Berlin → Frankfurt, nur nach oben ↑</div>
      </NeonText>
      <NeonText at={line('p2').start} until={line('r1').start} top={200} size={62} color={C.yellow}>
        SCHWERKRAFT
        <br />
        AUF DER ISS?
      </NeonText>
      <Quiz />
      {t >= line('r1').start && t < line('r2').start && (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, transform: `scale(${interpolate(pR, [0, 1], [2.2, 1])})`, opacity: Math.min(1, pR)}}>
          <div style={{fontSize: 210, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: glow(C.lime, 1.3)}}>≈ 90 %</div>
          <div style={{fontSize: 44, fontWeight: 800, color: C.lime}}>der Schwerkraft auf der Erde</div>
        </div>
      )}
      <NeonText at={wordAt('r2', 'fallen')} until={scene('reveal').end} top={220} size={110} color={C.red}>
        SIE FALLEN!
      </NeonText>
      <Orbit />
      {t >= line('b1').start && t < scene('bonus').end && (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
          <div style={{fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: 4}}>1 ERDUMRUNDUNG ≈ 90 MIN</div>
          {t > wordAt('b1', 'Crew') && (
            <>
              <div style={{fontSize: 200, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: glow(C.orange, 1.2), fontVariantNumeric: 'tabular-nums'}}>{sunrises}</div>
              <div style={{fontSize: 46, fontWeight: 900, color: C.orange}}>SONNENAUFGÄNGE PRO TAG</div>
            </>
          )}
        </div>
      )}
      <NeonText at={scene('outro').start + 0.1} top={220} size={70} color={C.cyan}>
        HÄTTEST DU&apos;S
        <br />
        GEWUSST?
      </NeonText>
      <Pill color={C.magenta} at={scene('outro').end - 2.4} top={1170} size={40}>FOLGE FÜR MEHR WELTRAUM 🚀</Pill>
      <div style={{position: 'absolute', bottom: 60, right: 40, fontFamily: FONT, fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.6)'}}>Videomaterial: NASA</div>
      <Subtitles />
    </AbsoluteFill>
  );
};
