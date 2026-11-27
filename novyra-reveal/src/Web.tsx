import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, Headline, Sub, clamp, easeInOut, expoOut, r, useT} from './lib';

const T0 = 7.0;
const T1 = 11.0;

/** Demo-Webseite 1: Architekturbüro (Laptop) */
const SiteArch: React.FC<{w: number; scroll: number}> = ({w, scroll}) => (
  <div style={{width: w, fontFamily: FONT, background: '#0d0f14', color: '#f2efe8', transform: `translateY(${-scroll}px)`}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 34px', fontSize: 14, letterSpacing: '0.2em'}}>
      <b style={{letterSpacing: '0.35em'}}>MONOLITH</b>
      <span style={{color: '#a8a296'}}>PROJEKTE · STUDIO · KONTAKT</span>
    </div>
    <div style={{position: 'relative', height: 330, margin: '0 34px', borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(160deg, #2a2f3a 0%, #0e1016 70%)'}}>
      <div style={{position: 'absolute', right: 40, bottom: 0, width: 220, height: 260, background: 'linear-gradient(90deg, #c9c2b3, #6d675c)', clipPath: 'polygon(20% 0, 100% 10%, 100% 100%, 0 100%)'}} />
      <div style={{position: 'absolute', right: 180, bottom: 0, width: 140, height: 170, background: 'linear-gradient(90deg, #8a8476, #3e3a33)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))'}} />
      <div style={{position: 'absolute', left: 34, top: 60, fontSize: 48, fontWeight: 300, lineHeight: 1.05}}>
        Architektur,
        <br />
        <b style={{fontWeight: 800}}>die bleibt.</b>
      </div>
      <div style={{position: 'absolute', left: 34, top: 200, padding: '12px 24px', borderRadius: 30, background: '#f2efe8', color: '#111', fontSize: 14, fontWeight: 700}}>Projekte ansehen →</div>
    </div>
    <div style={{display: 'flex', gap: 18, padding: '26px 34px'}}>
      {['Wohnen', 'Gewerbe', 'Interior'].map((x, i) => (
        <div key={x} style={{flex: 1, height: 190, borderRadius: 14, background: `linear-gradient(${150 + i * 30}deg, #3a3f4c, #15171d)`, padding: 16, fontSize: 18, fontWeight: 700}}>{x}</div>
      ))}
    </div>
    <div style={{padding: '10px 34px 40px', fontSize: 30, fontWeight: 300}}>Ausgezeichnet mit 12 Designpreisen.</div>
    <div style={{display: 'flex', gap: 18, padding: '0 34px 40px'}}>
      {[0, 1].map((i) => (
        <div key={i} style={{flex: 1, height: 220, borderRadius: 14, background: `linear-gradient(${200 + i * 40}deg, #4a4f5c, #121318)`}} />
      ))}
    </div>
  </div>
);

/** Demo-Webseite 2: Uhrenmarke (Smartphone) */
const SiteWatch: React.FC<{w: number; scroll: number}> = ({w, scroll}) => (
  <div style={{width: w, fontFamily: FONT, background: 'linear-gradient(#0b0b0e, #16120a)', color: '#f4ead2', transform: `translateY(${-scroll}px)`}}>
    <div style={{padding: '40px 20px 12px', textAlign: 'center', letterSpacing: '0.4em', fontSize: 13, fontWeight: 700}}>AURELIUS</div>
    <div style={{margin: '10px auto', width: 190, height: 190, borderRadius: 95, background: 'radial-gradient(circle at 35% 30%, #fff3cf, #c7a24f 35%, #5a4417 75%)', boxShadow: '0 20px 50px rgba(200,160,70,0.35)', position: 'relative'}}>
      <div style={{position: 'absolute', inset: 22, borderRadius: '50%', background: 'radial-gradient(circle, #1a1a20, #08080a)', border: '2px solid #d8b86a'}} />
      <div style={{position: 'absolute', left: 94, top: 48, width: 3, height: 50, background: '#f4ead2', transformOrigin: 'bottom', transform: 'rotate(40deg)'}} />
      <div style={{position: 'absolute', left: 94, top: 66, width: 3, height: 32, background: '#d8b86a', transformOrigin: 'bottom', transform: 'rotate(-60deg)'}} />
    </div>
    <div style={{textAlign: 'center', fontSize: 30, fontWeight: 300, marginTop: 18, lineHeight: 1.1}}>
      Zeit, neu
      <br />
      <b>definiert.</b>
    </div>
    <div style={{margin: '18px auto', width: 160, textAlign: 'center', padding: '10px 0', borderRadius: 24, background: '#d8b86a', color: '#16120a', fontSize: 13, fontWeight: 800}}>Kollektion entdecken</div>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{margin: '14px 18px', height: 120, borderRadius: 16, background: `linear-gradient(${120 + i * 50}deg, #2a2418, #0b0b0e)`, border: '1px solid rgba(216,184,106,0.25)'}} />
    ))}
  </div>
);

