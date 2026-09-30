import { wedding } from '../data/wedding';

const { left, right } = wedding.couple.monogram;

/** Verbundenes Monogramm M & A (Farbe via currentColor) */
export function Monogram({ className, title }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 140" role="img" aria-label={title ?? `${left} & ${right}`}>
      <text x="62" y="106" textAnchor="middle" className="mono-letter" fill="currentColor">{left}</text>
      <text x="140" y="106" textAnchor="middle" className="mono-letter" fill="currentColor">{right}</text>
      <text x="104" y="100" textAnchor="middle" className="mono-amp" fill="currentColor">&amp;</text>
    </svg>
  );
}

/** Wachssiegel (viewBox 200×200) mit geprägtem Monogramm und Goldreflex */
export function WaxSeal({ className }: { className?: string }) {
  // unregelmäßiger Wachsrand
  const pts: string[] = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = 88 + Math.sin(i * 2.7) * 3.4 + Math.cos(i * 1.3) * 2.6 + (i % 5 === 0 ? 3.5 : 0);
    pts.push(`${(100 + Math.cos(a) * rr).toFixed(1)} ${(100 + Math.sin(a) * rr).toFixed(1)}`);
  }
  const blob = `M${pts[0]} ${pts.slice(1).map((p) => `L${p}`).join(' ')} Z`;
  const dots = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return { x: 100 + Math.cos(a) * 58, y: 100 + Math.sin(a) * 58 };
  });
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="waxG" cx="40%" cy="34%" r="75%">
          <stop offset="0" stopColor="#E6CB93" />
          <stop offset=".45" stopColor="#C29A5A" />
          <stop offset=".85" stopColor="#8F6A34" />
          <stop offset="1" stopColor="#6E5025" />
        </radialGradient>
        <radialGradient id="waxInner" cx="60%" cy="66%" r="70%">
          <stop offset="0" stopColor="#D5B274" />
          <stop offset=".7" stopColor="#B38B4C" />
          <stop offset="1" stopColor="#8A6630" />
        </radialGradient>
        <linearGradient id="sheenG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF6DD" stopOpacity="0" />
          <stop offset=".5" stopColor="#FFF6DD" stopOpacity=".55" />
          <stop offset="1" stopColor="#FFF6DD" stopOpacity="0" />
        </linearGradient>
        <clipPath id="waxClip"><path d={blob} /></clipPath>
      </defs>
      {/* Schatten auf dem Papier */}
      <ellipse cx="104" cy="112" rx="86" ry="84" fill="#5A3E1A" opacity=".22" />
      <path d={blob} fill="url(#waxG)" />
      {/* eingedrückte Stempelfläche */}
      <circle cx="100" cy="100" r="68" fill="url(#waxInner)" />
      <circle cx="100" cy="100" r="68" fill="none" stroke="#6E5025" strokeOpacity=".55" strokeWidth="2" transform="translate(-1 -1.2)" />
      <circle cx="100" cy="100" r="68" fill="none" stroke="#F3E0B4" strokeOpacity=".6" strokeWidth="1.4" transform="translate(1 1.4)" />
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x - 0.5} cy={d.y - 0.6} r="1.3" fill="#6E5025" opacity=".5" />
          <circle cx={d.x + 0.4} cy={d.y + 0.5} r="1.1" fill="#F0DCAE" opacity=".55" />
        </g>
      ))}
      {/* Prägung: dunkle Kante oben-links, helle Kante unten-rechts */}
      <g className="seal-mono">
        <g transform="translate(-1.2 -1.4)" fill="#5E4420" opacity=".75">
          <text x="70" y="124" textAnchor="middle" className="seal-letter">{left}</text>
          <text x="132" y="124" textAnchor="middle" className="seal-letter">{right}</text>
          <text x="101" y="118" textAnchor="middle" className="seal-amp">&amp;</text>
        </g>
        <g transform="translate(1 1.2)" fill="#F6E4B8" opacity=".75">
          <text x="70" y="124" textAnchor="middle" className="seal-letter">{left}</text>
          <text x="132" y="124" textAnchor="middle" className="seal-letter">{right}</text>
          <text x="101" y="118" textAnchor="middle" className="seal-amp">&amp;</text>
        </g>
        <g fill="#B8914F">
          <text x="70" y="124" textAnchor="middle" className="seal-letter">{left}</text>
          <text x="132" y="124" textAnchor="middle" className="seal-letter">{right}</text>
          <text x="101" y="118" textAnchor="middle" className="seal-amp">&amp;</text>
        </g>
      </g>
      {/* dezenter Goldreflex */}
      <g clipPath="url(#waxClip)">
        <g transform="rotate(20 100 100)">
          <rect className="seal-sheen" x="-120" y="-40" width="90" height="280" fill="url(#sheenG)" />
        </g>
      </g>
      <ellipse cx="70" cy="58" rx="26" ry="11" fill="#FFF3D6" opacity=".28" transform="rotate(-28 70 58)" />
    </svg>
  );
}
