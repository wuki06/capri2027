import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, Glass, Headline, Sub, clamp, easeInOut, easeOut, expoOut, r, useT} from './lib';

const T0 = 3.0;
const T1 = 7.0;
const eur = (n: number) => Math.round(n).toLocaleString('de-DE');

const Label: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = '#8fa3c8'}) => (
  <div style={{fontSize: 17, fontWeight: 700, letterSpacing: '0.14em', color, textTransform: 'uppercase'}}>{children}</div>
);

const Revenue: React.FC<{k: number}> = ({k}) => {
  const pts = [0.22, 0.3, 0.26, 0.38, 0.35, 0.47, 0.44, 0.58, 0.55, 0.68, 0.74, 0.86];
  const W = 560;
  const H = 190;
  const n = Math.max(2, Math.floor(pts.length * k) + 1);
  const d = pts.slice(0, n).map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * W},${H - v * H}`).join(' ');
  return (
    <div style={{padding: 30}}>
      <Label>Umsatz 2026</Label>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 6}}>
        <div style={{fontSize: 64, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>€ {eur(1284560 * easeOut(k))}</div>
        <div style={{fontSize: 24, fontWeight: 700, color: '#5ee39a'}}>▲ {(24.8 * easeOut(k)).toFixed(1).replace('.', ',')} %</div>
      </div>
      <svg width={W} height={H + 10} style={{marginTop: 14}}>
        <defs>
          <linearGradient id="rv" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={C.blue} stopOpacity="0.55" />
            <stop offset="1" stopColor={C.blue} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.07)" />
        ))}
        <path d={`${d} L${((n - 1) / (pts.length - 1)) * W},${H} L0,${H} Z`} fill="url(#rv)" />
        <path d={d} fill="none" stroke="#7fb6ff" strokeWidth={4} style={{filter: 'drop-shadow(0 0 8px #3f8cff)'}} />
      </svg>
    </div>
  );
};

const Customers: React.FC<{k: number}> = ({k}) => {
  const rows = [
    ['Atlas Bau GmbH', 'Aktiv', '#5ee39a'],
    ['Nordlicht Logistik', 'Neu', '#7fb6ff'],
    ['Brenner & Partner', 'Aktiv', '#5ee39a'],
    ['Vela Medical AG', 'Termin', '#c49bff'],
  ];
  return (
    <div style={{padding: 26}}>
      <Label>Kundenverwaltung</Label>
      <div style={{fontSize: 40, fontWeight: 800, marginTop: 4}}>{Math.round(2318 * easeOut(k)).toLocaleString('de-DE')} <span style={{fontSize: 20, color: '#8fa3c8', fontWeight: 600}}>Kunden</span></div>
      {rows.map(([n, s, c], i) => (
        <div key={n} style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, opacity: clamp(k * 4 - i * 0.6)}}>
          <div style={{width: 34, height: 34, borderRadius: 17, background: `linear-gradient(135deg, ${c}, #1b2340)`}} />
          <div style={{flex: 1, fontSize: 20, fontWeight: 600}}>{n}</div>
          <div style={{fontSize: 15, fontWeight: 700, color: c, border: `1px solid ${c}`, borderRadius: 20, padding: '3px 10px'}}>{s}</div>
        </div>
      ))}
    </div>
  );
};