/** Demo-Webseite 3: SaaS-Analytics (Tablet) */
const SiteSaas: React.FC<{w: number; scroll: number}> = ({w, scroll}) => (
  <div style={{width: w, fontFamily: FONT, background: '#f5f7fb', color: '#0d1426', transform: `translateY(${-scroll}px)`}}>
    <div style={{display: 'flex', justifyContent: 'space-between', padding: '18px 24px', fontSize: 14, fontWeight: 700}}>
      <span style={{color: C.blue, fontWeight: 900}}>◆ flowbase</span>
      <span style={{padding: '6px 14px', borderRadius: 16, background: '#0d1426', color: '#fff', fontSize: 12}}>Demo buchen</span>
    </div>
    <div style={{padding: '24px 24px 10px', fontSize: 40, fontWeight: 800, lineHeight: 1.05}}>
      Daten, die
      <br />
      <span style={{color: C.blue}}>Entscheidungen</span> treffen.
    </div>
    <div style={{margin: '16px 24px', height: 230, borderRadius: 18, background: '#fff', boxShadow: '0 12px 30px rgba(20,40,90,0.12)', padding: 18}}>
      <svg width={w - 84} height={190}>
        {[0.3, 0.5, 0.42, 0.7, 0.62, 0.85, 0.78].map((v, i, a) =>
          i ? <line key={i} x1={((i - 1) / 6) * (w - 84)} y1={190 - a[i - 1] * 170} x2={(i / 6) * (w - 84)} y2={190 - v * 170} stroke={C.blue} strokeWidth={5} strokeLinecap="round" /> : null,
        )}
        {[0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 0.75].map((v, i) => (
          <rect key={i} x={(i / 6) * (w - 84) - 10} y={190 - v * 90} width={20} height={v * 90} rx={6} fill="rgba(47,123,255,0.18)" />
        ))}
      </svg>
    </div>
    <div style={{display: 'flex', gap: 14, padding: '6px 24px'}}>
      {['+38 %', '2,4 s', '99,9 %'].map((x) => (
        <div key={x} style={{flex: 1, padding: 16, borderRadius: 16, background: '#fff', boxShadow: '0 8px 20px rgba(20,40,90,0.08)', fontSize: 24, fontWeight: 800}}>{x}</div>
      ))}
    </div>
    <div style={{margin: '20px 24px', height: 260, borderRadius: 18, background: 'linear-gradient(135deg, #2f7bff, #8b5cff)'}} />
  </div>
);

