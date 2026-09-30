/* ─────────────────────────────────────────────────────────────────────
   Capri — geschichtete Illustration (Himmel, Sonne, Meer, Faraglioni,
   Klippe mit Villen, Terrasse, Kerzen, Lichterketten, Olivenzweige).
   Jede Ebene ist ein eigenes Element → Parallax nur über transform.
   Tageszeit wird über CSS-Variablen (Opacity) gesteuert:
   --gold --dusk --night --shade --lights --candles --stars --sun
   Optional: echtes Foto (wedding.ts) ersetzt die gezeichnete Landschaft.
   ───────────────────────────────────────────────────────────────────── */
import { Bougainvillea, Lemon, OliveBranch, WhiteFlowers } from './Botanicals';

const LAND = { viewBox: '0 0 800 1000', preserveAspectRatio: 'xMidYMid slice' } as const;

/* Faraglioni: Stella, Mezzo (mit Bogen), Scopolo — breite, schroffe Felsen */
const STELLA = 'M240 652 C 244 620 250 590 256 566 L 262 540 C 266 524 272 514 280 510 L 288 500 C 292 492 300 490 308 494 L 318 500 C 326 504 330 516 332 528 L 338 560 C 342 590 346 620 350 652 Z';
const MEZZO = 'M362 652 C 364 626 370 604 378 590 L 386 574 C 392 564 402 558 414 558 L 432 560 C 446 562 456 572 462 586 L 470 610 C 474 624 476 638 478 652 Z M404 652 C 405 634 410 624 418 622 C 426 624 431 634 432 652 Z';
const SCOPOLO = 'M494 652 C 498 630 504 608 512 594 L 518 582 C 522 574 530 572 536 578 L 544 590 C 550 604 556 626 560 652 Z M566 652 C 570 642 578 638 586 652 Z';
const ROCKS_T = 'translate(412 652) scale(0.64) translate(-412 -652)';

const CLIFF = 'M0 330 C 70 322 130 350 160 395 C 186 436 196 500 202 600 C 206 690 210 820 214 1000 L 0 1000 Z';

function glints(n: number, cx: number, seed: number) {
  const out: { x: number; y: number; w: number; h: number; d: number }[] = [];
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const y = 606 + Math.pow(r(), 1.6) * 330;
    const spread = 8 + (y - 600) * 0.34;
    const w = 5 + r() * 18 * (0.5 + (y - 600) / 400);
    out.push({ x: cx + (r() - 0.5) * spread * 2 - w / 2, y, w, h: 1.2 + r() * 1.6, d: r() * 4 });
  }
  return out;
}

const DAY_GLINTS = glints(34, 420, 7);
const WIDE_GLINTS = glints(26, 300, 19).concat(glints(22, 600, 23));
const WINDOWS = [
  { x: 70, y: 318, w: 6, h: 9 }, { x: 84, y: 318, w: 6, h: 9 }, { x: 98, y: 318, w: 6, h: 9 },
  { x: 128, y: 344, w: 5, h: 8 }, { x: 140, y: 344, w: 5, h: 8 },
  { x: 32, y: 352, w: 6, h: 10 }, { x: 110, y: 380, w: 5, h: 7 }, { x: 150, y: 372, w: 5, h: 7 },
];
const CANDLES = [330, 530, 630, 692, 908, 970, 1070, 1270]; // Terrasse: viewBox 1600 breit, Mitte = 800

function bulbs() {
  const seg = (a: number[], c: number[], b: number[], n: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
    });
  return [...seg([-20, 40], [200, 190], [400, 92], 11), ...seg([400, 92], [600, 10], [820, 124], 11)];
}
const BULBS = bulbs();

const STARS = Array.from({ length: 46 }, (_, i) => {
  const x = (i * 173.3) % 800, y = ((i * 97.7) % 470) + 10;
  return { x, y, r: i % 7 === 0 ? 1.5 : 0.8 + ((i * 13) % 5) / 10, d: (i % 9) * 0.5 };
});

export type SceneVariant = 'hero' | 'bella' | 'music' | 'finale';

interface Props {
  variant: SceneVariant;
  photo?: string;
  /** optionales Abendfoto derselben Ansicht — wird über --k-night eingeblendet */
  photoNight?: string;
  photoAlt?: string;
  festoon?: boolean;
  candles?: boolean;
  flowers?: boolean;
  lemons?: boolean;
}