const Invoices: React.FC<{k: number}> = ({k}) => {
  const rows = [
    ['RE-2026-0418', '12.480 €', 'Bezahlt', '#5ee39a'],
    ['AN-2026-0211', '38.900 €', 'Angebot', '#7fb6ff'],
    ['RE-2026-0419', '4.215 €', 'Offen', '#ffb547'],
  ];
  return (
    <div style={{padding: 26}}>
      <Label>Angebote & Rechnungen</Label>
      {rows.map(([id, sum, st, c], i) => (
        <div key={id} style={{display: 'flex', alignItems: 'center', marginTop: 16, gap: 10, opacity: clamp(k * 4 - i * 0.7)}}>
          <div style={{flex: 1, fontSize: 18, fontWeight: 600, color: '#b8c4dc', fontVariantNumeric: 'tabular-nums'}}>{id}</div>
          <div style={{fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums'}}>{sum}</div>
          <div style={{width: 90, textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#0b0e18', background: c, borderRadius: 14, padding: '4px 0'}}>{st}</div>
        </div>
      ))}
    </div>
  );
};

const Projects: React.FC<{k: number}> = ({k}) => {
  const ps = [
    ['Website-Relaunch', 0.82, C.cyan],
    ['ERP-Migration', 0.64, C.blue],
    ['Automatisierung', 0.41, C.violet],
  ] as const;
  return (
    <div style={{padding: 26}}>
      <Label>Projektmanagement</Label>
      {ps.map(([n, v, c], i) => (
        <div key={n} style={{marginTop: 16}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600}}>
            <span>{n}</span>
            <span style={{color: '#8fa3c8', fontVariantNumeric: 'tabular-nums'}}>{Math.round(v * 100 * easeOut(k - i * 0.1))} %</span>
          </div>
          <div style={{height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', marginTop: 8}}>
            <div style={{width: `${v * 100 * easeOut(k - i * 0.1)}%`, height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${c}, #ffffff)`, boxShadow: `0 0 12px ${c}`}} />
          </div>
        </div>
      ))}
    </div>
  );
};

const Team: React.FC<{k: number}> = ({k}) => {
  const ini = ['LM', 'SK', 'JT', 'AN', 'RB'];
  return (
    <div style={{padding: 26}}>
      <Label>Mitarbeiter</Label>
      <div style={{display: 'flex', marginTop: 14}}>
        {ini.map((x, i) => (
          <div key={x} style={{width: 54, height: 54, borderRadius: 27, marginLeft: i ? -12 : 0, border: '3px solid #141a2c', background: `linear-gradient(135deg, ${[C.blue, C.violet, C.cyan, '#5ee39a', '#ffb547'][i]}, #1b2340)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, transform: `scale(${clamp(k * 5 - i * 0.5)})`}}>
            {x}
          </div>
        ))}
      </div>
      <div style={{fontSize: 18, color: '#8fa3c8', marginTop: 14, fontWeight: 600}}>Auslastung <span style={{color: '#fff', fontWeight: 800}}>{Math.round(87 * easeOut(k))} %</span></div>
    </div>
  );
};

const Stock: React.FC<{k: number}> = ({k}) => {
  const bars = [0.8, 0.55, 0.92, 0.35, 0.7, 0.6];
  return (
    <div style={{padding: 26}}>
      <Label>Lagerverwaltung</Label>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, marginTop: 14}}>
        {bars.map((b, i) => (
          <div key={i} style={{flex: 1, height: `${b * 100 * easeOut(k * 1.3 - i * 0.08)}%`, borderRadius: 6, background: b < 0.4 ? 'linear-gradient(#ffb547,#7a4a10)' : `linear-gradient(${C.cyan}, ${C.blue})`, boxShadow: '0 0 12px rgba(80,160,255,0.4)'}} />
        ))}
      </div>
      <div style={{fontSize: 17, color: '#8fa3c8', marginTop: 10, fontWeight: 600}}>{Math.round(14820 * easeOut(k)).toLocaleString('de-DE')} Artikel · 1 Nachbestellung</div>
    </div>
  );
};

const Process: React.FC<{k: number; t: number}> = ({k, t}) => {
  const steps = ['Angebot', 'Auftrag', 'Lieferung', 'Rechnung'];
  const W = 860;
  return (
    <div style={{padding: '22px 30px'}}>
      <Label>Digitaler Geschäftsprozess · automatisiert</Label>
      <div style={{position: 'relative', height: 90, marginTop: 14}}>
        <div style={{position: 'absolute', left: 40, right: 40, top: 34, height: 3, background: 'rgba(127,182,255,0.25)'}} />
        <div style={{position: 'absolute', left: 40 + ((t * 0.9) % 1) * (W - 80 - 60), top: 28, width: 14, height: 14, borderRadius: 7, background: '#fff', boxShadow: `0 0 18px ${C.cyan}`}} />
        {steps.map((s, i) => (
          <div key={s} style={{position: 'absolute', left: 40 + (i / 3) * (W - 80 - 60) - 50, width: 100, top: 0, textAlign: 'center', opacity: clamp(k * 4 - i * 0.6)}}>
            <div style={{width: 70, height: 70, margin: '0 auto', borderRadius: 20, background: 'linear-gradient(135deg, rgba(80,140,255,0.35), rgba(139,92,255,0.25))', border: '1.5px solid rgba(150,190,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28}}>
              {['✎', '✓', '⇄', '€'][i]}
            </div>
            <div style={{fontSize: 16, fontWeight: 700, marginTop: 6, color: '#c9d3e6'}}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 3–7 s: ERP-Dashboard aus schwebenden Glas-Elementen */
export const ERP: React.FC = () => {
  const t = useT();
  if (t < T0 - 0.2 || t > T1 + 0.4) return null;
  const s = t - T0;
  const k = clamp(s / 2.6);
  // Kamerafahrt durch die Oberfläche
  const rotY = r(0, 4, s, -26, 10);
  const rotX = r(0, 4, s, 22, 8);
  const dolly = r(0, 4, s, -260, 120);
  // Übergang: Lichtschnitt & Kollaps in Richtung Geräte
  const outK = easeInOut((t - (T1 - 0.45)) / 0.5);
  const enterOp = clamp((t - T0 + 0.15) / 0.3);
  const panel = (i: number, x: number, y: number, z: number, w: number, h: number, child: React.ReactNode) => {
    const a = expoOut((s - 0.08 * i) / 0.9);
    const fz = z - (1 - a) * 1800;
    return (
      <Glass style={{left: x, top: y, width: w, height: h, transform: `translateZ(${fz}px) rotateX(${(1 - a) * 25}deg)`, opacity: clamp(a * 1.6), filter: `blur(${(1 - a) * 10}px)`}}>
        {child}
      </Glass>
    );
  };
  return (
    <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 40%', opacity: enterOp * (1 - outK)}}>
      <div style={{position: 'absolute', left: 540, top: 650, transformStyle: 'preserve-3d', transform: `translateZ(${dolly - outK * 600}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${0.88 - outK * 0.35})`}}>
        <div style={{position: 'absolute', left: -480, top: -520, width: 960, height: 1040, transformStyle: 'preserve-3d'}}>
          {/* Seitenleiste */}
          {panel(0, -140, 60, -60, 110, 920, (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, paddingTop: 24}}>
              <Img src={staticFile('novyra-emblem.png')} style={{width: 64}} />
              {['▦', '◉', '❖', '✉', '⚙'].map((x, i) => (
                <div key={i} style={{width: 48, height: 48, borderRadius: 14, background: i === 0 ? 'rgba(80,140,255,0.35)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#c9d3e6'}}>{x}</div>
              ))}
            </div>
          ))}
          {panel(1, 0, 60, 40, 620, 350, <Revenue k={k} />)}
          {panel(2, 650, 60, 120, 330, 350, <Customers k={k} />)}
          {panel(3, 0, 440, 90, 400, 250, <Invoices k={k} />)}
          {panel(4, 430, 440, 0, 550, 250, <Projects k={k} />)}
          {panel(5, 0, 720, 60, 400, 230, <Team k={k} />)}
          {panel(6, 430, 720, 140, 550, 230, <Stock k={k} />)}
          {panel(7, 60, 980, 180, 920, 170, <Process k={k} t={t} />)}
          {/* Datenverbindungen zwischen den Fenstern */}
          <svg width={1200} height={1200} style={{position: 'absolute', left: -100, top: 0, transform: 'translateZ(60px)', overflow: 'visible', opacity: clamp((s - 0.9) / 0.5)}}>
            {[
              [720, 230, 750, 230],
              [410, 560, 430, 560],
              [410, 830, 430, 830],
              [300, 410, 300, 440],
              [700, 690, 700, 720],
              [600, 950, 600, 980],
            ].map(([x1, y1, x2, y2], i) => (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.cyan} strokeWidth={3} style={{filter: 'drop-shadow(0 0 6px #4fd2ff)'}} />
                <circle cx={x1 + (x2 - x1) * ((t * 1.5 + i * 0.3) % 1)} cy={y1 + (y2 - y1) * ((t * 1.5 + i * 0.3) % 1)} r={5} fill="#fff" />
              </g>
            ))}
          </svg>
        </div>
      </div>
      <Headline text="ERP-SYSTEME." at={T0 + 0.75} out={T1 - 0.45} top={1340} size={92} />
      <Sub text="Dein Unternehmen. Perfekt vernetzt." at={T0 + 1.15} out={T1 - 0.45} top={1458} />
    </AbsoluteFill>
  );
};