/** Gerät mit metallischem Rahmen, Glasreflexion und Bildschirm */
const Device: React.FC<{w: number; h: number; radius: number; bezel: number; children: React.ReactNode; glare: number; style?: React.CSSProperties}> = ({w, h, radius, bezel, children, glare, style}) => (
  <div style={{position: 'absolute', width: w, height: h, borderRadius: radius, padding: bezel, background: 'linear-gradient(145deg, #e8ebf1 0%, #7c8494 22%, #2b2f38 50%, #9aa2b2 78%, #3a3f4a 100%)', boxShadow: '0 50px 120px rgba(0,0,0,0.75), 0 0 60px rgba(60,120,255,0.18)', ...style}}>
    <div style={{width: '100%', height: '100%', borderRadius: radius - bezel, background: '#000', padding: bezel * 0.6, boxSizing: 'border-box'}}>
      <div style={{width: '100%', height: '100%', borderRadius: radius - bezel * 1.4, overflow: 'hidden', position: 'relative'}}>
        {children}
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${glare * 100 - 30}%, rgba(255,255,255,0.16) ${glare * 100 - 10}%, transparent ${glare * 100 + 10}%)`}} />
      </div>
    </div>
  </div>
);

/** 7–11 s: Laptop, Tablet und Smartphone mit Webseiten, Kamera umkreist die Geräte */
export const Web: React.FC = () => {
  const t = useT();
  if (t < T0 - 0.3 || t > T1 + 0.4) return null;
  const s = t - T0;
  const orbit = r(0, 4, s, -24, 20);
  const tilt = r(0, 4, s, 12, 4);
  const inK = expoOut(s / 1.0);
  const outK = easeInOut((t - (T1 - 0.4)) / 0.5);
  const scroll = (v: number, d: number) => Math.max(0, (s - d) * v) % 600;
  const glare = clamp((s - 0.3) / 3);
  const bob = (i: number) => Math.sin(t * 1.4 + i * 1.7) * 10;
  return (
    <AbsoluteFill style={{perspective: 1700, perspectiveOrigin: '50% 38%', opacity: clamp((t - T0 + 0.3) / 0.35) * (1 - outK)}}>
      <div style={{position: 'absolute', left: 540, top: 720, transformStyle: 'preserve-3d', transform: `translateY(${(1 - inK) * 500}px) rotateX(${tilt}deg) rotateY(${orbit}deg) scale(${0.78 + 0.08 * inK + outK * 0.3})`, filter: `blur(${(1 - inK) * 12 + outK * 10}px)`}}>
        {/* Tablet links hinten */}
        <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `translate3d(-520px, ${-330 + bob(1)}px, -260px) rotateY(28deg)`}}>
          <Device w={470} h={640} radius={36} bezel={10} glare={glare}>
            <SiteSaas w={432} scroll={scroll(70, 0.6)} />
          </Device>
        </div>
        {/* Laptop Mitte */}
        <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `translate3d(-430px, ${-300 + bob(2)}px, 0px)`}}>
          <div style={{position: 'absolute', transformOrigin: '50% 100%', transform: 'rotateX(-8deg)'}}>
            <Device w={860} h={540} radius={24} bezel={8} glare={glare}>
              <SiteArch w={826} scroll={scroll(90, 0.4)} />
            </Device>
          </div>
          {/* Tastatur-Unterteil */}
          <div style={{position: 'absolute', top: 540, left: -40, width: 940, height: 300, transformOrigin: '50% 0', transform: 'rotateX(80deg)', borderRadius: '0 0 28px 28px', background: 'linear-gradient(180deg, #b8bfcb, #59606d)', boxShadow: '0 40px 80px rgba(0,0,0,0.8)'}}>
            <div style={{margin: '26px 60px', height: 150, borderRadius: 10, background: 'repeating-linear-gradient(90deg, #2a2e37 0 54px, #424854 54px 58px)'}} />
            <div style={{margin: '0 auto', width: 300, height: 90, borderRadius: 10, background: 'rgba(0,0,0,0.25)'}} />
          </div>
        </div>
        {/* Smartphone rechts vorne */}
        <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `translate3d(210px, ${-110 + bob(3)}px, 220px) rotateY(-22deg)`}}>
          <Device w={290} h={600} radius={48} bezel={9} glare={glare}>
            <SiteWatch w={254} scroll={scroll(60, 0.8)} />
            <div style={{position: 'absolute', top: 10, left: '50%', width: 80, height: 22, marginLeft: -40, borderRadius: 11, background: '#000'}} />
          </Device>
        </div>
      </div>
      {/* Lichtübergang vom ERP zu den Geräten */}
      <AbsoluteFill style={{background: `linear-gradient(100deg, transparent ${r(-0.2, 0.6, s, -20, 120)}%, rgba(140,190,255,0.85) ${r(-0.2, 0.6, s, -5, 135)}%, transparent ${r(-0.2, 0.6, s, 10, 150)}%)`, mixBlendMode: 'screen', opacity: s < 0.7 ? 1 : 0}} />
      <Headline text="WEBSEITEN." at={T0 + 0.7} out={T1 - 0.4} top={1340} size={92} />
      <Sub text="Design, das beeindruckt." at={T0 + 1.1} out={T1 - 0.4} top={1458} />
    </AbsoluteFill>
  );
};