export function CapriScene({ variant, photo, photoNight, photoAlt = '', festoon, candles, flowers = true, lemons }: Props) {
  const night = variant === 'music' || variant === 'finale';
  return (
    <div className={`scene scene--${variant}${photo ? ' has-photo' : ''}${photoNight ? ' has-night-photo' : ''}`} aria-hidden={photo ? undefined : true}>
      {/* Himmel */}
      <div className="sky sky--day" />
      <div className="sky sky--gold" />
      <div className="sky sky--dusk" />
      <div className="sky sky--night" />
      {night && !photo && (
        <svg className="layer stars" {...LAND}>
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF7E3" style={{ animationDelay: `${s.d}s` }} />
          ))}
        </svg>
      )}

      {photo ? (
        <div className="layer far photo-layer">
          <img src={photo} alt={photoAlt} decoding="async" loading={variant === 'hero' ? 'eager' : 'lazy'} />
          {photoNight && <img className="photo-night" src={photoNight} alt="" decoding="async" loading="lazy" />}
        </div>
      ) : (
        <>
          {/* Ferne Ebene: Sonne, Meer, Küste */}
          <svg className="layer far" {...LAND}>
            <defs>
              <radialGradient id={`sunGlow-${variant}`} cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#FFF4DA" stopOpacity=".95" />
                <stop offset=".25" stopColor="#FBE3B6" stopOpacity=".55" />
                <stop offset="1" stopColor="#F6D8A8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`sea-${variant}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#AFC6C8" />
                <stop offset=".22" stopColor="#89A9B6" />
                <stop offset=".6" stopColor="#5E8AA3" />
                <stop offset="1" stopColor="#40677F" />
              </linearGradient>
              <linearGradient id={`haze-${variant}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F8EEDC" stopOpacity="0" />
                <stop offset=".5" stopColor="#F8EEDC" stopOpacity=".55" />
                <stop offset="1" stopColor="#F8EEDC" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="sun">
              <circle cx="420" cy="420" r="190" fill={`url(#sunGlow-${variant})`} />
              <circle cx="420" cy="420" r="26" fill="#FFF8E8" />
            </g>
            <path d="M540 600 C 590 592 640 584 690 588 C 730 591 770 582 800 578 L 800 600 Z" fill="#B3C0BF" opacity=".75" />
            <path d="M0 596 C 30 592 60 590 90 594 L 90 600 L 0 600 Z" fill="#B3C0BF" opacity=".6" />
            <rect x="0" y="600" width="800" height="400" fill={`url(#sea-${variant})`} />
            <rect x="0" y="584" width="800" height="36" fill={`url(#haze-${variant})`} />
            <g className="glints">
              {DAY_GLINTS.map((g, i) => (
                <rect key={i} x={g.x} y={g.y} width={g.w} height={g.h} rx={g.h / 2} fill="#FFF6DE" style={{ animationDelay: `${g.d}s` }} />
              ))}
            </g>
            {night && (
              <g className="glints glints--wide">
                {WIDE_GLINTS.map((g, i) => (
                  <rect key={i} x={g.x} y={g.y} width={g.w} height={g.h} rx={g.h / 2} fill="#FFE3AE" style={{ animationDelay: `${g.d}s` }} />
                ))}
              </g>
            )}
          </svg>

          {/* Mittlere Ebene: Faraglioni */}
          <svg className="layer mid" {...LAND}>
            <defs>
              <linearGradient id={`rock-${variant}`} x1="0" y1="0" x2="1" y2=".25">
                <stop offset="0" stopColor="#DDCDAE" />
                <stop offset=".52" stopColor="#CBB693" />
                <stop offset=".54" stopColor="#A89573" />
                <stop offset="1" stopColor="#8F7D61" />
              </linearGradient>
            </defs>
            <g className="rocks" transform={ROCKS_T}>
              {/* Spiegelungen */}
              <g opacity=".2" fill="#2F4E63">
                <path d="M244 656 L 346 656 L 336 694 L 254 694 Z" />
                <path d="M364 656 L 476 656 L 466 684 L 374 684 Z" />
                <path d="M496 656 L 558 656 L 550 680 L 504 680 Z" />
              </g>
              <path d={STELLA} fill={`url(#rock-${variant})`} />
              <path d={MEZZO} fill={`url(#rock-${variant})`} fillRule="evenodd" />
              <path d={SCOPOLO} fill={`url(#rock-${variant})`} fillRule="evenodd" />
              {/* Grün auf den Kuppen */}
              <path d="M276 512 C 284 500 300 492 314 500 C 304 506 290 510 276 512 Z" fill="#8C9369" />
              <path d="M384 578 C 394 564 412 558 430 562 C 416 570 400 574 384 578 Z" fill="#8C9369" />
              <path d="M514 588 C 520 578 530 574 538 582 C 530 586 522 588 514 588 Z" fill="#8C9369" />
              {/* Brandung */}
              <g fill="#FBF6EA" opacity=".8">
                <ellipse cx="295" cy="653" rx="60" ry="2.6" />
                <ellipse cx="420" cy="653" rx="62" ry="2.6" />
                <ellipse cx="528" cy="653" rx="40" ry="2.2" />
              </g>
            </g>
          </svg>

          {/* Nahe Ebene: Klippe mit Villen */}
          <svg className="layer near" {...LAND}>
            <defs>
              <linearGradient id={`cliff-${variant}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#A08C6C" />
                <stop offset="1" stopColor="#C9B58F" />
              </linearGradient>
            </defs>
            <path d={CLIFF} fill={`url(#cliff-${variant})`} />
            <path d="M160 395 C 186 436 196 500 202 600 C 206 690 210 820 214 1000 L 196 1000 C 192 800 188 640 180 520 C 174 460 168 420 160 395 Z" fill="#8A785B" opacity=".45" />
            {/* Villen */}
            <g>
              <rect x="56" y="300" width="60" height="42" fill="#F3ECDF" />
              <rect x="116" y="310" width="10" height="32" fill="#DCCFB8" />
              <rect x="120" y="332" width="34" height="28" fill="#EFE7D8" />
              <rect x="20" y="340" width="40" height="30" fill="#EDE4D2" />
              <rect x="98" y="366" width="64" height="26" fill="#F1E9DA" />
              <path d="M56 300 L 116 300 L 116 296 L 56 296 Z" fill="#E3D6BF" />
              {WINDOWS.map((w, i) => (
                <path key={i} d={`M${w.x} ${w.y + w.h} V ${w.y + w.w / 2} A ${w.w / 2} ${w.w / 2} 0 0 1 ${w.x + w.w} ${w.y + w.w / 2} V ${w.y + w.h} Z`} fill="#7C7667" />
              ))}
              {/* Bougainvillea-Tupfen */}
              <g fill="#D7A0A2" opacity=".9">
                <circle cx="60" cy="342" r="7" /><circle cx="68" cy="346" r="5" /><circle cx="122" cy="360" r="6" />
                <circle cx="158" cy="392" r="5" /><circle cx="24" cy="372" r="6" />
              </g>
              {/* Zypressen & Pinie */}
              <path d="M8 342 C 2 310 6 270 12 250 C 18 270 22 310 16 342 Z" fill="#5E6B45" />
              <path d="M170 360 C 166 334 168 306 174 292 C 180 306 182 334 178 360 Z" fill="#65714B" />
              <path d="M140 300 L 142 262" stroke="#6B5B45" strokeWidth="3" />
              <path d="M112 266 C 124 250 164 248 176 262 C 164 270 124 272 112 266 Z" fill="#6E7A4F" />
              {/* Grün entlang der Kante */}
              <path d="M0 330 C 30 324 50 326 70 330 C 50 340 20 342 0 340 Z" fill="#7D8560" />
              <path d="M150 384 C 164 390 176 404 184 420 C 170 414 156 402 150 384 Z" fill="#7D8560" />
              <path d="M186 460 C 192 480 196 500 198 520 C 190 506 186 486 186 460 Z" fill="#7D8560" opacity=".8" />
            </g>
          </svg>
        </>
      )}

      {/* Vordergrund: Terrasse (nur bei Illustration — Fotos haben ihren eigenen Vordergrund) */}
      {!photo && (<>
      <div className="terrace-wrap">
        <svg className="terrace" viewBox="0 0 1600 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            <linearGradient id={`stone-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F2EADB" />
              <stop offset="1" stopColor="#DCCDB1" />
            </linearGradient>
            <linearGradient id={`candle-${variant}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#F9F3E6" />
              <stop offset="1" stopColor="#E3D6BE" />
            </linearGradient>
          </defs>
          {Array.from({ length: 65 }, (_, i) => {
            const x = i * 25 - 4;
            return (
              <path key={i} d={`M${x} 128 h 14 c 0 6 -4 8 -4 14 c 0 8 7 12 7 22 c 0 8 -4 12 -4 18 h -12 c 0 -6 -4 -10 -4 -18 c 0 -10 7 -14 7 -22 c 0 -6 -4 -8 -4 -14 z`} fill={`url(#stone-${variant})`} stroke="#CDBC9D" strokeWidth=".6" />
            );
          })}
          <rect x="-10" y="108" width="1620" height="20" fill={`url(#stone-${variant})`} />
          <rect x="-10" y="126" width="1620" height="3" fill="#C9B796" opacity=".6" />
          <rect x="-10" y="184" width="1620" height="16" fill="#E2D5BC" />
          {candles && CANDLES.map((x, i) => (
            <g key={i}>
              <rect x={x} y={i % 2 ? 80 : 86} width="13" height={i % 2 ? 28 : 22} rx="1.5" fill={`url(#candle-${variant})`} />
              <path d={`M${x + 6.5} ${(i % 2 ? 80 : 86)} v -4`} stroke="#4A3F30" strokeWidth="1" />
            </g>
          ))}
        </svg>
        {flowers && (
          <>
            <Bougainvillea className="terrace-bloom terrace-bloom--l" seed={variant.length} />
            <WhiteFlowers className="terrace-bloom terrace-bloom--r" seed={variant.length + 4} />
          </>
        )}
      </div>

      {/* Olivenzweige ganz vorne */}
      <div className="leaf leaf--l"><OliveBranch className="leaf-svg" seed={variant.length * 3 + 1} /></div>
      <div className="leaf leaf--r"><OliveBranch className="leaf-svg" seed={variant.length * 5 + 2} leaves={22} /></div>
      {lemons && (
        <div className="lemons">
          <Lemon className="lemon lemon--a" />
          <Lemon className="lemon lemon--b" />
        </div>
      )}
      </>)}
      {/* warmes Golden-Hour-Licht & Abendschatten */}
      <div className="tint tint--gold" />
      <div className="tint tint--shade" />

      {/* Lichter (liegen über dem Abendschatten) */}
      {night && !photo && (
        <svg className="layer near lights" {...LAND}>
          <g fill="#FFD99A">
            {WINDOWS.map((w, i) => (
              <path key={i} d={`M${w.x} ${w.y + w.h} V ${w.y + w.w / 2} A ${w.w / 2} ${w.w / 2} 0 0 1 ${w.x + w.w} ${w.y + w.w / 2} V ${w.y + w.h} Z`} />
            ))}
          </g>
          <g className="reflect" fill="#FFD58F">
            {[40, 76, 96, 132, 150].flatMap((x, i) => [0, 1, 2, 3].map((k) => (
              <rect key={`${i}-${k}`} x={x - 3 + ((k * 5 + i) % 4) * 1.5} y={606 + k * 9 + (i % 2) * 3} width={7 - k} height="1.6" rx=".8" style={{ animationDelay: `${(i + k) * 0.45}s` }} />
            )))}
          </g>
        </svg>
      )}

      {festoon && !photo && (
        <svg className="layer festoon" viewBox="0 0 800 300" preserveAspectRatio="xMidYMin slice">
          <defs>
            <radialGradient id="bulbGlow">
              <stop offset="0" stopColor="#FFE2A6" stopOpacity=".75" />
              <stop offset="1" stopColor="#FFE2A6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M-20 40 Q 200 190 400 92 Q 600 10 820 124" fill="none" stroke="#3D3528" strokeWidth="1.1" opacity=".55" />
          {BULBS.map(([x, y], i) => (
            <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
              <path d="M0 0 V 6" stroke="#3D3528" strokeWidth=".9" opacity=".6" />
              <g className="bulb" style={{ animationDelay: `${(i % 7) * 0.4}s`, transitionDelay: `${i * 40}ms` }}>
                <circle cx="0" cy="11" r="16" fill="url(#bulbGlow)" />
                <circle cx="0" cy="11" r="3.4" fill="#FFF1CF" />
              </g>
            </g>
          ))}
        </svg>
      )}

      {candles && !photo && (
        <div className="terrace-wrap terrace-wrap--lights">
            <svg className="terrace flames" viewBox="0 0 1600 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <defs>
                <radialGradient id={`flameGlow-${variant}`}>
                  <stop offset="0" stopColor="#FFD58A" stopOpacity=".7" />
                  <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
                </radialGradient>
              </defs>
              {CANDLES.map((x, i) => {
                const top = i % 2 ? 80 : 86;
                return (
                  <g key={i} className="flame" style={{ transitionDelay: `${i * 120}ms` }}>
                    <circle cx={x + 6.5} cy={top - 10} r="30" fill={`url(#flameGlow-${variant})`} />
                    <g className="flicker" style={{ animationDelay: `${i * 0.37}s`, transformOrigin: `${x + 6.5}px ${top - 3}px` }}>
                      <path d={`M${x + 6.5} ${top - 17} C ${x + 10.5} ${top - 10} ${x + 10} ${top - 4} ${x + 6.5} ${top - 3} C ${x + 3} ${top - 4} ${x + 2.5} ${top - 10} ${x + 6.5} ${top - 17} Z`} fill="#FFE7B0" />
                      <ellipse cx={x + 6.5} cy={top - 7} rx="1.4" ry="2.6" fill="#FFFBEF" />
                    </g>
                  </g>
                );
              })}
            </svg>
        </div>
      )}
    </div>
  );
}
